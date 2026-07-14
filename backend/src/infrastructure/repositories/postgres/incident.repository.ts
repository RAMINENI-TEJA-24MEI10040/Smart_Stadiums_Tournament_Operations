import { IIncidentRepository } from '../../../application/interfaces/incident-repository.interface';
import { Incident, IncidentSeverity, IncidentStatus, IncidentTimelineEntry } from '../../../domain/entities/incident.entity';
import { postgresDbInstance, PostgresDatabase } from '../../database/postgres-db';

export class PostgresIncidentRepository implements IIncidentRepository {
  constructor(private db: PostgresDatabase = postgresDbInstance) {}

  public async findById(id: string): Promise<Incident | null> {
    const rows = await this.db.query('SELECT * FROM incidents WHERE id = $1', [id]);
    if (rows.length === 0) return null;
    return this.mapToEntity(rows[0]);
  }

  public async findAll(): Promise<Incident[]> {
    const rows = await this.db.query('SELECT * FROM incidents');
    return rows.map(r => this.mapToEntity(r));
  }

  public async save(incident: Incident): Promise<Incident> {
    const existing = await this.findById(incident.id);
    const timelineJson = JSON.stringify(incident.timeline);
    if (existing) {
      await this.db.query(
        `UPDATE incidents SET title = $1, description = $2, severity = $3, status = $4, location = $5, reported_by = $6, assigned_staff = $7, ai_summary = $8, timeline = $9 WHERE id = $10`,
        [incident.title, incident.description, incident.severity, incident.status, incident.location, incident.reportedBy, incident.assignedStaff, incident.aiSummary, timelineJson, incident.id]
      );
    } else {
      await this.db.query(
        `INSERT INTO incidents (id, title, description, severity, status, location, reported_by, assigned_staff, ai_summary, timeline, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [incident.id, incident.title, incident.description, incident.severity, incident.status, incident.location, incident.reportedBy, incident.assignedStaff, incident.aiSummary, timelineJson, incident.createdAt]
      );
    }
    return incident;
  }

  public async delete(id: string): Promise<boolean> {
    const res = await this.db.getPool().query('DELETE FROM incidents WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  private mapToEntity(row: any): Incident {
    let timeline: IncidentTimelineEntry[] = [];
    try {
      timeline = JSON.parse(row.timeline);
    } catch {
      timeline = [];
    }

    return new Incident(
      row.id,
      row.title,
      row.description,
      row.severity as IncidentSeverity,
      row.status as IncidentStatus,
      row.location,
      row.reported_by,
      row.assigned_staff,
      row.ai_summary,
      timeline,
      new Date(row.created_at)
    );
  }
}
