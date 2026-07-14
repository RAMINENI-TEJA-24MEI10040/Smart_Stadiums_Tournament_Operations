import { dbFactoryInstance } from '../../infrastructure/database/db-factory';
import { Incident, IncidentSeverity, IncidentStatus } from '../../domain/entities/incident.entity';
import { aiProviderInstance } from '../../infrastructure/ai/providers/ai-provider';
import { IIncidentService } from '../interfaces/services.interface';
import { IIncidentRepository } from '../interfaces/incident-repository.interface';
import { NotFoundException } from '../../shared/exceptions';
import { logger } from '../../shared/logger';

/**
 * Service managing stadium safety ticket reports, timeline updates, responder assignments,
 * and AI-generated executive briefs.
 */
export class IncidentService implements IIncidentService {
  private incidentRepository?: IIncidentRepository;

  constructor(incidentRepository?: IIncidentRepository) {
    this.incidentRepository = incidentRepository;
  }

  private get incidentRepo(): IIncidentRepository {
    return this.incidentRepository || dbFactoryInstance.getRepositories().incidentRepository;
  }

  /**
   * Files a new stadium incident ticket and stages the initial reported timeline entry.
   *
   * @param payload Title, description, severity level, location, and reporter name.
   * @returns The newly created Incident domain entity.
   */
  public async fileIncident(payload: {
    title: string;
    description: string;
    severity: IncidentSeverity;
    location: string;
    reportedBy: string;
  }): Promise<Incident> {
    logger.info(`Filing new incident ticket: "${payload.title}" [Severity: ${payload.severity}] at ${payload.location}`);
    const incidentId = `inc-${Date.now()}`;
    const timelineEntry = {
      status: 'Reported' as IncidentStatus,
      comment: 'Incident reported successfully.',
      timestamp: new Date().toISOString(),
      updatedBy: payload.reportedBy
    };

    const newIncident = new Incident(
      incidentId,
      payload.title,
      payload.description,
      payload.severity,
      'Reported',
      payload.location,
      payload.reportedBy,
      null,
      null,
      [timelineEntry],
      new Date()
    );

    const saved = await this.incidentRepo.save(newIncident);
    logger.info(`Incident ticket successfully registered with ID: ${incidentId}`);
    return saved;
  }

  /**
   * Fetches all registered incidents logs.
   *
   * @returns List of Incident domain entities.
   */
  public async getIncidents(): Promise<Incident[]> {
    logger.info('Fetching incidents lists from repository');
    return this.incidentRepo.findAll();
  }

  /**
   * Appends a status comment update to the incident's timeline.
   *
   * @param incidentId Target incident identifier.
   * @param status Next incident status state.
   * @param comment Audit detail text.
   * @param updatedBy Author of the status change.
   * @returns The updated Incident state.
   * @throws NotFoundException if the incident is not found.
   */
  public async updateIncidentStatus(
    incidentId: string,
    status: IncidentStatus,
    comment: string,
    updatedBy: string
  ): Promise<Incident> {
    logger.info(`Request received to update Incident ID: ${incidentId} status to ${status} by ${updatedBy}`);
    const incident = await this.incidentRepo.findById(incidentId);
    if (!incident) {
      logger.warn(`Incident status update rejected: ID ${incidentId} not found`);
      throw new NotFoundException('Incident not found');
    }

    const timeline = [...incident.timeline];
    timeline.push({
      status,
      comment,
      timestamp: new Date().toISOString(),
      updatedBy
    });

    const updatedIncident = new Incident(
      incident.id,
      incident.title,
      incident.description,
      incident.severity,
      status,
      incident.location,
      incident.reportedBy,
      incident.assignedStaff,
      incident.aiSummary,
      timeline,
      incident.createdAt
    );

    const saved = await this.incidentRepo.save(updatedIncident);
    logger.info(`Incident ID ${incidentId} timeline updated successfully`);
    return saved;
  }

