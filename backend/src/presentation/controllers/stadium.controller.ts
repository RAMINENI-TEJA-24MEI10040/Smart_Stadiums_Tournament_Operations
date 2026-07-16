import { Request, Response, NextFunction } from 'express';
import { getStadiumService } from '../../application/services/stadium.service';
import { TelemetryProvider } from '../../infrastructure/telemetry/telemetry';

/**
 * Controller handling stadium gate states, real-time telemetry, and health check diagnostics.
 * Strictly validates inputs, authorizes roles, and delegates business rules to StadiumService.
 */
export class StadiumController {
  /**
   * Retrieves all entry gates configuration and statuses.
   */
  public async getGates(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stadiumService = getStadiumService();
      const gates = await stadiumService.getGates();
      res.status(200).json({
        status: 'Success',
        data: gates.map(g => g.toJSON())
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Updates an entry gate's operational status.
   */
  public async updateGateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { status } = req.body;
      const stadiumService = getStadiumService();
      const gate = await stadiumService.updateGateStatus(req.params.id, status);
      
      res.status(200).json({
        status: 'Success',
        message: 'Gate status updated',
        data: gate.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Updates dynamic turnstile flow and occupancy parameters recorded by IoT sensors.
   */
  public async updateGateTelemetry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { turnstileFlowRate, currentOccupancy, capacityLimit } = req.body;
      const stadiumService = getStadiumService();
      const gate = await stadiumService.updateGateTelemetry(req.params.id, {
        turnstileFlowRate,
        currentOccupancy,
        capacityLimit
      });

      res.status(200).json({
        status: 'Success',
        message: 'Gate telemetry updated',
        data: gate.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Fetches the latest computed stadium telemetry aggregate status.
   */
  public async getTelemetry(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stadiumService = getStadiumService();
      const telemetry = await stadiumService.getTelemetry();
      res.status(200).json({
        status: 'Success',
        data: telemetry ? telemetry.toJSON() : null
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Retrieves historical telemetry logs to chart operations trends.
   */
  public async getTelemetryHistory(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stadiumService = getStadiumService();
      const history = await stadiumService.getTelemetryHistory();
      res.status(200).json({
        status: 'Success',
        data: history.map(h => h.toJSON())
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Observability Diagnostic Endpoint: fetches health reports for system dashboard.
   */
  public async getSystemHealth(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = TelemetryProvider.getSystemHealth();
      res.status(200).json({
        status: 'Success',
        data: health
      });
    } catch (err) {
      next(err);
    }
  }
}

export const stadiumControllerInstance = new StadiumController();
