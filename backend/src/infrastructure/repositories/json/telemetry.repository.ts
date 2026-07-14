import { ITelemetryRepository } from '../../../application/interfaces/telemetry-repository.interface';
import { Telemetry } from '../../../domain/entities/telemetry.entity';
import { jsonDbInstance, JsonDatabase } from '../../database/json-db';

export class JsonTelemetryRepository implements ITelemetryRepository {
  constructor(private db: JsonDatabase = jsonDbInstance) {}

  public async getLatest(): Promise<Telemetry | null> {
    const data = await this.db.read();
    if (!data.telemetry || data.telemetry.length === 0) return null;
    // Get latest by sorting timestamp desc
    const sorted = [...data.telemetry].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const item = sorted[0];
    return new Telemetry(
      item.stadiumId,
      item.totalAttendance,
      item.activeGatesCount,
      item.congestedGatesCount,
      item.averageQueueTime,
      item.co2Level,
      item.temperature,
      item.sustainabilityScore,
      item.powerConsumption,
      item.waterUsage,
      item.carbonFootprint,
      new Date(item.timestamp)
    );
  }

  public async save(telemetry: Telemetry): Promise<Telemetry> {
    const data = await this.db.read();
    data.telemetry.push({
      stadiumId: telemetry.stadiumId,
      totalAttendance: telemetry.totalAttendance,
      activeGatesCount: telemetry.activeGatesCount,
      congestedGatesCount: telemetry.congestedGatesCount,
      averageQueueTime: telemetry.averageQueueTime,
      co2Level: telemetry.co2Level,
      temperature: telemetry.temperature,
      sustainabilityScore: telemetry.sustainabilityScore,
      powerConsumption: telemetry.powerConsumption,
      waterUsage: telemetry.waterUsage,
      carbonFootprint: telemetry.carbonFootprint,
      timestamp: telemetry.timestamp.toISOString()
    });
    await this.db.write(data);
    return telemetry;
  }

  public async getHistory(limit: number): Promise<Telemetry[]> {
    const data = await this.db.read();
    const sorted = [...data.telemetry].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return sorted.slice(0, limit).map(
      item => new Telemetry(
        item.stadiumId,
        item.totalAttendance,
        item.activeGatesCount,
        item.congestedGatesCount,
        item.averageQueueTime,
        item.co2Level,
        item.temperature,
        item.sustainabilityScore,
        item.powerConsumption,
        item.waterUsage,
        item.carbonFootprint,
        new Date(item.timestamp)
      )
    );
  }
}
