import { dbFactoryInstance } from '../../infrastructure/database/db-factory';
import { Gate, GateStatus } from '../../domain/entities/gate.entity';
import { Telemetry } from '../../domain/entities/telemetry.entity';
import { IStadiumService } from '../interfaces/services.interface';
import { IGateRepository } from '../interfaces/gate-repository.interface';
import { ITelemetryRepository } from '../interfaces/telemetry-repository.interface';
import { NotFoundException } from '../../shared/exceptions';
import { logger } from '../../shared/logger';

/**
 * Service managing stadium operations, gate statuses, and real-time environmental telemetry metrics.
 */
export class StadiumService implements IStadiumService {
  private gateRepository?: IGateRepository;
  private telemetryRepository?: ITelemetryRepository;

  constructor(gateRepository?: IGateRepository, telemetryRepository?: ITelemetryRepository) {
    this.gateRepository = gateRepository;
    this.telemetryRepository = telemetryRepository;
  }

  private get gateRepo(): IGateRepository {
    return this.gateRepository || dbFactoryInstance.getRepositories().gateRepository;
  }

  private get telemetryRepo(): ITelemetryRepository {
    return this.telemetryRepository || dbFactoryInstance.getRepositories().telemetryRepository;
  }

  /**
   * Retrieves all entry gates configuration and statuses.
   *
   * @returns List of Gate domain entities.
   */
  public async getGates(): Promise<Gate[]> {
    logger.info('Fetching gates list from repository');
    return this.gateRepo.findAll();
  }

  /**
   * Updates an entry gate's status (Open, Closed, Congested, Maintenance).
   *
   * @param gateId Targeted gate identifier.
   * @param status Next status state.
   * @returns The updated Gate domain entity.
   * @throws NotFoundException if the gate does not exist.
   */
  public async updateGateStatus(gateId: string, status: GateStatus): Promise<Gate> {
    logger.info(`Request received to update Gate ID: ${gateId} status to ${status}`);
    const gate = await this.gateRepo.findById(gateId);
    if (!gate) {
      logger.warn(`Gate status update rejected: Gate ID ${gateId} not found`);
      throw new NotFoundException('Gate not found');
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

    const saved = await this.gateRepo.save(updatedGate);
    logger.info(`Gate ID ${gateId} status updated successfully`);
    return saved;
  }

  /**
   * Updates dynamic turnstile flow and occupancy parameters recorded by IoT sensors.
   *
   * @param gateId Target gate identifier.
   * @param payload Live turnstile flow rate, spectator occupancy, and absolute limits.
   * @returns Resolves with the mutated Gate domain entity.
   * @throws NotFoundException if the gate does not exist.
   */
  public async updateGateTelemetry(
    gateId: string,
    payload: { turnstileFlowRate: number; currentOccupancy: number; capacityLimit: number }
  ): Promise<Gate> {
    logger.info(`Received telemetry packet from IoT sensors for Gate ID: ${gateId}`);
    const gate = await this.gateRepo.findById(gateId);
    if (!gate) {
      logger.warn(`Gate telemetry update rejected: Gate ID ${gateId} not found`);
      throw new NotFoundException('Gate not found');
    }

    const status = this.determineGateStatus(payload.turnstileFlowRate, payload.currentOccupancy, payload.capacityLimit);

    const updatedGate = new Gate(
      gate.id,
      gate.name,
      payload.turnstileFlowRate,
      payload.currentOccupancy,
      payload.capacityLimit,
      status,
      new Date()
    );

    await this.gateRepo.save(updatedGate);
    logger.info(`Gate telemetry registered for Gate ID ${gateId}. Recalculating aggregates...`);
    await this.recalculateTelemetryMetrics();
    return updatedGate;
  }

  /**
   * Fetches the latest computed stadium telemetry aggregate status.
   *
   * @returns Latest Telemetry card, or null if none recorded.
   */
  public async getTelemetry(): Promise<Telemetry | null> {
    logger.info('Fetching latest telemetry aggregate card');
    return this.telemetryRepo.getLatest();
  }

  /**
   * Retrieves historical telemetry logs to chart operations trends.
   *
   * @returns List of Telemetry logs.
   */
  public async getTelemetryHistory(): Promise<Telemetry[]> {
    logger.info('Fetching historical telemetry logs');
    return this.telemetryRepo.getHistory(30);
  }

  /**
   * Recalculates total stadium occupancy, queue wait times, CO2 volumes, power load, and green rating indexes.
   *
   * @returns The newly updated Telemetry aggregates log.
   */
  public async recalculateTelemetryMetrics(): Promise<Telemetry> {
    logger.info('Recalculating stadium aggregate telemetry indexes...');
    const gates = await this.gateRepo.findAll();
    const stats = this.calculateGateStats(gates);
    const utilities = this.calculateUtilityLoads(stats.totalAttendance);

    const newTelemetry = new Telemetry(
      'stadium-main',
      stats.totalAttendance,
      stats.activeCount,
      stats.congestedCount,
      stats.averageQueueTime,
      utilities.co2Level,
      24.5,
      utilities.sustainabilityScore,
      utilities.powerConsumption,
      utilities.waterUsage,
      utilities.carbonFootprint,
      new Date()
    );

    const saved = await this.telemetryRepo.save(newTelemetry);
    logger.info('Stadium aggregate metrics updated and persisted.', { totalAttendance: stats.totalAttendance, averageQueueTime: stats.averageQueueTime });
    return saved;
  }

  // --- Private Helpers to Reduce Cyclomatic Complexity ---

  private determineGateStatus(flowRate: number, occupancy: number, limit: number): GateStatus {
    if (occupancy >= limit) {
      return 'Congested';
    }
    if (flowRate === 0) {
      return 'Closed';
    }
    return 'Open';
  }

  private calculateGateStats(gates: Gate[]): {
    totalAttendance: number;
    activeCount: number;
    congestedCount: number;
    averageQueueTime: number;
  } {
    let totalAttendance = 0;
    let activeCount = 0;
    let congestedCount = 0;
    let totalQueueTime = 0;

    gates.forEach(g => {
      totalAttendance += g.currentOccupancy;
      if (g.status !== 'Closed' && g.status !== 'Maintenance') {
        activeCount += 1;
        if (g.turnstileFlowRate > 0) {
          totalQueueTime += (g.currentOccupancy / g.turnstileFlowRate);
        }
      }
      if (g.status === 'Congested') {
        congestedCount += 1;
      }
    });

    const averageQueueTime = activeCount > 0 ? Number((totalQueueTime / activeCount).toFixed(1)) : 0;

    return {
      totalAttendance,
      activeCount,
      congestedCount,
      averageQueueTime
    };
  }

  private calculateUtilityLoads(totalAttendance: number): {
    co2Level: number;
    powerConsumption: number;
    waterUsage: number;
    carbonFootprint: number;
    sustainabilityScore: number;
  } {
    const attendanceFactor = totalAttendance / 5000;
    const co2Level = Math.round(400 + 300 * attendanceFactor);
    const powerConsumption = Math.round(200 + 400 * attendanceFactor);
    const waterUsage = Math.round(50 + 150 * attendanceFactor);
    const carbonFootprint = Number((powerConsumption * 0.45).toFixed(2));
    
    let sustainabilityScore = 90 - Math.round(15 * attendanceFactor);
    if (sustainabilityScore < 50) {
      sustainabilityScore = 50;
    }

    return {
      co2Level,
      powerConsumption,
      waterUsage,
      carbonFootprint,
      sustainabilityScore
    };
  }
}

export const stadiumServiceInstance = new StadiumService();
