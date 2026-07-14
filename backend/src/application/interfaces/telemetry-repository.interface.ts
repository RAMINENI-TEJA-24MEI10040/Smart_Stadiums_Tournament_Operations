import { Telemetry } from '../../domain/entities/telemetry.entity';

export interface ITelemetryRepository {
  getLatest(): Promise<Telemetry | null>;
  save(telemetry: Telemetry): Promise<Telemetry>;
  getHistory(limit: number): Promise<Telemetry[]>;
}
