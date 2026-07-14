import { IIncidentRepository } from '../../../application/interfaces/incident-repository.interface';
import { Incident, IncidentSeverity, IncidentStatus, IncidentTimelineEntry } from '../../../domain/entities/incident.entity';
import { sqliteDbInstance, SqliteDatabase } from '../../database/sqlite-db';

export class SqliteIncidentRepository implements IIncidentRepository {
  constructor(private db: SqliteDatabase = sqliteDbInstance) {}

  public async findById(id: string): Promise<Incident | null> {
    const row = await this.db.get('SELECT * FROM incidents WHERE id = ?', [id]);
    if (!row) return null;
    return this.mapToEntity(row);
  }

  public async findAll(): Promise<Incident[]> {
    const rows = await this.db.all('SELECT * FROM incidents');
    return rows.map(r => this.mapToEntity(r));
  }

  public async save(incident: Incident): Promise<Incident> {
    const existing = await this.findById(incident.id);
    const timelineJson = JSON.stringify(incident.timeline);
    if (existing) {
      await this.db.run(
        `UPDATE incidents SET title = ?, description = ?, severity = ?, status = ?, location = ?, reported_by = ?, assigned_staff = ?, ai_summary = ?, timeline = ? WHERE id = ?`,
        [incident.title, incident.description, incident.severity, incident.status, incident.location, incident.reportedBy, incident.assignedStaff, incident.aiSummary, timelineJson, incident.id]
      );
    } else {
      await this.db.run(
        `INSERT INTO incidents (id, title, description, severity, status, location, reported_by, assigned_staff, ai_summary, timeline, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [incident.id, incident.title, incident.description, incident.severity, incident.status, incident.location, incident.reportedBy, incident.assignedStaff, incident.aiSummary, timelineJson, incident.createdAt.toISOString()]
      );
    }
    return incident;
  }

  public async delete(id: string): Promise<boolean> {
    const res = await this.db.run('DELETE FROM incidents WHERE id = ?', [id]);
    return res.changes > 0;
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
