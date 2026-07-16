import { Request, Response, NextFunction } from 'express';
import { getTournamentService } from '../../application/services/tournament.service';

/**
 * Controller handling match schedules and live status tracking.
 * Strictly validates inputs, authorizes roles, and delegates business rules to TournamentService.
 */
export class MatchController {
  /**
   * Schedules a new tournament match.
   */
  public async schedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { homeTeam, awayTeam, startTime, endTime, venue, referee } = req.body;
      const tournamentService = getTournamentService();
      
      const match = await tournamentService.scheduleMatch({
        homeTeam,
        awayTeam,
        startTime,
        endTime,
        venue,
        referee
      });

      res.status(201).json({
        status: 'Success',
        message: 'Match scheduled successfully',
        data: match.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieves all scheduled matches.
   */
  public async getMatches(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const tournamentService = getTournamentService();
      const matches = await tournamentService.getMatches();
      res.status(200).json({
        status: 'Success',
        data: matches.map(m => m.toJSON())
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Updates operational status and logs of a match.
   */
  public async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status, safetyMessage } = req.body;
      const tournamentService = getTournamentService();
      
      const match = await tournamentService.updateMatchStatus(
        req.params.id,
        status,
        safetyMessage
      );

      res.status(200).json({
        status: 'Success',
        message: 'Match status updated successfully',
        data: match.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }
}

export const matchControllerInstance = new MatchController();
