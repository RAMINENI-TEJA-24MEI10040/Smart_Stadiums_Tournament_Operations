import { IIncidentRepository } from '../../../application/interfaces/incident-repository.interface';
import { Incident, IncidentSeverity, IncidentStatus } from '../../../domain/entities/incident.entity';
import { jsonDbInstance, JsonDatabase } from '../../database/json-db';

export class JsonIncidentRepository implements IIncidentRepository {
  constructor(private db: JsonDatabase = jsonDbInstance) {}

  public async findById(id: string): Promise<Incident | null> {
    const data = await this.db.read();
    const incident = data.incidents.find(i => i.id === id);
    if (!incident) return null;
    return new Incident(
      incident.id,
      incident.title,
      incident.description,
      incident.severity as IncidentSeverity,
      incident.status as IncidentStatus,
      incident.location,
      incident.reportedBy,
      incident.assignedStaff,
      incident.aiSummary,
      incident.timeline || [],
      new Date(incident.createdAt)
    );
  }

  public async findAll(): Promise<Incident[]> {
    const data = await this.db.read();
    return data.incidents.map(
      incident => new Incident(
        incident.id,
        incident.title,
        incident.description,
        incident.severity as IncidentSeverity,
        incident.status as IncidentStatus,
        incident.location,
        incident.reportedBy,
        incident.assignedStaff,
        incident.aiSummary,
        incident.timeline || [],
        new Date(incident.createdAt)
      )
    );
  }

  public async save(incident: Incident): Promise<Incident> {
    const data = await this.db.read();
    const index = data.incidents.findIndex(i => i.id === incident.id);
    const jsonIncident = {
      id: incident.id,
      title: incident.title,
      description: incident.description,
      severity: incident.severity,
      status: incident.status,
      location: incident.location,
      reportedBy: incident.reportedBy,
      assignedStaff: incident.assignedStaff,
      aiSummary: incident.aiSummary,
      timeline: incident.timeline,
      createdAt: incident.createdAt.toISOString()
    };

    if (index >= 0) {
      data.incidents[index] = jsonIncident;
    } else {
      data.incidents.push(jsonIncident);
    }
    await this.db.write(data);
    return incident;
  }

  public async delete(id: string): Promise<boolean> {
    const data = await this.db.read();
    const originalLength = data.incidents.length;
    data.incidents = data.incidents.filter(i => i.id !== id);
    if (data.incidents.length === originalLength) return false;
    await this.db.write(data);
    return true;
  }
}
