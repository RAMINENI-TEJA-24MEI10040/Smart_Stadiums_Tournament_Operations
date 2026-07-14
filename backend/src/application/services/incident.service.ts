import { dbFactoryInstance } from '../../infrastructure/database/db-factory';
import { Incident, IncidentSeverity, IncidentStatus } from '../../domain/entities/incident.entity';
import { aiProviderInstance } from '../../infrastructure/ai/providers/ai-provider';

/**
 * Service managing stadium safety ticket reports, timeline updates, responder assignments,
 * and AI-generated executive briefs.
 */
export class IncidentService {
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
    const repos = dbFactoryInstance.getRepositories();
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

    return repos.incidentRepository.save(newIncident);
  }

  /**
   * Fetches all registered incidents logs.
   *
   * @returns List of Incident domain entities.
   */
  public async getIncidents(): Promise<Incident[]> {
    const repos = dbFactoryInstance.getRepositories();
    return repos.incidentRepository.findAll();
  }

  /**
   * Appends a status comment update to the incident's timeline.
   *
   * @param incidentId Target incident identifier.
   * @param status Next incident status state.
   * @param comment Audit detail text.
   * @param updatedBy Author of the status change.
   * @returns The updated Incident state.
   * @throws Error if the incident is not found.
   */
  public async updateIncidentStatus(
    incidentId: string,
    status: IncidentStatus,
    comment: string,
    updatedBy: string
  ): Promise<Incident> {
    const repos = dbFactoryInstance.getRepositories();
    const incident = await repos.incidentRepository.findById(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
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

    return repos.incidentRepository.save(updatedIncident);
  }

  /**
   * Assigns an operational safety staff member or responder to the ticket.
   *
   * @param incidentId Target incident identifier.
   * @param staffName Name of the assigned responder.
   * @param updatedBy Author of the assignment.
   * @returns The updated Incident state.
   * @throws Error if the incident is not found.
   */
  public async assignStaff(incidentId: string, staffName: string, updatedBy: string): Promise<Incident> {
    const repos = dbFactoryInstance.getRepositories();
    const incident = await repos.incidentRepository.findById(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
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

    return repos.incidentRepository.save(updatedIncident);
  }

  /**
   * Generates a professional AI summary of the incident details and historical timeline.
   *
   * @param incidentId Target incident identifier.
   * @returns The updated Incident containing the executive brief summary.
   * @throws Error if the incident is not found.
   */
  public async generateAiSummary(incidentId: string): Promise<Incident> {
    const repos = dbFactoryInstance.getRepositories();
    const incident = await repos.incidentRepository.findById(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    const timelineString = incident.timeline
      .map(t => `[${t.timestamp}] Status: ${t.status} | By: ${t.updatedBy} | Details: ${t.comment}`)
      .join('\n');

    const prompt = `
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

    return repos.incidentRepository.save(updatedIncident);
  }
}

export const incidentServiceInstance = new IncidentService();
