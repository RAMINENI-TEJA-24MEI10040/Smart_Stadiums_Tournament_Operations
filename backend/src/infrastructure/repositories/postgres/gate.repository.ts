import { IGateRepository } from '../../../application/interfaces/gate-repository.interface';
import { Gate, GateStatus } from '../../../domain/entities/gate.entity';
import { postgresDbInstance, PostgresDatabase } from '../../database/postgres-db';

export class PostgresGateRepository implements IGateRepository {
  constructor(private db: PostgresDatabase = postgresDbInstance) {}

  public async findById(id: string): Promise<Gate | null> {
    const rows = await this.db.query('SELECT * FROM gates WHERE id = $1', [id]);
    if (rows.length === 0) return null;
    return this.mapToEntity(rows[0]);
  }

  public async findAll(): Promise<Gate[]> {
    const rows = await this.db.query('SELECT * FROM gates');
    return rows.map(r => this.mapToEntity(r));
  }

  public async save(gate: Gate): Promise<Gate> {
    const existing = await this.findById(gate.id);
    if (existing) {
      await this.db.query(
        `UPDATE gates SET name = $1, turnstile_flow_rate = $2, current_occupancy = $3, capacity_limit = $4, status = $5, last_updated = $6 WHERE id = $7`,
        [gate.name, gate.turnstileFlowRate, gate.currentOccupancy, gate.capacityLimit, gate.status, gate.lastUpdated, gate.id]
      );
    } else {
      await this.db.query(
        `INSERT INTO gates (id, name, turnstile_flow_rate, current_occupancy, capacity_limit, status, last_updated) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [gate.id, gate.name, gate.turnstileFlowRate, gate.currentOccupancy, gate.capacityLimit, gate.status, gate.lastUpdated]
      );
    }
    return gate;
  }

  private mapToEntity(row: any): Gate {
    return new Gate(
      row.id,
      row.name,
      row.turnstile_flow_rate,
      row.current_occupancy,
      row.capacity_limit,
      row.status as GateStatus,
      new Date(row.last_updated)
    );
  }
}
