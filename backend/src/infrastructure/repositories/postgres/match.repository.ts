import { IMatchRepository } from '../../../application/interfaces/match-repository.interface';
import { Match, MatchStatus } from '../../../domain/entities/match.entity';
import { postgresDbInstance, PostgresDatabase } from '../../database/postgres-db';

export class PostgresMatchRepository implements IMatchRepository {
  constructor(private db: PostgresDatabase = postgresDbInstance) {}

  public async findById(id: string): Promise<Match | null> {
    const rows = await this.db.query('SELECT * FROM matches WHERE id = $1', [id]);
    if (rows.length === 0) return null;
    return this.mapToEntity(rows[0]);
  }

  public async findAll(): Promise<Match[]> {
    const rows = await this.db.query('SELECT * FROM matches');
    return rows.map(r => this.mapToEntity(r));
  }

  public async save(match: Match): Promise<Match> {
    const existing = await this.findById(match.id);
    const safetyLogJson = JSON.stringify(match.safetyLog);
    if (existing) {
      await this.db.query(
        `UPDATE matches SET home_team = $1, away_team = $2, start_time = $3, end_time = $4, status = $5, venue = $6, referee = $7, safety_log = $8 WHERE id = $9`,
        [match.homeTeam, match.awayTeam, match.startTime, match.endTime, match.status, match.venue, match.referee, safetyLogJson, match.id]
      );
    } else {
      await this.db.query(
        `INSERT INTO matches (id, home_team, away_team, start_time, end_time, status, venue, referee, safety_log, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [match.id, match.homeTeam, match.awayTeam, match.startTime, match.endTime, match.status, match.venue, match.referee, safetyLogJson, match.createdAt]
      );
    }
    return match;
  }

  public async delete(id: string): Promise<boolean> {
    const res = await this.db.getPool().query('DELETE FROM matches WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  private mapToEntity(rawRow: unknown) {
    const row = rawRow as Record<string, unknown>;
    let safetyLog: string[] = [];
    try {
      safetyLog = JSON.parse(String(row['safety_log']));
    } catch {
      safetyLog = [];
    }

    return new Match(
      String(row['id']),
      String(row['home_team']),
      String(row['away_team']),
      new Date(row['start_time'] as string),
      new Date(row['end_time'] as string),
      String(row['status']) as MatchStatus,
      String(row['venue']),
      String(row['referee']),
      safetyLog,
      new Date(row['created_at'] as string)
    );
  }
}
