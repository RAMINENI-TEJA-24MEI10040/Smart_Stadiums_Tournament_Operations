import { dbFactoryInstance } from '../../infrastructure/database/db-factory';
import { Volunteer } from '../../domain/entities/volunteer.entity';

export class VolunteerService {
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

  public async getVolunteers(): Promise<Volunteer[]> {
    const repos = dbFactoryInstance.getRepositories();
    return repos.volunteerRepository.findAll();
  }
}

export const volunteerServiceInstance = new VolunteerService();
