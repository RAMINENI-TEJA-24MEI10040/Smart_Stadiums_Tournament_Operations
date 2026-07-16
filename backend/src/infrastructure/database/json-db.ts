import * as fs from 'fs/promises';
import * as path from 'path';

export interface JsonUser {
  id: string;
  username: string;
  passwordHash: string;
  role: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface JsonMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  startTime: string;
  endTime: string;
  status: string;
  venue: string;
  referee: string;
  safetyLog: string[];
  createdAt: string;
}

export interface JsonGate {
  id: string;
  name: string;
  turnstileFlowRate: number;
  currentOccupancy: number;
  capacityLimit: number;
  status: string;
  lastUpdated: string;
}

export interface JsonIncidentTimelineEntry {
  status: string;
  comment: string;
  timestamp: string;
  updatedBy: string;
}

export interface JsonIncident {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  location: string;
  reportedBy: string;
  assignedStaff: string | null;
  aiSummary: string | null;
  timeline: JsonIncidentTimelineEntry[];
  createdAt: string;
}

export interface JsonVolunteer {
  id: string;
  userId: string | null;
  name: string;
  assignedSection: string;
  skills: string[];
  status: string;
  currentTask: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
}

export interface JsonTelemetry {
  stadiumId: string;
  totalAttendance: number;
  activeGatesCount: number;
  congestedGatesCount: number;
  averageQueueTime: number;
  co2Level: number;
  temperature: number;
  sustainabilityScore: number;
  powerConsumption: number;
  waterUsage: number;
  carbonFootprint: number;
  timestamp: string;
}

export interface Schema {
  users: JsonUser[];
  matches: JsonMatch[];
  gates: JsonGate[];
  incidents: JsonIncident[];
  volunteers: JsonVolunteer[];
  telemetry: JsonTelemetry[];
}

export class JsonDatabase {
  private readonly filePath: string;
  private writeLock: Promise<void> = Promise.resolve();

  constructor(filePath?: string) {
    this.filePath = filePath ?? path.join(__dirname, '..', '..', '..', 'data.json');
  }

  private async initializeIfNeeded(): Promise<void> {
    try {
      await fs.access(this.filePath);
    } catch {
      const defaultSchema: Schema = {
        users: [],
        matches: [],
        gates: [
          { id: 'gate-1', name: 'North Gate 1', turnstileFlowRate: 120, currentOccupancy: 800, capacityLimit: 1200, status: 'Open', lastUpdated: new Date().toISOString() },
          { id: 'gate-2', name: 'East Gate 2', turnstileFlowRate: 240, currentOccupancy: 1150, capacityLimit: 1200, status: 'Congested', lastUpdated: new Date().toISOString() },
          { id: 'gate-3', name: 'South Gate 3', turnstileFlowRate: 0, currentOccupancy: 0, capacityLimit: 1000, status: 'Closed', lastUpdated: new Date().toISOString() },
          { id: 'gate-4', name: 'West Gate 4', turnstileFlowRate: 90, currentOccupancy: 400, capacityLimit: 1000, status: 'Open', lastUpdated: new Date().toISOString() }
        ],
        incidents: [],
        volunteers: [],
        telemetry: [
          {
            stadiumId: 'stadium-main',
            totalAttendance: 2350,
            activeGatesCount: 3,
            congestedGatesCount: 1,
            averageQueueTime: 18.5,
            co2Level: 520,
            temperature: 24.5,
            sustainabilityScore: 82,
            powerConsumption: 450,
            waterUsage: 120,
            carbonFootprint: 180.4,
            timestamp: new Date().toISOString()
          }
        ]
      };
      await fs.writeFile(this.filePath, JSON.stringify(defaultSchema, null, 2), 'utf-8');
    }
  }

  public async read(): Promise<Schema> {
    await this.initializeIfNeeded();
    const data = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(data) as Schema;
  }

  public async write(data: Schema): Promise<void> {
    const release = await this.acquireLock();
    try {
      await fs.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    } finally {
      release();
    }
  }

  private acquireLock(): Promise<() => void> {
    let resolveLock: () => void;
    const nextLock = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });

    const currentLock = this.writeLock;
    this.writeLock = nextLock;

    return currentLock.then(() => () => {
      resolveLock();
    });
  }
}

export const jsonDbInstance = new JsonDatabase();
