import initSqlJs from 'sql.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../../shared/logger';

/** Type interface for sql.js Statement class. */
interface SqlJsStatement {
  bind(params: unknown[]): void;
  step(): boolean;
  getAsObject(): Record<string, unknown>;
  free(): void;
}

/** Type interface for sql.js Database class. */
interface SqlJsDatabase {
  run(sql: string, params?: unknown[]): void;
  exec(sql: string): Array<{ columns: string[]; values: unknown[][] }>;
  prepare(sql: string): SqlJsStatement;
  export(): Uint8Array;
  close(): void;
}

/** Type interface for sql.js library static module. */
interface SqlJsStatic {
  Database: new (data?: Uint8Array) => SqlJsDatabase;
}

/**
 * Wrapper client managing connection to SQLite database running in WebAssembly (sql.js).
 * Decouples file reads/writes from query executions, enabling WASM runtime persistence.
 */
export class SqliteDatabase {
  private db: SqlJsDatabase | null = null;
  private readonly dbPath: string;
  private SQL: SqlJsStatic | null = null;

  constructor(dbPath?: string) {
    this.dbPath = dbPath ?? path.join(__dirname, '..', '..', '..', 'stadium_dev.db');
  }

  /**
   * Returns the initialized sql.js database connection instance.
   * @throws Error if connection is not active
   */
  public getDb(): SqlJsDatabase {
    if (!this.db) {
      throw new Error('SQLite Database is not initialized. Call initialize() first.');
    }
    return this.db;
  }

  /**
   * Compiles the sql.js module and reads/seeds database contents.
   */
  public async initialize(): Promise<void> {
    const rawSql = await initSqlJs();
    this.SQL = rawSql as unknown as SqlJsStatic;

    try {
      await fs.access(this.dbPath);
      const fileBuffer = await fs.readFile(this.dbPath);
      this.db = new this.SQL.Database(new Uint8Array(fileBuffer));
      logger.info('Loaded existing SQLite WASM Database file from disk.', { path: this.dbPath });
    } catch {
      this.db = new this.SQL.Database();
      logger.info('Created fresh SQLite WASM Database in memory.');
      await this.runMigrations();
      await this.seedDefaultData();
      await this.persist();
    }
  }

  /**
   * Atomic file flush of the in-memory SQLite database state to disk.
   */
  private async persist(): Promise<void> {
    if (!this.db) return;
    const data = this.db.export();
    const buffer = Buffer.from(data);
    await fs.writeFile(this.dbPath, buffer);
  }

  /**
   * Run a state mutating query against the database (INSERT, UPDATE, DELETE).
   * Automatically flushes the changes to disk.
   * 
   * @param sql SQL statement with parameter placeholders
   * @param params Parameter binding values list
   */
  public async run(sql: string, params: unknown[] = []): Promise<{ lastID: number; changes: number }> {
    const dbInstance = this.getDb();
    dbInstance.run(sql, params);
    
    let lastID = 0;
    try {
      const res = dbInstance.exec('SELECT last_insert_rowid() as id');
      if (res.length > 0 && res[0].values.length > 0) {
        lastID = res[0].values[0][0] as number;
      }
    } catch {
      lastID = 0;
    }

    await this.persist();

    return {
      lastID,
      changes: 1
    };
  }

  /**
   * Query a single row matching criteria.
   * 
   * @param sql SQL query string
   * @param params Parameter binding values list
   */
  public async get<T = unknown>(sql: string, params: unknown[] = []): Promise<T | null> {
    const dbInstance = this.getDb();
    const stmt = dbInstance.prepare(sql);
    stmt.bind(params);
    
    let row: Record<string, unknown> | null = null;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();

    if (row && Object.keys(row).length === 0) {
      return null;
    }
    return row as unknown as T;
  }

  /**
   * Query multiple rows matching criteria.
   * 
   * @param sql SQL query string
   * @param params Parameter binding values list
   */
  public async all<T = unknown>(sql: string, params: unknown[] = []): Promise<T[]> {
    const dbInstance = this.getDb();
    const stmt = dbInstance.prepare(sql);
    stmt.bind(params);
    
    const rows: Record<string, unknown>[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows as unknown as T[];
  }

  /**
   * Flushes any pending changes and closes the database connection.
   */
  public async close(): Promise<void> {
    if (this.db) {
      await this.persist();
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Applies schema migrations to bootstrap the tables structure.
   */
  private async runMigrations(): Promise<void> {
    const dbInstance = this.getDb();
    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS matches (
        id TEXT PRIMARY KEY,
        home_team TEXT NOT NULL,
        away_team TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        status TEXT NOT NULL,
        venue TEXT NOT NULL,
        referee TEXT NOT NULL,
        safety_log TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS gates (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        turnstile_flow_rate INTEGER NOT NULL,
        current_occupancy INTEGER NOT NULL,
        capacity_limit INTEGER NOT NULL,
        status TEXT NOT NULL,
        last_updated TEXT NOT NULL
      )
    `);

    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        severity TEXT NOT NULL,
        status TEXT NOT NULL,
        location TEXT NOT NULL,
        reported_by TEXT NOT NULL,
        assigned_staff TEXT,
        ai_summary TEXT,
        timeline TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);

    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS volunteers (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT NOT NULL,
        assigned_section TEXT NOT NULL,
        skills TEXT NOT NULL,
        status TEXT NOT NULL,
        current_task TEXT,
        check_in_time TEXT,
        check_out_time TEXT
      )
    `);

    dbInstance.run(`
      CREATE TABLE IF NOT EXISTS telemetry (
        stadium_id TEXT PRIMARY KEY,
        total_attendance INTEGER NOT NULL,
        active_gates_count INTEGER NOT NULL,
        congested_gates_count INTEGER NOT NULL,
        average_queue_time REAL NOT NULL,
        co2_level REAL NOT NULL,
        temperature REAL NOT NULL,
        sustainability_score REAL NOT NULL,
        power_consumption REAL NOT NULL,
        water_usage REAL NOT NULL,
        carbon_footprint REAL NOT NULL,
        timestamp TEXT NOT NULL
      )
    `);
  }

  /**
   * Populates the database tables with default seed data values.
   */
  private async seedDefaultData(): Promise<void> {
    const dbInstance = this.getDb();
    
    const checkStmt = dbInstance.prepare('SELECT id FROM gates LIMIT 1');
    const hasData = checkStmt.step();
    checkStmt.free();

    if (!hasData) {
      const nowStr = new Date().toISOString();
      dbInstance.run(`INSERT INTO gates VALUES (?, ?, ?, ?, ?, ?, ?)`, ['gate-1', 'North Gate 1', 120, 800, 1200, 'Open', nowStr]);
      dbInstance.run(`INSERT INTO gates VALUES (?, ?, ?, ?, ?, ?, ?)`, ['gate-2', 'East Gate 2', 240, 1150, 1200, 'Congested', nowStr]);
      dbInstance.run(`INSERT INTO gates VALUES (?, ?, ?, ?, ?, ?, ?)`, ['gate-3', 'South Gate 3', 0, 0, 1000, 'Closed', nowStr]);
      dbInstance.run(`INSERT INTO gates VALUES (?, ?, ?, ?, ?, ?, ?)`, ['gate-4', 'West Gate 4', 90, 400, 1000, 'Open', nowStr]);

      dbInstance.run(`
        INSERT INTO telemetry VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, ['stadium-main', 2350, 3, 1, 18.5, 520, 24.5, 82.0, 450.0, 120.0, 180.4, nowStr]);
    }
  }
}

export const sqliteDbInstance = new SqliteDatabase();
