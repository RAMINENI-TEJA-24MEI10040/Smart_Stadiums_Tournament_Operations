import { dbFactoryInstance } from '../../database/db-factory';
import { Gate } from '../../../domain/entities/gate.entity';
import { Volunteer } from '../../../domain/entities/volunteer.entity';
import { Incident, IncidentSeverity } from '../../../domain/entities/incident.entity';

export class ToolRegistry {
  
  // Tool: Fetch All Stadium Gate occupancy details
  public async getGatesState(): Promise<Gate[]> {
    const repos = dbFactoryInstance.getRepositories();
    return repos.gateRepository.findAll();
  }

  // Tool: Open or Close a gate dynamically
  public async updateGateStatus(gateId: string, status: 'Open' | 'Closed' | 'Congested' | 'Maintenance'): Promise<string> {
    const repos = dbFactoryInstance.getRepositories();
    const gate = await repos.gateRepository.findById(gateId);
    if (!gate) {
      return `Error: Gate with ID ${gateId} not found.`;
    }

    const updatedGate = new Gate(
      gate.id,
      gate.name,
      status === 'Open' ? 120 : (status === 'Closed' ? 0 : gate.turnstileFlowRate),
      status === 'Closed' ? 0 : gate.currentOccupancy,
      gate.capacityLimit,
      status,
      new Date()
    );

    await repos.gateRepository.save(updatedGate);
    return `Success: Gate ${gate.name} status updated to ${status}.`;
  }

  // Tool: Fetch All active volunteers
  public async getVolunteers(): Promise<Volunteer[]> {
    const repos = dbFactoryInstance.getRepositories();
    return repos.volunteerRepository.findAll();
  }

  // Tool: Assign a task or section to a volunteer
  public async reallocateVolunteer(volunteerId: string, section: string, task: string): Promise<string> {
    const repos = dbFactoryInstance.getRepositories();
    const volunteer = await repos.volunteerRepository.findById(volunteerId);
    if (!volunteer) {
      return `Error: Volunteer with ID ${volunteerId} not found.`;
    }

    const updatedVolunteer = new Volunteer(
      volunteer.id,
      volunteer.userId,
      volunteer.name,
      section,
      volunteer.skills,
      'Active',
      task,
      volunteer.checkInTime || new Date(),
      volunteer.checkOutTime
    );

    await repos.volunteerRepository.save(updatedVolunteer);
    return `Success: Volunteer ${volunteer.name} assigned to ${section} for task: ${task}.`;
  }

  // Tool: Trigger security or medical incidents
  public async fileIncident(title: string, description: string, severity: IncidentSeverity, location: string): Promise<string> {
    const repos = dbFactoryInstance.getRepositories();
    const id = `inc-${Date.now()}`;
    const newIncident = new Incident(
      id,
      title,
      description,
      severity,
      'Reported',
      location,
      'AI_Guard_Agent',
      null,
      null,
      [{ status: 'Reported', comment: 'Incident filed via AI operations copilot', timestamp: new Date().toISOString(), updatedBy: 'AI_Agent' }],
      new Date()
    );

    await repos.incidentRepository.save(newIncident);
    return `Success: Incident ${id} (${title}) reported at ${location} with severity ${severity}.`;
  }
}

export const toolRegistryInstance = new ToolRegistry();
