import { User, UserRole, UserProfile, AuthResult } from '../../domain/entities/user.entity';
import { Match, MatchStatus } from '../../domain/entities/match.entity';
import { Gate, GateStatus } from '../../domain/entities/gate.entity';
import { Telemetry } from '../../domain/entities/telemetry.entity';
import { Incident, IncidentSeverity, IncidentStatus } from '../../domain/entities/incident.entity';
import { Volunteer } from '../../domain/entities/volunteer.entity';

export interface IAuthService {
  register(payload: {
    username: string;
    passwordPlain: string;
    role: UserRole;
    name: string;
    email: string;
  }): Promise<User>;
  login(username: string, passwordPlain: string): Promise<AuthResult>;
  getUserProfile(id: string): Promise<UserProfile>;
}

export interface ITournamentService {
  scheduleMatch(payload: {
    homeTeam: string;
    awayTeam: string;
    startTime: string;
    endTime: string;
    venue: string;
    referee: string;
  }): Promise<Match>;
  getMatches(): Promise<Match[]>;
  updateMatchStatus(matchId: string, status: MatchStatus, safetyMessage?: string): Promise<Match>;
}

export interface IStadiumService {
  getGates(): Promise<Gate[]>;
  updateGateStatus(gateId: string, status: GateStatus): Promise<Gate>;
  updateGateTelemetry(
    gateId: string,
    payload: { turnstileFlowRate: number; currentOccupancy: number; capacityLimit: number }
  ): Promise<Gate>;
  getTelemetry(): Promise<Telemetry | null>;
  getTelemetryHistory(): Promise<Telemetry[]>;
  recalculateTelemetryMetrics(): Promise<Telemetry>;
}

export interface IIncidentService {
  fileIncident(payload: {
    title: string;
    description: string;
    severity: IncidentSeverity;
    location: string;
    reportedBy: string;
  }): Promise<Incident>;
  getIncidents(): Promise<Incident[]>;
  updateIncidentStatus(
    incidentId: string,
    status: IncidentStatus,
    comment: string,
    updatedBy: string
  ): Promise<Incident>;
  assignStaff(incidentId: string, staffName: string, updatedBy: string): Promise<Incident>;
  generateAiSummary(incidentId: string): Promise<Incident>;
}

export interface IVolunteerService {
  registerVolunteer(name: string, userId: string | null): Promise<Volunteer>;
  checkIn(volunteerId: string, assignedSection: string, skills: string[]): Promise<Volunteer>;
  checkOut(volunteerId: string): Promise<Volunteer>;
  reallocateVolunteer(volunteerId: string, section: string, task: string): Promise<Volunteer>;
  getVolunteers(): Promise<Volunteer[]>;
}
