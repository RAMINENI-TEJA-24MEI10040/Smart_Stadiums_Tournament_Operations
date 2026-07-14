export type GateStatus = 'Open' | 'Closed' | 'Congested' | 'Maintenance';

export class Gate {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly turnstileFlowRate: number, // people per min
    public readonly currentOccupancy: number,
    public readonly capacityLimit: number,
    public readonly status: GateStatus,
    public readonly lastUpdated: Date
  ) {}

  public toJSON() {
    return {
      id: this.id,
      name: this.name,
      turnstileFlowRate: this.turnstileFlowRate,
      currentOccupancy: this.currentOccupancy,
      capacityLimit: this.capacityLimit,
      status: this.status,
      lastUpdated: this.lastUpdated.toISOString()
    };
  }
}
