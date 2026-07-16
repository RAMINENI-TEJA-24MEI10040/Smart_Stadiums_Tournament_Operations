import { dbFactoryInstance } from '../../infrastructure/database/db-factory';
import { Volunteer } from '../../domain/entities/volunteer.entity';
import { IVolunteerService } from '../interfaces/services.interface';
import { IVolunteerRepository } from '../interfaces/volunteer-repository.interface';
import { NotFoundException } from '../../shared/exceptions';
import { logger } from '../../shared/logger';

/** Default section status values. */
const DEFAULT_SECTION = 'Unassigned';

/** Default volunteer status values. */
const VOLUNTEER_OFFLINE = 'Offline';
const VOLUNTEER_AVAILABLE = 'Available';
const VOLUNTEER_ACTIVE = 'Active';

/**
 * Service managing volunteer profiles, shift check-ins, check-outs, and task allocations.
 * Decoupled from concrete adapters via constructor-based dependency injection.
 */
export class VolunteerService implements IVolunteerService {
  private readonly volunteerRepository: IVolunteerRepository;

  /**
   * Creates an instance of VolunteerService.
   * @param volunteerRepository Injected repository adapter for volunteer profiles
   */
  constructor(volunteerRepository: IVolunteerRepository) {
    this.volunteerRepository = volunteerRepository;
  }

  /**
   * Registers a new volunteer roster profile in the system.
   *
   * @param name Volunteer full name.
   * @param userId Associated login identifier (optional).
   * @returns The registered Volunteer domain entity.
   */
  public async registerVolunteer(name: string, userId: string | null = null): Promise<Volunteer> {
    logger.info(`Registering volunteer profile: "${name}"`);
    const id = `vol-${Date.now()}`;
    const newVol = new Volunteer(
      id,
      userId,
      name,
      DEFAULT_SECTION,
      [],
      VOLUNTEER_OFFLINE,
      null,
      null,
      null
    );

    const saved = await this.volunteerRepository.save(newVol);
    logger.info(`Volunteer profile created successfully with ID: ${id}`);
    return saved;
  }

  /**
   * Commences a volunteer's shift, mapping skills and assigning a location sector.
   *
   * @param volunteerId Targeted volunteer ID.
   * @param assignedSection Destination zone or gate corridor.
   * @param skills List of specific capabilities (e.g. First Aid, Translation).
   * @returns The updated Volunteer profile.
   * @throws NotFoundException if the volunteer does not exist.
   */
  public async checkIn(
    volunteerId: string,
    assignedSection: string,
    skills: string[]
  ): Promise<Volunteer> {
    logger.info(`Shift check-in requested for Volunteer ID: ${volunteerId} at ${assignedSection}`);
    const volunteer = await this.volunteerRepository.findById(volunteerId);
    if (!volunteer) {
      logger.warn(`Shift check-in rejected: Volunteer ID ${volunteerId} not found`);
      throw new NotFoundException('Volunteer not found');
    }

    const updated = new Volunteer(
      volunteer.id,
      volunteer.userId,
      volunteer.name,
      assignedSection,
      skills,
      VOLUNTEER_AVAILABLE,
      null,
      new Date(),
      null
    );

    const saved = await this.volunteerRepository.save(updated);
    logger.info(`Shift check-in completed successfully for Volunteer ID: ${volunteerId}`);
    return saved;
  }

  /**
   * Concludes a volunteer's shift.
   *
   * @param volunteerId Targeted volunteer ID.
   * @returns The updated offline Volunteer state card.
   * @throws NotFoundException if the volunteer does not exist.
   */
  public async checkOut(volunteerId: string): Promise<Volunteer> {
    logger.info(`Shift check-out requested for Volunteer ID: ${volunteerId}`);
    const volunteer = await this.volunteerRepository.findById(volunteerId);
    if (!volunteer) {
      logger.warn(`Shift check-out rejected: Volunteer ID ${volunteerId} not found`);
      throw new NotFoundException('Volunteer not found');
    }

    const updated = new Volunteer(
      volunteer.id,
      volunteer.userId,
      volunteer.name,
      volunteer.assignedSection,
      volunteer.skills,
      VOLUNTEER_OFFLINE,
      null,
      volunteer.checkInTime,
      new Date()
    );

    const saved = await this.volunteerRepository.save(updated);
    logger.info(`Shift check-out completed successfully for Volunteer ID: ${volunteerId}`);
    return saved;
  }

  /**
   * Reallocates a volunteer to a new stadium section and assigns an active task.
   *
   * @param volunteerId Targeted volunteer ID.
   * @param section Destination stadium sector.
   * @param task Assigned duty description.
   * @returns The updated active Volunteer state card.
   * @throws NotFoundException if the volunteer does not exist.
   */
  public async reallocateVolunteer(
    volunteerId: string,
    section: string,
    task: string
  ): Promise<Volunteer> {
    logger.info(`Reallocating Volunteer ID: ${volunteerId} to section: ${section} for task: "${task}"`);
    const volunteer = await this.volunteerRepository.findById(volunteerId);
    if (!volunteer) {
      logger.warn(`Volunteer reallocation rejected: Volunteer ID ${volunteerId} not found`);
      throw new NotFoundException('Volunteer not found');
    }

    const updated = new Volunteer(
      volunteer.id,
      volunteer.userId,
      volunteer.name,
      section,
      volunteer.skills,
      VOLUNTEER_ACTIVE,
      task,
      volunteer.checkInTime,
      volunteer.checkOutTime
    );

    const saved = await this.volunteerRepository.save(updated);
    logger.info(`Volunteer ID: ${volunteerId} reallocated successfully`);
    return saved;
  }

  /**
   * Retrieves all registered volunteers.
   *
   * @returns List of Volunteer domain entities.
   */
  public async getVolunteers(): Promise<Volunteer[]> {
    logger.info('Fetching volunteers list from repository');
    return this.volunteerRepository.findAll();
  }
}

let volunteerServiceInstanceCache: VolunteerService | null = null;

/**
 * Returns the active VolunteerService instance.
 * Instantiates the service lazily once the database repositories are initialized.
 */
export function getVolunteerService(): VolunteerService {
  if (!volunteerServiceInstanceCache) {
    const repos = dbFactoryInstance.getRepositories();
    volunteerServiceInstanceCache = new VolunteerService(repos.volunteerRepository);
  }
  return volunteerServiceInstanceCache;
}
