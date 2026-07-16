import { dbFactoryInstance } from '../../infrastructure/database/db-factory';
import { Gate, GateStatus } from '../../domain/entities/gate.entity';
import { Telemetry } from '../../domain/entities/telemetry.entity';
import { IStadiumService } from '../interfaces/services.interface';
import { IGateRepository } from '../interfaces/gate-repository.interface';
import { ITelemetryRepository } from '../interfaces/telemetry-repository.interface';
import { NotFoundException } from '../../shared/exceptions';
import { logger } from '../../shared/logger';

/** Default history log retrieval count. */
const DEFAULT_HISTORY_LIMIT = 30;

/** Default baseline temperature (Celsius). */
const BASELINE_TEMPERATURE = 24.5;

/** Default stadium ID mapping identifier. */
const STADIUM_ID = 'stadium-main';

/** Baseline attendance divider parameter to calculate load ratio. */
const ATTENDANCE_DIVIDER = 5000;

/** CO2 baseline content level (ppm). */
const CO2_BASE = 400;
/** CO2 multiplier scale factor. */
const CO2_SCALE = 300;

/** Power load baseline content level (kW). */
const POWER_BASE = 200;
/** Power load multiplier scale factor. */
const POWER_SCALE = 400;

/** Water usage baseline volume (L/min). */
const WATER_BASE = 50;
/** Water usage multiplier scale factor. */
const WATER_SCALE = 150;

/** Carbon offset factor per dynamic power usage. */
const CARBON_FACTOR = 0.45;

/** Dynamic sustainability ceiling rate. */
const SUSTAINABILITY_CEILING = 90;
/** Sustainability decay multiplier factor. */
const SUSTAINABILITY_DECAY = 15;
/** Sustainability floor index value. */
const SUSTAINABILITY_FLOOR = 50;

/**
 * Service managing stadium operations, gate statuses, and real-time environmental telemetry metrics.
 * Decoupled from concrete adapters via constructor-based dependency injection.
 */
export class StadiumService implements IStadiumService {
  private readonly gateRepository: IGateRepository;
  private readonly telemetryRepository: ITelemetryRepository;

  /**
   * Creates an instance of StadiumService.
   * @param gateRepository Injected repository adapter for entry gates
   * @param telemetryRepository Injected repository adapter for environmental/occupancy telemetry
   */
  constructor(gateRepository: IGateRepository, telemetryRepository: ITelemetryRepository) {
    this.gateRepository = gateRepository;
    this.telemetryRepository = telemetryRepository;
  }

  /**
   * Retrieves all entry gates configuration and statuses.
   *
   * @returns List of Gate domain entities.
   */
  public async getGates(): Promise<Gate[]> {
    logger.info('Fetching gates list from repository');
    return this.gateRepository.findAll();
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
    const gate = await this.gateRepository.findById(gateId);
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

    const saved = await this.gateRepository.save(updatedGate);
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
    const gate = await this.gateRepository.findById(gateId);
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

    await this.gateRepository.save(updatedGate);
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
    return this.telemetryRepository.getLatest();
  }

  /**
   * Retrieves historical telemetry logs to chart operations trends.
   *
   * @param limit Optional history count parameter
   * @returns List of Telemetry logs.
   */
  public async getTelemetryHistory(limit: number = DEFAULT_HISTORY_LIMIT): Promise<Telemetry[]> {
    logger.info(`Fetching historical telemetry logs (limit: ${limit})`);
    return this.telemetryRepository.getHistory(limit);
  }

  /**
   * Recalculates total stadium occupancy, queue wait times, CO2 volumes, power load, and green rating indexes.
   *
   * @returns The newly updated Telemetry aggregates log.
   */
  public async recalculateTelemetryMetrics(): Promise<Telemetry> {
    logger.info('Recalculating stadium aggregate telemetry indexes...');
    const gates = await this.gateRepository.findAll();
    const stats = this.calculateGateStats(gates);
    const utilities = this.calculateUtilityLoads(stats.totalAttendance);

    const newTelemetry = new Telemetry(
      STADIUM_ID,
      stats.totalAttendance,
      stats.activeCount,
      stats.congestedCount,
      stats.averageQueueTime,
      utilities.co2Level,
      BASELINE_TEMPERATURE,
      utilities.sustainabilityScore,
      utilities.powerConsumption,
      utilities.waterUsage,
      utilities.carbonFootprint,
      new Date()
    );

    const saved = await this.telemetryRepository.save(newTelemetry);
    logger.info('Stadium aggregate metrics updated and persisted.', { totalAttendance: stats.totalAttendance, averageQueueTime: stats.averageQueueTime });
    return saved;
  }

  /**
   * Evaluates dynamic status code state parameters for a single gate.
   * @param flowRate Current entry flow speed
   * @param occupancy Total inside spectator counter
   * @param limit Maximum entry capacity limit
   */
  private determineGateStatus(flowRate: number, occupancy: number, limit: number): GateStatus {
    if (occupancy >= limit) {
      return 'Congested';
    }
    if (flowRate === 0) {
      return 'Closed';
    }
    return 'Open';
  }

  /**
   * Calculates overall attendance metrics from individual gate logs.
   * @param gates List of entry gates
   */
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

  /**
   * Performs dynamic carbon, utility, power, and green index rating scoring formulas.
   * @param totalAttendance Total spectator headcount inside the stadium
   */
  private calculateUtilityLoads(totalAttendance: number): {
    co2Level: number;
    powerConsumption: number;
    waterUsage: number;
    carbonFootprint: number;
    sustainabilityScore: number;
  } {
    const attendanceFactor = totalAttendance / ATTENDANCE_DIVIDER;
    const co2Level = Math.round(CO2_BASE + CO2_SCALE * attendanceFactor);
    const powerConsumption = Math.round(POWER_BASE + POWER_SCALE * attendanceFactor);
    const waterUsage = Math.round(WATER_BASE + WATER_SCALE * attendanceFactor);
    const carbonFootprint = Number((powerConsumption * CARBON_FACTOR).toFixed(2));
    
    let sustainabilityScore = SUSTAINABILITY_CEILING - Math.round(SUSTAINABILITY_DECAY * attendanceFactor);
    if (sustainabilityScore < SUSTAINABILITY_FLOOR) {
      sustainabilityScore = SUSTAINABILITY_FLOOR;
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

let stadiumServiceInstanceCache: StadiumService | null = null;

/**
 * Returns the active StadiumService instance.
 * Instantiates the service lazily once the database repositories are initialized.
 */
export function getStadiumService(): StadiumService {
  if (!stadiumServiceInstanceCache) {
    const repos = dbFactoryInstance.getRepositories();
    stadiumServiceInstanceCache = new StadiumService(repos.gateRepository, repos.telemetryRepository);
  }
  return stadiumServiceInstanceCache;
}
