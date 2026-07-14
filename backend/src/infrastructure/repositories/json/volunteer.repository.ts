import { IVolunteerRepository } from '../../../application/interfaces/volunteer-repository.interface';
import { Volunteer, VolunteerStatus } from '../../../domain/entities/volunteer.entity';
import { jsonDbInstance, JsonDatabase } from '../../database/json-db';

export class JsonVolunteerRepository implements IVolunteerRepository {
  constructor(private db: JsonDatabase = jsonDbInstance) {}

  public async findById(id: string): Promise<Volunteer | null> {
    const data = await this.db.read();
    const volunteer = data.volunteers.find(v => v.id === id);
    if (!volunteer) return null;
    return new Volunteer(
      volunteer.id,
      volunteer.userId,
      volunteer.name,
      volunteer.assignedSection,
      volunteer.skills || [],
      volunteer.status as VolunteerStatus,
      volunteer.currentTask,
      volunteer.checkInTime ? new Date(volunteer.checkInTime) : null,
      volunteer.checkOutTime ? new Date(volunteer.checkOutTime) : null
    );
  }

  public async findByUserId(userId: string): Promise<Volunteer | null> {
    const data = await this.db.read();
    const volunteer = data.volunteers.find(v => v.userId === userId);
    if (!volunteer) return null;
    return new Volunteer(
      volunteer.id,
      volunteer.userId,
      volunteer.name,
      volunteer.assignedSection,
      volunteer.skills || [],
      volunteer.status as VolunteerStatus,
      volunteer.currentTask,
      volunteer.checkInTime ? new Date(volunteer.checkInTime) : null,
      volunteer.checkOutTime ? new Date(volunteer.checkOutTime) : null
    );
  }

  public async findAll(): Promise<Volunteer[]> {
    const data = await this.db.read();
    return data.volunteers.map(
      volunteer => new Volunteer(
        volunteer.id,
        volunteer.userId,
        volunteer.name,
        volunteer.assignedSection,
        volunteer.skills || [],
        volunteer.status as VolunteerStatus,
        volunteer.currentTask,
        volunteer.checkInTime ? new Date(volunteer.checkInTime) : null,
        volunteer.checkOutTime ? new Date(volunteer.checkOutTime) : null
      )
    );
  }

  public async save(volunteer: Volunteer): Promise<Volunteer> {
    const data = await this.db.read();
    const index = data.volunteers.findIndex(v => v.id === volunteer.id);
    const jsonVolunteer = {
      id: volunteer.id,
      userId: volunteer.userId,
      name: volunteer.name,
      assignedSection: volunteer.assignedSection,
      skills: volunteer.skills,
      status: volunteer.status,
      currentTask: volunteer.currentTask,
      checkInTime: volunteer.checkInTime ? volunteer.checkInTime.toISOString() : null,
      checkOutTime: volunteer.checkOutTime ? volunteer.checkOutTime.toISOString() : null
    };

    if (index >= 0) {
      data.volunteers[index] = jsonVolunteer;
    } else {
      data.volunteers.push(jsonVolunteer);
    }
    await this.db.write(data);
    return volunteer;
  }

  public async delete(id: string): Promise<boolean> {
    const data = await this.db.read();
    const originalLength = data.volunteers.length;
    data.volunteers = data.volunteers.filter(v => v.id !== id);
    if (data.volunteers.length === originalLength) return false;
    await this.db.write(data);
    return true;
  }
}
