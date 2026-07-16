import { IGateRepository } from '../../../application/interfaces/gate-repository.interface';
import { Gate, GateStatus } from '../../../domain/entities/gate.entity';
import { sqliteDbInstance, SqliteDatabase } from '../../database/sqlite-db';

export class SqliteGateRepository implements IGateRepository {
  constructor(private db: SqliteDatabase = sqliteDbInstance) {}

  public async findById(id: string): Promise<Gate | null> {
    const row = await this.db.get('SELECT * FROM gates WHERE id = ?', [id]);
    if (!row) return null;
    return this.mapToEntity(row);
  }

  public async findAll(): Promise<Gate[]> {
    const rows = await this.db.all('SELECT * FROM gates');
    return rows.map(r => this.mapToEntity(r));
  }

  public async save(gate: Gate): Promise<Gate> {
    const existing = await this.findById(gate.id);
    if (existing) {
      await this.db.run(
        `UPDATE gates SET name = ?, turnstile_flow_rate = ?, current_occupancy = ?, capacity_limit = ?, status = ?, last_updated = ? WHERE id = ?`,
        [gate.name, gate.turnstileFlowRate, gate.currentOccupancy, gate.capacityLimit, gate.status, gate.lastUpdated.toISOString(), gate.id]
      );
    } else {
      await this.db.run(
        `INSERT INTO gates (id, name, turnstile_flow_rate, current_occupancy, capacity_limit, status, last_updated) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [gate.id, gate.name, gate.turnstileFlowRate, gate.currentOccupancy, gate.capacityLimit, gate.status, gate.lastUpdated.toISOString()]
      );
    }
    return gate;
  }

  private mapToEntity(rawRow: unknown) {
    const row = rawRow as Record<string, unknown>;
    return new Gate(
      String(row['id']),
      String(row['name']),
      Number(row['turnstile_flow_rate']),
      Number(row['current_occupancy']),
      Number(row['capacity_limit']),
      String(row['status']) as GateStatus,
      new Date(String(row['last_updated']))
    );
  }
}
