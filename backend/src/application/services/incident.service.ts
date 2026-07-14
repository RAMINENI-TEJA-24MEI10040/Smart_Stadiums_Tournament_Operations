import { dbFactoryInstance } from '../../infrastructure/database/db-factory';
import { Incident, IncidentSeverity, IncidentStatus } from '../../domain/entities/incident.entity';
import { aiProviderInstance } from '../../infrastructure/ai/providers/ai-provider';

export class IncidentService {
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

  public async getIncidents(): Promise<Incident[]> {
    const repos = dbFactoryInstance.getRepositories();
    return repos.incidentRepository.findAll();
  }

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

  // Uses GenAI to summarize incident timeline into a standard corporate briefing
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
