import { Match } from '../../domain/entities/match.entity';

export interface IMatchRepository {
  findById(id: string): Promise<Match | null>;
  findAll(): Promise<Match[]>;
  save(match: Match): Promise<Match>;
  delete(id: string): Promise<boolean>;
}
