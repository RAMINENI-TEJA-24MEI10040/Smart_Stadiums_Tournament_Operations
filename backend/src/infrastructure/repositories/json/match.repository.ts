import { IMatchRepository } from '../../../application/interfaces/match-repository.interface';
import { Match, MatchStatus } from '../../../domain/entities/match.entity';
import { jsonDbInstance, JsonDatabase } from '../../database/json-db';

export class JsonMatchRepository implements IMatchRepository {
  constructor(private db: JsonDatabase = jsonDbInstance) {}

  public async findById(id: string): Promise<Match | null> {
    const data = await this.db.read();
    const match = data.matches.find(m => m.id === id);
    if (!match) return null;
    return new Match(
      match.id,
      match.homeTeam,
      match.awayTeam,
      new Date(match.startTime),
      new Date(match.endTime),
      match.status as MatchStatus,
      match.venue,
      match.referee,
      match.safetyLog || [],
      new Date(match.createdAt)
    );
  }

  public async findAll(): Promise<Match[]> {
    const data = await this.db.read();
    return data.matches.map(
      match => new Match(
        match.id,
        match.homeTeam,
        match.awayTeam,
        new Date(match.startTime),
        new Date(match.endTime),
        match.status as MatchStatus,
        match.venue,
        match.referee,
        match.safetyLog || [],
        new Date(match.createdAt)
      )
    );
  }

  public async save(match: Match): Promise<Match> {
    const data = await this.db.read();
    const index = data.matches.findIndex(m => m.id === match.id);
    const jsonMatch = {
      id: match.id,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      startTime: match.startTime.toISOString(),
      endTime: match.endTime.toISOString(),
      status: match.status,
      venue: match.venue,
      referee: match.referee,
      safetyLog: match.safetyLog,
      createdAt: match.createdAt.toISOString()
    };

    if (index >= 0) {
      data.matches[index] = jsonMatch;
    } else {
      data.matches.push(jsonMatch);
    }
    await this.db.write(data);
    return match;
  }

  public async delete(id: string): Promise<boolean> {
    const data = await this.db.read();
    const originalLength = data.matches.length;
    data.matches = data.matches.filter(m => m.id !== id);
    if (data.matches.length === originalLength) return false;
    await this.db.write(data);
    return true;
  }
}
