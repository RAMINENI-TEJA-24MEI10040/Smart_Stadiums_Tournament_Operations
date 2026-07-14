import * as fs from 'fs/promises';
import * as path from 'path';

interface Schema {
  users: any[];
  matches: any[];
  gates: any[];
  incidents: any[];
  volunteers: any[];
  telemetry: any[];
}

export class JsonDatabase {
  private filePath: string;
  private writeLock: Promise<void> = Promise.resolve();

  constructor(filePath?: string) {
    this.filePath = filePath || path.join(__dirname, '..', '..', '..', 'data.json');
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
    return JSON.parse(data);
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
