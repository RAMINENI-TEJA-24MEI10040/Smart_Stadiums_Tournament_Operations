export type UserRole = 'OpsManager' | 'Director' | 'Security' | 'Volunteer';

/** Serialized representation of a User entity — safe to return in HTTP responses. */
export interface UserProfile {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email: string;
  createdAt: string;
}

/** Return value of a successful authentication operation. */
export interface AuthResult {
  token: string;
  user: UserProfile;
}

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

  public toJSON(): UserProfile {
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
