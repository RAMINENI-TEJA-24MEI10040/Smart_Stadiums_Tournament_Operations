import { Volunteer } from '../../domain/entities/volunteer.entity';

export interface IVolunteerRepository {
  findById(id: string): Promise<Volunteer | null>;
  findByUserId(userId: string): Promise<Volunteer | null>;
  findAll(): Promise<Volunteer[]>;
  save(volunteer: Volunteer): Promise<Volunteer>;
  delete(id: string): Promise<boolean>;
}
