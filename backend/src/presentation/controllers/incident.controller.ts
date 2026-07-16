import { Response, NextFunction } from 'express';
import { getIncidentService } from '../../application/services/incident.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

/** Anonymous caller fallback string. */
const ANONYMOUS_ACTOR = 'anonymous';

/**
 * Controller handling safety tickets filing, responder dispatching, and AI summaries.
 * Strictly validates inputs, authorizes roles, and delegates business rules to IncidentService.
 */
export class IncidentController {
  /**
   * Files a new incident ticket.
   */
  public async file(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const reporter = this.resolveActor(req);
      const { title, description, severity, location } = req.body;
      const incidentService = getIncidentService();

      const incident = await incidentService.fileIncident({
        title,
        description,
        severity,
        location,
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

  /**
   * Retrieves all registered incident tickets.
   */
  public async getIncidents(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const incidentService = getIncidentService();
      const incidents = await incidentService.getIncidents();
      res.status(200).json({
        status: 'Success',
        data: incidents.map(i => i.toJSON())
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Appends status update commentary to the incident's progress log timeline.
   */
  public async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const updater = this.resolveActor(req);
      const { status, comment } = req.body;
      const incidentService = getIncidentService();

      const incident = await incidentService.updateIncidentStatus(
        req.params.id,
        status,
        comment,
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

  /**
   * Dispatches a named responder or staff member to the incident area.
   */
  public async assignStaff(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const updater = this.resolveActor(req);
      const { assignedStaff } = req.body;
      const incidentService = getIncidentService();

      const incident = await incidentService.assignStaff(
        req.params.id,
        assignedStaff,
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

  /**
   * Generates a professional AI executive summary briefing card.
   */
  public async generateSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const incidentService = getIncidentService();
      const incident = await incidentService.generateAiSummary(req.params.id);
      res.status(200).json({
        status: 'Success',
        message: 'AI briefing report compiled successfully',
        data: incident.toJSON()
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Extracts the actor's username from the authenticated request object.
   * @param req The incoming request object
   */
  private resolveActor(req: AuthenticatedRequest): string {
    return req.user?.username ?? ANONYMOUS_ACTOR;
  }
}

export const incidentControllerInstance = new IncidentController();
