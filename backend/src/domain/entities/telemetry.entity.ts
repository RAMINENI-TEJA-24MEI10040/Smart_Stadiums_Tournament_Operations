export class Telemetry {
  constructor(
    public readonly stadiumId: string,
    public readonly totalAttendance: number,
    public readonly activeGatesCount: number,
    public readonly congestedGatesCount: number,
    public readonly averageQueueTime: number, // in minutes
    public readonly co2Level: number, // ppm
    public readonly temperature: number, // Celsius
    public readonly sustainabilityScore: number, // 0 - 100
    public readonly powerConsumption: number, // kW
    public readonly waterUsage: number, // liters/min
    public readonly carbonFootprint: number, // kg CO2e
    public readonly timestamp: Date
  ) {}

  public toJSON() {
    return {
      stadiumId: this.stadiumId,
      totalAttendance: this.totalAttendance,
      activeGatesCount: this.activeGatesCount,
      congestedGatesCount: this.congestedGatesCount,
      averageQueueTime: this.averageQueueTime,
      co2Level: this.co2Level,
      temperature: this.temperature,
      sustainabilityScore: this.sustainabilityScore,
      powerConsumption: this.powerConsumption,
      waterUsage: this.waterUsage,
      carbonFootprint: this.carbonFootprint,
      timestamp: this.timestamp.toISOString()
    };
  }
}
