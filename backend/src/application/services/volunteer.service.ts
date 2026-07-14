import { dbFactoryInstance } from '../../infrastructure/database/db-factory';
import { Volunteer } from '../../domain/entities/volunteer.entity';

/**
 * Service managing volunteer profiles, shift check-ins, check-outs, and task allocations.
 */
export class VolunteerService {
  /**
   * Registers a new volunteer roster profile in the system.
   *
   * @param name Volunteer full name.
   * @param userId Associated login identifier (optional).
   * @returns The registered Volunteer domain entity.
   */
  public async registerVolunteer(name: string, userId: string | null = null): Promise<Volunteer> {
    const repos = dbFactoryInstance.getRepositories();
    const id = `vol-${Date.now()}`;
    const newVol = new Volunteer(
      id,
      userId,
      name,
      'Unassigned',
      [],
      'Offline',
      null,
      null,
      null
    );

    return repos.volunteerRepository.save(newVol);
  }

  /**
   * Commences a volunteer's shift, mapping skills and assigning a location sector.
   *
   * @param volunteerId Targeted volunteer ID.
   * @param assignedSection Destination zone or gate corridor.
   * @param skills List of specific capabilities (e.g. First Aid, Translation).
   * @returns The updated Volunteer profile.
   * @throws Error if the volunteer does not exist.
   */
  public async checkIn(
    volunteerId: string,
    assignedSection: string,
    skills: string[]
  ): Promise<Volunteer> {
    const repos = dbFactoryInstance.getRepositories();
    const volunteer = await repos.volunteerRepository.findById(volunteerId);
    if (!volunteer) {
      throw new Error('Volunteer not found');
    }

    const updated = new Volunteer(
      volunteer.id,
      volunteer.userId,
      volunteer.name,
      assignedSection,
      skills,
      'Available',
      null,
      new Date(),
      null
    );

    return repos.volunteerRepository.save(updated);
  }

  /**
   * Concludes a volunteer's shift.
   *
   * @param volunteerId Targeted volunteer ID.
   * @returns The updated offline Volunteer state card.
   * @throws Error if the volunteer does not exist.
   */
  public async checkOut(volunteerId: string): Promise<Volunteer> {
    const repos = dbFactoryInstance.getRepositories();
    const volunteer = await repos.volunteerRepository.findById(volunteerId);
    if (!volunteer) {
      throw new Error('Volunteer not found');
    }

    const updated = new Volunteer(
      volunteer.id,
      volunteer.userId,
      volunteer.name,
      volunteer.assignedSection,
      volunteer.skills,
      'Offline',
      null,
      volunteer.checkInTime,
      new Date()
    );

    return repos.volunteerRepository.save(updated);
  }

  /**
   * Reallocates a volunteer to a new stadium section and assigns an active task.
   *
   * @param volunteerId Targeted volunteer ID.
   * @param section Destination stadium sector.
   * @param task Assigned duty description.
   * @returns The updated active Volunteer state card.
   * @throws Error if the volunteer does not exist.
   */
  public async reallocateVolunteer(
    volunteerId: string,
    section: string,
    task: string
  ): Promise<Volunteer> {
    const repos = dbFactoryInstance.getRepositories();
    const volunteer = await repos.volunteerRepository.findById(volunteerId);
    if (!volunteer) {
      throw new Error('Volunteer not found');
    }

    const updated = new Volunteer(
      volunteer.id,
      volunteer.userId,
      volunteer.name,
      section,
      volunteer.skills,
      'Active',
      task,
      volunteer.checkInTime,
      volunteer.checkOutTime
    );

    return repos.volunteerRepository.save(updated);
  }

  /**
   * Retrieves all registered volunteers.
   *
   * @returns List of Volunteer domain entities.
   */
  public async getVolunteers(): Promise<Volunteer[]> {
    const repos = dbFactoryInstance.getRepositories();
    return repos.volunteerRepository.findAll();
  }
}

export const volunteerServiceInstance = new VolunteerService();
