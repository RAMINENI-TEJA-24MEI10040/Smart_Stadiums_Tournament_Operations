import { ITelemetryRepository } from '../../../application/interfaces/telemetry-repository.interface';
import { Telemetry } from '../../../domain/entities/telemetry.entity';
import { sqliteDbInstance, SqliteDatabase } from '../../database/sqlite-db';

export class SqliteTelemetryRepository implements ITelemetryRepository {
  constructor(private db: SqliteDatabase = sqliteDbInstance) {}

  public async getLatest(): Promise<Telemetry | null> {
    const row = await this.db.get('SELECT * FROM telemetry ORDER BY timestamp DESC LIMIT 1');
    if (!row) return null;
    return this.mapToEntity(row);
  }

  public async save(telemetry: Telemetry): Promise<Telemetry> {
    // Upsert or insert new log. Since we only want to track history, we can insert new records.
    // However, let's keep stadiumId as a history series or simple insert.
    // We can run INSERT INTO telemetry.
    await this.db.run(
      `INSERT OR REPLACE INTO telemetry (stadium_id, total_attendance, active_gates_count, congested_gates_count, average_queue_time, co2_level, temperature, sustainability_score, power_consumption, water_usage, carbon_footprint, timestamp) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        telemetry.stadiumId,
        telemetry.totalAttendance,
        telemetry.activeGatesCount,
        telemetry.congestedGatesCount,
        telemetry.averageQueueTime,
        telemetry.co2Level,
        telemetry.temperature,
        telemetry.sustainabilityScore,
        telemetry.powerConsumption,
        telemetry.waterUsage,
        telemetry.carbonFootprint,
        telemetry.timestamp.toISOString()
      ]
    );
    return telemetry;
  }

  public async getHistory(limit: number): Promise<Telemetry[]> {
    const rows = await this.db.all('SELECT * FROM telemetry ORDER BY timestamp DESC LIMIT ?', [limit]);
    return rows.map(r => this.mapToEntity(r));
  }

  private mapToEntity(row: any): Telemetry {
    return new Telemetry(
      row.stadium_id,
      row.total_attendance,
      row.active_gates_count,
      row.congested_gates_count,
      row.average_queue_time,
      row.co2_level,
      row.temperature,
      row.sustainability_score,
      row.power_consumption,
      row.water_usage,
      row.carbon_footprint,
      new Date(row.timestamp)
    );
  }
}
