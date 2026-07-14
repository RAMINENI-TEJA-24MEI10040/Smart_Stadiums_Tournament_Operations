import initSqlJs from 'sql.js';
import * as fs from 'fs/promises';
import * as path from 'path';

export class SqliteDatabase {
  private db: any = null;
  private dbPath: string;
  private SQL: any = null;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || path.join(__dirname, '..', '..', '..', 'stadium_dev.db');
  }

  public getDb(): any {
    if (!this.db) {
      throw new Error('SQLite Database is not initialized. Call initialize() first.');
    }
    return this.db;
  }

  public async initialize(): Promise<void> {
    // 1. Initialize WebAssembly sql.js compiler
    this.SQL = await initSqlJs();

    try {
      // 2. Load existing binary database file if present
      await fs.access(this.dbPath);
      const fileBuffer = await fs.readFile(this.dbPath);
      this.db = new this.SQL.Database(fileBuffer);
      console.log('Loaded existing SQLite WASM Database file from:', this.dbPath);
    } catch {
      // 3. Create fresh in-memory database and write empty seed
      this.db = new this.SQL.Database();
      console.log('Created fresh SQLite WASM Database in memory.');
      await this.runMigrations();
      await this.seedDefaultData();
      await this.persist();
    }
  }

  // Atomically flush current memory database state to physical file
  private async persist(): Promise<void> {
    if (!this.db) return;
    const data = this.db.export();
    const buffer = Buffer.from(data);
    await fs.writeFile(this.dbPath, buffer);
  }

  public async run(sql: string, params: any[] = []): Promise<{ lastID: number; changes: number }> {
    const dbInstance = this.getDb();
    dbInstance.run(sql, params);
    
    // Fetch last insert row ID
    let lastID = 0;
    try {
      const res = dbInstance.exec('SELECT last_insert_rowid() as id');
      if (res.length > 0 && res[0].values.length > 0) {
        lastID = res[0].values[0][0] as number;
      }
    } catch {
      lastID = 0;
    }

    // Persist changes to disk
    await this.persist();

    return {
      lastID,
      changes: 1 // Default proxy count for WebAssembly changes
    };
  }

  public async get<T = any>(sql: string, params: any[] = []): Promise<T | null> {
    const dbInstance = this.getDb();
    const stmt = dbInstance.prepare(sql);
    stmt.bind(params);
    
    let row: any = null;
    if (stmt.step()) {
      row = stmt.getAsObject();
    }
    stmt.free();

    // Map empty/null objects
    if (row && Object.keys(row).length === 0) {
      return null;
    }
    return row as T;
  }

  public async all<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const dbInstance = this.getDb();
    const stmt = dbInstance.prepare(sql);
    stmt.bind(params);
    
    const rows: any[] = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows as T[];
  }

  public async close(): Promise<void> {
    if (this.db) {
      await this.persist();
      this.db.close();
      this.db = null;
    }
  }

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

  private async seedDefaultData(): Promise<void> {
    const dbInstance = this.getDb();
    
    // Check if seeded already
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
