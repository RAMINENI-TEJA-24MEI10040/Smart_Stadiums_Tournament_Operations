import { IUserRepository } from '../../../application/interfaces/user-repository.interface';
import { User, UserRole } from '../../../domain/entities/user.entity';
import { sqliteDbInstance, SqliteDatabase } from '../../database/sqlite-db';

export class SqliteUserRepository implements IUserRepository {
  constructor(private db: SqliteDatabase = sqliteDbInstance) {}

  public async findById(id: string): Promise<User | null> {
    const row = await this.db.get('SELECT * FROM users WHERE id = ?', [id]);
    if (!row) return null;
    return this.mapToEntity(row);
  }

  public async findByUsername(username: string): Promise<User | null> {
    const row = await this.db.get('SELECT * FROM users WHERE username = ?', [username]);
    if (!row) return null;
    return this.mapToEntity(row);
  }

  public async save(user: User): Promise<User> {
    const existing = await this.findById(user.id);
    if (existing) {
      await this.db.run(
        `UPDATE users SET username = ?, password_hash = ?, role = ?, name = ?, email = ? WHERE id = ?`,
        [user.username, user.passwordHash, user.role, user.name, user.email, user.id]
      );
    } else {
      await this.db.run(
        `INSERT INTO users (id, username, password_hash, role, name, email, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.username, user.passwordHash, user.role, user.name, user.email, user.createdAt.toISOString()]
      );
    }
    return user;
  }

  public async findAll(): Promise<User[]> {
    const rows = await this.db.all('SELECT * FROM users');
    return rows.map(r => this.mapToEntity(r));
  }

  public async delete(id: string): Promise<boolean> {
    const res = await this.db.run('DELETE FROM users WHERE id = ?', [id]);
    return res.changes > 0;
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
      new Date(String(row['created_at']))
    );
  }
}
