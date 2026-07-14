import { User } from '../../domain/entities/user.entity';

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByUsername(username: string): Promise<User | null>;
  save(user: User): Promise<User>;
  findAll(): Promise<User[]>;
  delete(id: string): Promise<boolean>;
}
