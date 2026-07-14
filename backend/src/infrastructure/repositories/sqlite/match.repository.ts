import { IMatchRepository } from '../../../application/interfaces/match-repository.interface';
import { Match, MatchStatus } from '../../../domain/entities/match.entity';
import { sqliteDbInstance, SqliteDatabase } from '../../database/sqlite-db';

export class SqliteMatchRepository implements IMatchRepository {
  constructor(private db: SqliteDatabase = sqliteDbInstance) {}

  public async findById(id: string): Promise<Match | null> {
    const row = await this.db.get('SELECT * FROM matches WHERE id = ?', [id]);
    if (!row) return null;
    return this.mapToEntity(row);
  }

  public async findAll(): Promise<Match[]> {
    const rows = await this.db.all('SELECT * FROM matches');
    return rows.map(r => this.mapToEntity(r));
  }

  public async save(match: Match): Promise<Match> {
    const existing = await this.findById(match.id);
    const safetyLogJson = JSON.stringify(match.safetyLog);
    if (existing) {
      await this.db.run(
        `UPDATE matches SET home_team = ?, away_team = ?, start_time = ?, end_time = ?, status = ?, venue = ?, referee = ?, safety_log = ? WHERE id = ?`,
        [match.homeTeam, match.awayTeam, match.startTime.toISOString(), match.endTime.toISOString(), match.status, match.venue, match.referee, safetyLogJson, match.id]
      );
    } else {
      await this.db.run(
        `INSERT INTO matches (id, home_team, away_team, start_time, end_time, status, venue, referee, safety_log, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [match.id, match.homeTeam, match.awayTeam, match.startTime.toISOString(), match.endTime.toISOString(), match.status, match.venue, match.referee, safetyLogJson, match.createdAt.toISOString()]
      );
    }
    return match;
  }

  public async delete(id: string): Promise<boolean> {
    const res = await this.db.run('DELETE FROM matches WHERE id = ?', [id]);
    return res.changes > 0;
  }

  private mapToEntity(row: any): Match {
    let safetyLog: string[] = [];
    try {
      safetyLog = JSON.parse(row.safety_log);
    } catch {
      safetyLog = [];
    }

    return new Match(
      row.id,
      row.home_team,
      row.away_team,
      new Date(row.start_time),
      new Date(row.end_time),
      row.status as MatchStatus,
      row.venue,
      row.referee,
      safetyLog,
      new Date(row.created_at)
    );
  }
}
