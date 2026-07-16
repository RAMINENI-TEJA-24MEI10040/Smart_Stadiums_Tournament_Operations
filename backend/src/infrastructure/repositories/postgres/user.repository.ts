import { IUserRepository } from '../../../application/interfaces/user-repository.interface';
import { User, UserRole } from '../../../domain/entities/user.entity';
import { postgresDbInstance, PostgresDatabase } from '../../database/postgres-db';

export class PostgresUserRepository implements IUserRepository {
  constructor(private db: PostgresDatabase = postgresDbInstance) {}

  public async findById(id: string): Promise<User | null> {
    const rows = await this.db.query('SELECT * FROM users WHERE id = $1', [id]);
    if (rows.length === 0) return null;
    return this.mapToEntity(rows[0]);
  }

  public async findByUsername(username: string): Promise<User | null> {
    const rows = await this.db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (rows.length === 0) return null;
    return this.mapToEntity(rows[0]);
  }

  public async save(user: User): Promise<User> {
    const existing = await this.findById(user.id);
    if (existing) {
      await this.db.query(
        `UPDATE users SET username = $1, password_hash = $2, role = $3, name = $4, email = $5 WHERE id = $6`,
        [user.username, user.passwordHash, user.role, user.name, user.email, user.id]
      );
    } else {
      await this.db.query(
        `INSERT INTO users (id, username, password_hash, role, name, email, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [user.id, user.username, user.passwordHash, user.role, user.name, user.email, user.createdAt]
      );
    }
    return user;
  }

  public async findAll(): Promise<User[]> {
    const rows = await this.db.query('SELECT * FROM users');
    return rows.map(r => this.mapToEntity(r));
  }

  public async delete(id: string): Promise<boolean> {
    const res = await this.db.getPool().query('DELETE FROM users WHERE id = $1', [id]);
    return (res.rowCount ?? 0) > 0;
  }

  private mapToEntity(rawRow: unknown) {
    const row = rawRow as Record<string, unknown>;
    return new User(
      String(row['id']),
      String(row['username']),
      String(row['password_hash']),
      String(row['role']) as UserRole,
      String(row['name']),
      String(row['email']),
      new Date(row['created_at'] as string)
    );
  }
}
