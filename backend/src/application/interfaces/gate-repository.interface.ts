import { Gate } from '../../domain/entities/gate.entity';

export interface IGateRepository {
  findById(id: string): Promise<Gate | null>;
  findAll(): Promise<Gate[]>;
  save(gate: Gate): Promise<Gate>;
}
