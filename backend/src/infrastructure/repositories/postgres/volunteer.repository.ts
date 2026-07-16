import { IVolunteerRepository } from '../../../application/interfaces/volunteer-repository.interface';
import { Volunteer, VolunteerStatus } from '../../../domain/entities/volunteer.entity';
import { postgresDbInstance, PostgresDatabase } from '../../database/postgres-db';

export class PostgresVolunteerRepository implements IVolunteerRepository {
  constructor(private db: PostgresDatabase = postgresDbInstance) {}

  public async findById(id: string): Promise<Volunteer | null> {
    const rows = await this.db.query('SELECT * FROM volunteers WHERE id = $1', [id]);
    if (rows.length === 0) return null;
    return this.mapToEntity(rows[0]);
  }

  public async findByUserId(userId: string): Promise<Volunteer | null> {
    const rows = await this.db.query('SELECT * FROM volunteers WHERE user_id = $1', [userId]);
    if (rows.length === 0) return null;
    return this.mapToEntity(rows[0]);
  }

  public async findAll(): Promise<Volunteer[]> {
    const rows = await this.db.query('SELECT * FROM volunteers');
    return rows.map(r => this.mapToEntity(r));
  }

  public async save(volunteer: Volunteer): Promise<Volunteer> {
    const existing = await this.findById(volunteer.id);
    const skillsJson = JSON.stringify(volunteer.skills);
    if (existing) {
      await this.db.query(
        `UPDATE volunteers SET user_id = $1, name = $2, assigned_section = $3, skills = $4, status = $5, current_task = $6, check_in_time = $7, check_out_time = $8 WHERE id = $9`,
        [volunteer.userId, volunteer.name, volunteer.assignedSection, skillsJson, volunteer.status, volunteer.currentTask, volunteer.checkInTime, volunteer.checkOutTime, volunteer.id]
      );
    } else {
      await this.db.query(
        `INSERT INTO volunteers (id, user_id, name, assigned_section, skills, status, current_task, check_in_time, check_out_time) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [volunteer.id, volunteer.userId, volunteer.name, volunteer.assignedSection, skillsJson, volunteer.status, volunteer.currentTask, volunteer.checkInTime, volunteer.checkOutTime]
      );
    }
    return volunteer;
  }

  public async delete(id: string): Promise<boolean> {
    const res = await this.db.getPool().query('DELETE FROM volunteers WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  private mapToEntity(rawRow: unknown) {
    const row = rawRow as Record<string, unknown>;
    let skills: string[] = [];
    try {
      skills = JSON.parse(String(row['skills']));
    } catch {
      skills = [];
    }

    return new Volunteer(
      String(row['id']),
      row['user_id'] != null ? String(row['user_id']) : null,
      String(row['name']),
      String(row['assigned_section']),
      skills,
      String(row['status']) as VolunteerStatus,
      row['current_task'] != null ? String(row['current_task']) : null,
      row['check_in_time'] ? new Date(row['check_in_time'] as string) : null,
      row['check_out_time'] ? new Date(row['check_out_time'] as string) : null
    );
  }
}
