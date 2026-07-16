import { IVolunteerRepository } from '../../../application/interfaces/volunteer-repository.interface';
import { Volunteer, VolunteerStatus } from '../../../domain/entities/volunteer.entity';
import { sqliteDbInstance, SqliteDatabase } from '../../database/sqlite-db';

export class SqliteVolunteerRepository implements IVolunteerRepository {
  constructor(private db: SqliteDatabase = sqliteDbInstance) {}

  public async findById(id: string): Promise<Volunteer | null> {
    const row = await this.db.get('SELECT * FROM volunteers WHERE id = ?', [id]);
    if (!row) return null;
    return this.mapToEntity(row);
  }

  public async findByUserId(userId: string): Promise<Volunteer | null> {
    const row = await this.db.get('SELECT * FROM volunteers WHERE user_id = ?', [userId]);
    if (!row) return null;
    return this.mapToEntity(row);
  }

  public async findAll(): Promise<Volunteer[]> {
    const rows = await this.db.all('SELECT * FROM volunteers');
    return rows.map(r => this.mapToEntity(r));
  }

  public async save(volunteer: Volunteer): Promise<Volunteer> {
    const existing = await this.findById(volunteer.id);
    const skillsJson = JSON.stringify(volunteer.skills);
    const checkInStr = volunteer.checkInTime ? volunteer.checkInTime.toISOString() : null;
    const checkOutStr = volunteer.checkOutTime ? volunteer.checkOutTime.toISOString() : null;

    if (existing) {
      await this.db.run(
        `UPDATE volunteers SET user_id = ?, name = ?, assigned_section = ?, skills = ?, status = ?, current_task = ?, check_in_time = ?, check_out_time = ? WHERE id = ?`,
        [volunteer.userId, volunteer.name, volunteer.assignedSection, skillsJson, volunteer.status, volunteer.currentTask, checkInStr, checkOutStr, volunteer.id]
      );
    } else {
      await this.db.run(
        `INSERT INTO volunteers (id, user_id, name, assigned_section, skills, status, current_task, check_in_time, check_out_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [volunteer.id, volunteer.userId, volunteer.name, volunteer.assignedSection, skillsJson, volunteer.status, volunteer.currentTask, checkInStr, checkOutStr]
      );
    }
    return volunteer;
  }

  public async delete(id: string): Promise<boolean> {
    const res = await this.db.run('DELETE FROM volunteers WHERE id = ?', [id]);
    return res.changes > 0;
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
      row['check_in_time'] ? new Date(String(row['check_in_time'])) : null,
      row['check_out_time'] ? new Date(String(row['check_out_time'])) : null
    );
  }
}
