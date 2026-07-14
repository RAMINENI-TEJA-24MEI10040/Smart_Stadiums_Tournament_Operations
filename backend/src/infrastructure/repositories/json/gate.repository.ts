import { IGateRepository } from '../../../application/interfaces/gate-repository.interface';
import { Gate, GateStatus } from '../../../domain/entities/gate.entity';
import { jsonDbInstance, JsonDatabase } from '../../database/json-db';

export class JsonGateRepository implements IGateRepository {
  constructor(private db: JsonDatabase = jsonDbInstance) {}

  public async findById(id: string): Promise<Gate | null> {
    const data = await this.db.read();
    const gate = data.gates.find(g => g.id === id);
    if (!gate) return null;
    return new Gate(
      gate.id,
      gate.name,
      gate.turnstileFlowRate,
      gate.currentOccupancy,
      gate.capacityLimit,
      gate.status as GateStatus,
      new Date(gate.lastUpdated)
    );
  }

  public async findAll(): Promise<Gate[]> {
    const data = await this.db.read();
    return data.gates.map(
      gate => new Gate(
        gate.id,
        gate.name,
        gate.turnstileFlowRate,
        gate.currentOccupancy,
        gate.capacityLimit,
        gate.status as GateStatus,
        new Date(gate.lastUpdated)
      )
    );
  }

  public async save(gate: Gate): Promise<Gate> {
    const data = await this.db.read();
    const index = data.gates.findIndex(g => g.id === gate.id);
    const jsonGate = {
      id: gate.id,
      name: gate.name,
      turnstileFlowRate: gate.turnstileFlowRate,
      currentOccupancy: gate.currentOccupancy,
      capacityLimit: gate.capacityLimit,
      status: gate.status,
      lastUpdated: gate.lastUpdated.toISOString()
    };

    if (index >= 0) {
      data.gates[index] = jsonGate;
    } else {
      data.gates.push(jsonGate);
    }
    await this.db.write(data);
    return gate;
  }
}
