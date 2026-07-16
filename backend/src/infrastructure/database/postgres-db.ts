import { Pool, PoolClient } from 'pg';
import { logger } from '../../shared/logger';

/** Default connection string pointing to local development PostgreSQL database. */
const DEFAULT_CONNECTION_STRING = 'postgresql://postgres:postgres@localhost:5432/stadium_ops';

/** Connection pool sizing bounds. */
const MAX_POOL_CLIENTS = 20;

/** Client idle connection timeout limit (milliseconds). */
const IDLE_TIMEOUT_MS = 30000;

/** Connection request timeout limit (milliseconds). */
const CONNECTION_TIMEOUT_MS = 2000;

/**
 * Wrapper class managing connection and query executions for PostgreSQL pool driver.
 * Decouples table schema creation and seeding from controller route handling.
 */
export class PostgresDatabase {
  private pool: Pool | null = null;
  private readonly connectionString: string;

  constructor(connectionString?: string) {
    this.connectionString = connectionString ?? process.env.DATABASE_URL ?? DEFAULT_CONNECTION_STRING;
  }

  /**
   * Returns the active PostgreSQL connection pool instance.
   * @throws Error if connection pool is not initialized
   */
  public getPool(): Pool {
    if (!this.pool) {
      throw new Error('Postgres Pool is not initialized. Call initialize() first.');
    }
    return this.pool;
  }

  /**
   * Configures connection parameters and seeds table metadata.
   */
  public async initialize(): Promise<void> {
    this.pool = new Pool({
      connectionString: this.connectionString,
      max: MAX_POOL_CLIENTS,
      idleTimeoutMillis: IDLE_TIMEOUT_MS,
      connectionTimeoutMillis: CONNECTION_TIMEOUT_MS
    });

    const client = await this.pool.connect();
    try {
      await this.runMigrations(client);
      await this.seedDefaultData(client);
      logger.info('Postgres connection pool successfully initialized.');
    } finally {
      client.release();
    }
  }

  /**
   * Run a parametrized SQL query against the connection pool.
   * 
   * @param sql Parametrized query string
   * @param params Parameter replacement values list
   */
  public async query<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    const res = await this.getPool().query(sql, params);
    return res.rows as T[];
  }

  /**
   * Gracefully drains the connection pool.
   */
  public async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      logger.info('Postgres connection pool closed.');
    }
  }

  /**
   * Bootstraps SQL tables in the connected database schema.
   */
  private async runMigrations(client: PoolClient): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS matches (
        id VARCHAR(255) PRIMARY KEY,
        home_team VARCHAR(255) NOT NULL,
        away_team VARCHAR(255) NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP NOT NULL,
        status VARCHAR(50) NOT NULL,
        venue VARCHAR(255) NOT NULL,
        referee VARCHAR(255) NOT NULL,
        safety_log TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS gates (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        turnstile_flow_rate INTEGER NOT NULL,
        current_occupancy INTEGER NOT NULL,
        capacity_limit INTEGER NOT NULL,
        status VARCHAR(50) NOT NULL,
        last_updated TIMESTAMP NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id VARCHAR(255) PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        severity VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL,
        location VARCHAR(255) NOT NULL,
        reported_by VARCHAR(255) NOT NULL,
        assigned_staff VARCHAR(255),
        ai_summary TEXT,
        timeline TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS volunteers (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        name VARCHAR(255) NOT NULL,
        assigned_section VARCHAR(255) NOT NULL,
        skills TEXT NOT NULL,
        status VARCHAR(50) NOT NULL,
        current_task TEXT,
        check_in_time TIMESTAMP,
        check_out_time TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS telemetry (
        stadium_id VARCHAR(255) PRIMARY KEY,
        total_attendance INTEGER NOT NULL,
        active_gates_count INTEGER NOT NULL,
        congested_gates_count INTEGER NOT NULL,
        average_queue_time DOUBLE PRECISION NOT NULL,
        co2_level DOUBLE PRECISION NOT NULL,
        temperature DOUBLE PRECISION NOT NULL,
        sustainability_score DOUBLE PRECISION NOT NULL,
        power_consumption DOUBLE PRECISION NOT NULL,
        water_usage DOUBLE PRECISION NOT NULL,
        carbon_footprint DOUBLE PRECISION NOT NULL,
        timestamp TIMESTAMP NOT NULL
      )
    `);
  }

  /**
   * Appends mock seed row elements if tables are currently empty.
   */
  private async seedDefaultData(client: PoolClient): Promise<void> {
    const checkRes = await client.query('SELECT id FROM gates LIMIT 1');
    if (checkRes.rowCount === 0) {
      const now = new Date();
      await client.query(`
        INSERT INTO gates (id, name, turnstile_flow_rate, current_occupancy, capacity_limit, status, last_updated)
        VALUES 
        ('gate-1', 'North Gate 1', 120, 800, 1200, 'Open', $1),
        ('gate-2', 'East Gate 2', 240, 1150, 1200, 'Congested', $1),
        ('gate-3', 'South Gate 3', 0, 0, 1000, 'Closed', $1),
        ('gate-4', 'West Gate 4', 90, 400, 1000, 'Open', $1)
      `, [now]);

      await client.query(`
        INSERT INTO telemetry (stadium_id, total_attendance, active_gates_count, congested_gates_count, average_queue_time, co2_level, temperature, sustainability_score, power_consumption, water_usage, carbon_footprint, timestamp)
        VALUES ('stadium-main', 2350, 3, 1, 18.5, 520.0, 24.5, 82.0, 450.0, 120.0, 180.4, $1)
      `, [now]);
    }
  }
}

export const postgresDbInstance = new PostgresDatabase();
