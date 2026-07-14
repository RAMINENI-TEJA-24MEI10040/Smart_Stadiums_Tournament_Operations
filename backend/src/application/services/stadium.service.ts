import { dbFactoryInstance } from '../../infrastructure/database/db-factory';
import { Gate, GateStatus } from '../../domain/entities/gate.entity';
import { Telemetry } from '../../domain/entities/telemetry.entity';

/**
 * Service managing stadium operations, gate statuses, and real-time environmental telemetry metrics.
 */
export class StadiumService {
  /**
   * Retrieves all entry gates configuration and statuses.
   *
   * @returns List of Gate domain entities.
   */
  public async getGates(): Promise<Gate[]> {
    const repos = dbFactoryInstance.getRepositories();
    return repos.gateRepository.findAll();
  }

  /**
   * Updates an entry gate's status (Open, Closed, Congested, Maintenance).
   *
   * @param gateId Targeted gate identifier.
   * @param status Next status state.
   * @returns The updated Gate domain entity.
   * @throws Error if the gate does not exist.
   */
  public async updateGateStatus(gateId: string, status: GateStatus): Promise<Gate> {
    const repos = dbFactoryInstance.getRepositories();
    const gate = await repos.gateRepository.findById(gateId);
    if (!gate) {
      throw new Error('Gate not found');
    }

    const updatedGate = new Gate(
      gate.id,
      gate.name,
      status === 'Closed' ? 0 : gate.turnstileFlowRate,
      status === 'Closed' ? 0 : gate.currentOccupancy,
      gate.capacityLimit,
      status,
      new Date()
    );

    return repos.gateRepository.save(updatedGate);
  }

  /**
   * Updates dynamic turnstile flow and occupancy parameters recorded by IoT sensors.
   *
   * @param gateId Target gate identifier.
   * @param payload Live turnstile flow rate, spectator occupancy, and absolute limits.
   * @returns Resolves with the mutated Gate domain entity.
   */
  public async updateGateTelemetry(
    gateId: string,
    payload: { turnstileFlowRate: number; currentOccupancy: number; capacityLimit: number }
  ): Promise<Gate> {
    const repos = dbFactoryInstance.getRepositories();
    const gate = await repos.gateRepository.findById(gateId);
    if (!gate) {
      throw new Error('Gate not found');
    }

    let status: GateStatus = 'Open';
    if (payload.currentOccupancy >= payload.capacityLimit) {
      status = 'Congested';
    } else if (payload.turnstileFlowRate === 0) {
      status = 'Closed';
    }

    const updatedGate = new Gate(
      gate.id,
      gate.name,
      payload.turnstileFlowRate,
      payload.currentOccupancy,
      payload.capacityLimit,
      status,
      new Date()
    );

    await repos.gateRepository.save(updatedGate);
    await this.recalculateTelemetryMetrics();
    return updatedGate;
  }

  /**
   * Fetches the latest computed stadium telemetry aggregate status.
   *
   * @returns Latest Telemetry card, or null if none recorded.
   */
  public async getTelemetry(): Promise<Telemetry | null> {
    const repos = dbFactoryInstance.getRepositories();
    return repos.telemetryRepository.getLatest();
  }

  /**
   * Retrieves historical telemetry logs to chart operations trends.
   *
   * @returns List of Telemetry logs.
   */
  public async getTelemetryHistory(): Promise<Telemetry[]> {
    const repos = dbFactoryInstance.getRepositories();
    return repos.telemetryRepository.getHistory(30);
  }

  /**
   * Recalculates total stadium occupancy, queue wait times, CO2 volumes, power load, and green rating indexes.
   *
   * @returns The newly updated Telemetry aggregates log.
   */
  public async recalculateTelemetryMetrics(): Promise<Telemetry> {
    const repos = dbFactoryInstance.getRepositories();
    const gates = await repos.gateRepository.findAll();
    
    let totalAttendance = 0;
    let activeCount = 0;
    let congestedCount = 0;
    let totalQueueTime = 0;

    gates.forEach(g => {
      totalAttendance += g.currentOccupancy;
      if (g.status !== 'Closed' && g.status !== 'Maintenance') {
        activeCount += 1;
        // Turnstile queue delay estimation (Occupancy / flow rate)
        if (g.turnstileFlowRate > 0) {
          totalQueueTime += (g.currentOccupancy / g.turnstileFlowRate);
        }
      }
      if (g.status === 'Congested') {
        congestedCount += 1;
      }
    });

    const averageQueueTime = activeCount > 0 ? (totalQueueTime / activeCount) : 0;

    // Utility load scales dynamically with attendance
    const attendanceFactor = totalAttendance / 5000;
    const co2Level = Math.round(400 + 300 * attendanceFactor);
    const powerConsumption = Math.round(200 + 400 * attendanceFactor);
    const waterUsage = Math.round(50 + 150 * attendanceFactor);
    const carbonFootprint = Number((powerConsumption * 0.45).toFixed(2));
    
    // Higher attendance slightly lowers sustainability rating unless mitigation steps taken
    let sustainabilityScore = 90 - Math.round(15 * attendanceFactor);
    if (sustainabilityScore < 50) sustainabilityScore = 50;

    const newTelemetry = new Telemetry(
      'stadium-main',
      totalAttendance,
      activeCount,
      congestedCount,
      Number(averageQueueTime.toFixed(1)),
      co2Level,
      24.5,
      sustainabilityScore,
      powerConsumption,
      waterUsage,
      carbonFootprint,
      new Date()
    );

    return repos.telemetryRepository.save(newTelemetry);
  }
}

export const stadiumServiceInstance = new StadiumService();
