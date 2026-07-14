import { IUserRepository } from '../../../application/interfaces/user-repository.interface';
import { User, UserRole } from '../../../domain/entities/user.entity';
import { jsonDbInstance, JsonDatabase } from '../../database/json-db';

export class JsonUserRepository implements IUserRepository {
  constructor(private db: JsonDatabase = jsonDbInstance) {}

  public async findById(id: string): Promise<User | null> {
    const data = await this.db.read();
    const user = data.users.find(u => u.id === id);
    if (!user) return null;
    return new User(
      user.id,
      user.username,
      user.passwordHash,
      user.role as UserRole,
      user.name,
      user.email,
      new Date(user.createdAt)
    );
  }

  public async findByUsername(username: string): Promise<User | null> {
    const data = await this.db.read();
    const user = data.users.find(u => u.username === username);
    if (!user) return null;
    return new User(
      user.id,
      user.username,
      user.passwordHash,
      user.role as UserRole,
      user.name,
      user.email,
      new Date(user.createdAt)
    );
  }

  public async save(user: User): Promise<User> {
    const data = await this.db.read();
    const index = data.users.findIndex(u => u.id === user.id);
    const jsonUser = {
      id: user.id,
      username: user.username,
      passwordHash: user.passwordHash,
      role: user.role,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString()
    };

    if (index >= 0) {
      data.users[index] = jsonUser;
    } else {
      data.users.push(jsonUser);
    }
    await this.db.write(data);
    return user;
  }

  public async findAll(): Promise<User[]> {
    const data = await this.db.read();
    return data.users.map(
      user => new User(
        user.id,
        user.username,
        user.passwordHash,
        user.role as UserRole,
        user.name,
        user.email,
        new Date(user.createdAt)
      )
    );
  }

  public async delete(id: string): Promise<boolean> {
    const data = await this.db.read();
    const originalLength = data.users.length;
    data.users = data.users.filter(u => u.id !== id);
    if (data.users.length === originalLength) return false;
    await this.db.write(data);
    return true;
  }
}
