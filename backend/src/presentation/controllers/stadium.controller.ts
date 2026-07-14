import { Request, Response, NextFunction } from 'express';
import { stadiumServiceInstance } from '../../application/services/stadium.service';
import { TelemetryProvider } from '../../infrastructure/telemetry/telemetry';

export class StadiumController {
  public async getGates(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const gates = await stadiumServiceInstance.getGates();
      res.status(200).json({
        status: 'Success',
        data: gates.map(g => g.toJSON())
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateGateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const gate = await stadiumServiceInstance.updateGateStatus(req.params.id, req.body.status);
      res.status(200).json({
        status: 'Success',
        message: 'Gate status updated',
        data: gate.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateGateTelemetry(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const gate = await stadiumServiceInstance.updateGateTelemetry(req.params.id, req.body);
      res.status(200).json({
        status: 'Success',
        message: 'Gate telemetry updated',
        data: gate.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }

  public async getTelemetry(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const telemetry = await stadiumServiceInstance.getTelemetry();
      res.status(200).json({
        status: 'Success',
        data: telemetry ? telemetry.toJSON() : null
      });
    } catch (err) {
      next(err);
    }
  }

  public async getTelemetryHistory(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const history = await stadiumServiceInstance.getTelemetryHistory();
      res.status(200).json({
        status: 'Success',
        data: history.map(h => h.toJSON())
      });
    } catch (err) {
      next(err);
    }
  }

  // Observability Diagnostic Endpoint: fetches health reports for system dashboard
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
