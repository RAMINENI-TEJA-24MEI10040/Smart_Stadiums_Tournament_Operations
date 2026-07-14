import { Incident } from '../../domain/entities/incident.entity';

export interface IIncidentRepository {
  findById(id: string): Promise<Incident | null>;
  findAll(): Promise<Incident[]>;
  save(incident: Incident): Promise<Incident>;
  delete(id: string): Promise<boolean>;
}
