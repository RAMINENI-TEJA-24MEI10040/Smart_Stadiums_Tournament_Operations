import { dbFactoryInstance } from '../../infrastructure/database/db-factory';
import { Match, MatchStatus } from '../../domain/entities/match.entity';
import { ITournamentService } from '../interfaces/services.interface';
import { IMatchRepository } from '../interfaces/match-repository.interface';
import { ConflictException, NotFoundException } from '../../shared/exceptions';
import { logger } from '../../shared/logger';

/**
 * Service orchestrating tournament match scheduling, venue conflict validations,
 * and real-time status changes.
 */
export class TournamentService implements ITournamentService {
  private matchRepository?: IMatchRepository;

  constructor(matchRepository?: IMatchRepository) {
    this.matchRepository = matchRepository;
  }

  private get matchRepo(): IMatchRepository {
    return this.matchRepository || dbFactoryInstance.getRepositories().matchRepository;
  }

  /**
   * Schedules a new tournament match.
   * Performs strict venue double-booking validation to ensure no overlapping match schedules.
   *
   * @param payload Home team, away team, time bounds, venue, and assigned referee.
   * @returns The scheduled Match domain entity.
   * @throws ConflictException if another match conflicts with the venue and time block.
   */
  public async scheduleMatch(payload: {
    homeTeam: string;
    awayTeam: string;
    startTime: string;
    endTime: string;
    venue: string;
    referee: string;
  }): Promise<Match> {
    logger.info(`Request received to schedule match: ${payload.homeTeam} vs ${payload.awayTeam} at ${payload.venue}`);
    const matches = await this.matchRepo.findAll();
    
    // Check for double bookings (same venue, overlapping times)
    const newStart = new Date(payload.startTime).getTime();
    const newEnd = new Date(payload.endTime).getTime();

    const hasConflict = matches.some(m => {
      if (m.venue.toLowerCase() !== payload.venue.toLowerCase()) return false;
      const start = m.startTime.getTime();
      const end = m.endTime.getTime();
      return (newStart >= start && newStart < end) || (newEnd > start && newEnd <= end);
    });

    if (hasConflict) {
      logger.warn(`Scheduling conflict detected for venue: ${payload.venue} between ${payload.startTime} and ${payload.endTime}`);
      throw new ConflictException('Scheduling Conflict: The selected venue is already booked for this time block.');
    }

    const matchId = `match-${Date.now()}`;
    const newMatch = new Match(
      matchId,
      payload.homeTeam,
      payload.awayTeam,
      new Date(payload.startTime),
      new Date(payload.endTime),
      'Scheduled',
      payload.venue,
      payload.referee,
      ['Match scheduled successfully'],
      new Date()
    );

    const saved = await this.matchRepo.save(newMatch);
    logger.info(`Match successfully scheduled with ID: ${matchId}`);
    return saved;
  }

  /**
   * Fetches all scheduled match calendars recorded in the active database.
   *
   * @returns List of Match domain entities.
   */
  public async getMatches(): Promise<Match[]> {
    logger.info('Fetching scheduled matches from repository');
    return this.matchRepo.findAll();
  }

  /**
   * Updates the match operational status (e.g. Live, Completed, Delayed) and appends safety log comments.
   *
   * @param matchId Target match identifier.
   * @param status Target match status state.
   * @param safetyMessage Optional safety notification text to log.
   * @returns The updated Match domain entity state.
   * @throws NotFoundException if the match is not found.
   */
  public async updateMatchStatus(matchId: string, status: MatchStatus, safetyMessage?: string): Promise<Match> {
    logger.info(`Request received to update match status: Match ID ${matchId} to ${status}`);
    const match = await this.matchRepo.findById(matchId);
    if (!match) {
      logger.warn(`Match status update rejected: Match ID ${matchId} not found`);
      throw new NotFoundException('Match not found');
    }

    const logs = [...match.safetyLog];
    logs.push(`[${new Date().toISOString()}] Status updated to ${status}`);
    if (safetyMessage) {
      logs.push(`[${new Date().toISOString()}] Safety update: ${safetyMessage}`);
    }

    const updatedMatch = new Match(
      match.id,
      match.homeTeam,
      match.awayTeam,
      match.startTime,
      match.endTime,
      status,
      match.venue,
      match.referee,
      logs,
      match.createdAt
    );

    const saved = await this.matchRepo.save(updatedMatch);
    logger.info(`Match status successfully updated for ID: ${matchId}`);
    return saved;
  }
}

export const tournamentServiceInstance = new TournamentService();