  /**
   * Assigns an operational safety staff member or responder to the ticket.
   *
   * @param incidentId Target incident identifier.
   * @param staffName Name of the assigned responder.
   * @param updatedBy Author of the assignment.
   * @returns The updated Incident state.
   * @throws NotFoundException if the incident is not found.
   */
  public async assignStaff(incidentId: string, staffName: string, updatedBy: string): Promise<Incident> {
    logger.info(`Assigning staff: ${staffName} to Incident ID: ${incidentId} by ${updatedBy}`);
    const incident = await this.incidentRepo.findById(incidentId);
    if (!incident) {
      logger.warn(`Incident staff assignment rejected: ID ${incidentId} not found`);
      throw new NotFoundException('Incident not found');
    }

    const timeline = [...incident.timeline];
    timeline.push({
      status: incident.status,
      comment: `Staff assigned: ${staffName}`,
      timestamp: new Date().toISOString(),
      updatedBy
    });

    const updatedIncident = new Incident(
      incident.id,
      incident.title,
      incident.description,
      incident.severity,
      incident.status === 'Reported' ? 'Dispatched' : incident.status,
      incident.location,
      incident.reportedBy,
      staffName,
      incident.aiSummary,
      timeline,
      incident.createdAt
    );

    const saved = await this.incidentRepo.save(updatedIncident);
    logger.info(`Staff ${staffName} successfully assigned to Incident ID ${incidentId}`);
    return saved;
  }

  /**
   * Generates a professional AI summary of the incident details and historical timeline.
   *
   * @param incidentId Target incident identifier.
   * @returns The updated Incident containing the executive brief summary.
   * @throws NotFoundException if the incident is not found.
   */
  public async generateAiSummary(incidentId: string): Promise<Incident> {
    logger.info(`Request received to generate AI Executive summary for Incident ID: ${incidentId}`);
    const incident = await this.incidentRepo.findById(incidentId);
    if (!incident) {
      logger.warn(`AI incident summarization rejected: ID ${incidentId} not found`);
      throw new NotFoundException('Incident not found');
    }

    const timelineString = this.formatTimelineLogs(incident.timeline);
    const prompt = this.constructBriefingPrompt(incident, timelineString);

    logger.info(`Triggering GenAI summary API context for Incident ID ${incidentId}`);
    const aiRes = await aiProviderInstance.generateText(prompt, 'You generate corporate incident briefs.');
    
    const updatedIncident = new Incident(
      incident.id,
      incident.title,
      incident.description,
      incident.severity,
      incident.status,
      incident.location,
      incident.reportedBy,
      incident.assignedStaff,
      aiRes.text,
      incident.timeline,
      incident.createdAt
    );

    const saved = await this.incidentRepo.save(updatedIncident);
    logger.info(`AI summary successfully compiled and persisted for Incident ID ${incidentId}`);
    return saved;
  }

  // --- Private Helpers to Reduce Function Length & Complexity ---

  private formatTimelineLogs(timeline: Array<{ timestamp: string; status: IncidentStatus; updatedBy: string; comment: string }>): string {
    return timeline
      .map(t => `[${t.timestamp}] Status: ${t.status} | By: ${t.updatedBy} | Details: ${t.comment}`)
      .join('\n');
  }

  private constructBriefingPrompt(incident: Incident, timelineString: string): string {
    return `
      You are an Incident Report Agent.
      Please write a professional, corporate summary of the following stadium safety ticket.
      
      TICKET DETAIL:
      ID: ${incident.id}
      Title: ${incident.title}
      Description: ${incident.description}
      Severity: ${incident.severity}
      Location: ${incident.location}
      Reported By: ${incident.reportedBy}

      TICKET LOGS TIMELINE:
      ${timelineString}

      Format your output with:
      - Executive Briefing
      - Root Cause Analysis
      - Operational Resolution Details
    `;
  }
}

export const incidentServiceInstance = new IncidentService();
