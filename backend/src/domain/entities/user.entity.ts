export type UserRole = 'OpsManager' | 'Director' | 'Security' | 'Volunteer';

export class User {
  constructor(
    public readonly id: string,
    public readonly username: string,
    public readonly passwordHash: string,
    public readonly role: UserRole,
    public readonly name: string,
    public readonly email: string,
    public readonly createdAt: Date
  ) {}

  public toJSON() {
    return {
      id: this.id,
      username: this.username,
      role: this.role,
      name: this.name,
      email: this.email,
      createdAt: this.createdAt.toISOString()
    };
  }
}
