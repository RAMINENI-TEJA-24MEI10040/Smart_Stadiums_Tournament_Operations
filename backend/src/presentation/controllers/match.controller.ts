import { Request, Response, NextFunction } from 'express';
import { tournamentServiceInstance } from '../../application/services/tournament.service';

export class MatchController {
  public async schedule(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const match = await tournamentServiceInstance.scheduleMatch(req.body);
      res.status(201).json({
        status: 'Success',
        message: 'Match scheduled successfully',
        data: match.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }

  public async getMatches(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const matches = await tournamentServiceInstance.getMatches();
      res.status(200).json({
        status: 'Success',
        data: matches.map(m => m.toJSON())
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const match = await tournamentServiceInstance.updateMatchStatus(
        req.params.id,
        req.body.status,
        req.body.safetyMessage
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
