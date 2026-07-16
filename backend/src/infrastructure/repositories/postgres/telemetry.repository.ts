import { ITelemetryRepository } from '../../../application/interfaces/telemetry-repository.interface';
import { Telemetry } from '../../../domain/entities/telemetry.entity';
import { postgresDbInstance, PostgresDatabase } from '../../database/postgres-db';

export class PostgresTelemetryRepository implements ITelemetryRepository {
  constructor(private db: PostgresDatabase = postgresDbInstance) {}

  public async getLatest(): Promise<Telemetry | null> {
    const rows = await this.db.query('SELECT * FROM telemetry ORDER BY timestamp DESC LIMIT 1');
    if (rows.length === 0) return null;
    return this.mapToEntity(rows[0]);
  }

  public async save(telemetry: Telemetry): Promise<Telemetry> {
    await this.db.query(
      `INSERT INTO telemetry (stadium_id, total_attendance, active_gates_count, congested_gates_count, average_queue_time, co2_level, temperature, sustainability_score, power_consumption, water_usage, carbon_footprint, timestamp) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       ON CONFLICT (stadium_id) DO UPDATE SET 
         total_attendance = EXCLUDED.total_attendance,
         active_gates_count = EXCLUDED.active_gates_count,
         congested_gates_count = EXCLUDED.congested_gates_count,
         average_queue_time = EXCLUDED.average_queue_time,
         co2_level = EXCLUDED.co2_level,
         temperature = EXCLUDED.temperature,
         sustainability_score = EXCLUDED.sustainability_score,
         power_consumption = EXCLUDED.power_consumption,
         water_usage = EXCLUDED.water_usage,
         carbon_footprint = EXCLUDED.carbon_footprint,
         timestamp = EXCLUDED.timestamp`,
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
        telemetry.timestamp
      ]
    );
    return telemetry;
  }

  public async getHistory(limit: number): Promise<Telemetry[]> {
    const rows = await this.db.query('SELECT * FROM telemetry ORDER BY timestamp DESC LIMIT $1', [limit]);
    return rows.map(r => this.mapToEntity(r));
  }

  private mapToEntity(rawRow: unknown) {
    const row = rawRow as Record<string, unknown>;
    return new Telemetry(
      String(row['stadium_id']),
      Number(row['total_attendance']),
      Number(row['active_gates_count']),
      Number(row['congested_gates_count']),
      Number(row['average_queue_time']),
      Number(row['co2_level']),
      Number(row['temperature']),
      Number(row['sustainability_score']),
      Number(row['power_consumption']),
      Number(row['water_usage']),
      Number(row['carbon_footprint']),
      new Date(row['timestamp'] as string)
    );
  }
}
