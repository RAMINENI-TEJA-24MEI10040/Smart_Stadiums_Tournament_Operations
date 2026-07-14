import { dbFactoryInstance } from '../../infrastructure/database/db-factory';
import { Match, MatchStatus } from '../../domain/entities/match.entity';

/**
 * Service orchestrating tournament match scheduling, venue conflict validations,
 * and real-time status changes.
 */
export class TournamentService {
  /**
   * Schedules a new tournament match.
   * Performs strict venue double-booking validation to ensure no overlapping match schedules.
   *
   * @param payload Home team, away team, time bounds, venue, and assigned referee.
   * @returns The scheduled Match domain entity.
   * @throws Error if another match conflicts with the venue and time block.
   */
  public async scheduleMatch(payload: {
    homeTeam: string;
    awayTeam: string;
    startTime: string;
    endTime: string;
    venue: string;
    referee: string;
  }): Promise<Match> {
    const repos = dbFactoryInstance.getRepositories();
    const matches = await repos.matchRepository.findAll();
    
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
      throw new Error('Scheduling Conflict: The selected venue is already booked for this time block.');
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

    return repos.matchRepository.save(newMatch);
  }

  /**
   * Fetches all scheduled match calendars recorded in the active database.
   *
   * @returns List of Match domain entities.
   */
  public async getMatches(): Promise<Match[]> {
    const repos = dbFactoryInstance.getRepositories();
    return repos.matchRepository.findAll();
  }

  /**
   * Updates the match operational status (e.g. Live, Completed, Delayed) and appends safety log comments.
   *
   * @param matchId Target match identifier.
   * @param status Target match status state.
   * @param safetyMessage Optional safety notification text to log.
   * @returns The updated Match domain entity state.
   */
  public async updateMatchStatus(matchId: string, status: MatchStatus, safetyMessage?: string): Promise<Match> {
    const repos = dbFactoryInstance.getRepositories();
    const match = await repos.matchRepository.findById(matchId);
    if (!match) {
      throw new Error('Match not found');
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

    return repos.matchRepository.save(updatedMatch);
  }
}

export const tournamentServiceInstance = new TournamentService();
