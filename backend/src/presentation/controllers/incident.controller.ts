import { Response, NextFunction } from 'express';
import { incidentServiceInstance } from '../../application/services/incident.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export class IncidentController {
  public async file(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const reporter = req.user ? req.user.username : 'anonymous';
      const incident = await incidentServiceInstance.fileIncident({
        title: req.body.title,
        description: req.body.description,
        severity: req.body.severity,
        location: req.body.location,
        reportedBy: reporter
      });
      res.status(201).json({
        status: 'Success',
        message: 'Incident reported successfully',
        data: incident.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }

  public async getIncidents(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const incidents = await incidentServiceInstance.getIncidents();
      res.status(200).json({
        status: 'Success',
        data: incidents.map(i => i.toJSON())
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const updater = req.user ? req.user.username : 'anonymous';
      const incident = await incidentServiceInstance.updateIncidentStatus(
        req.params.id,
        req.body.status,
        req.body.comment,
        updater
      );
      res.status(200).json({
        status: 'Success',
        message: 'Incident timeline updated successfully',
        data: incident.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }

  public async assignStaff(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const updater = req.user ? req.user.username : 'anonymous';
      const incident = await incidentServiceInstance.assignStaff(
        req.params.id,
        req.body.assignedStaff,
        updater
      );
      res.status(200).json({
        status: 'Success',
        message: 'Responder dispatched successfully',
        data: incident.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }

  // AI Endpoint: invokes Gemini model to write a briefing report
  public async generateSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const incident = await incidentServiceInstance.generateAiSummary(req.params.id);
      res.status(200).json({
        status: 'Success',
        message: 'AI briefing report compiled successfully',
        data: incident.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }
}

export const incidentControllerInstance = new IncidentController();
