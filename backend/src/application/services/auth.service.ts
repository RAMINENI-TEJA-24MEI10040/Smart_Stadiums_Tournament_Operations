import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { dbFactoryInstance } from '../../infrastructure/database/db-factory';
import { User, UserRole } from '../../domain/entities/user.entity';

export class AuthService {
  private jwtSecret: string;
  private tokenExpiry: string = '24h';

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'stadium-secret-key-999';
  }

  public async register(payload: {
    username: string;
    passwordPlain: string;
    role: UserRole;
    name: string;
    email: string;
  }): Promise<User> {
    const repos = dbFactoryInstance.getRepositories();
    const existing = await repos.userRepository.findByUsername(payload.username);
    if (existing) {
      throw new Error('Registration failed: Username already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(payload.passwordPlain, salt);
    
    // Auto-generate a simple ID
    const userId = `usr-${Date.now()}`;
    const user = new User(
      userId,
      payload.username,
      hash,
      payload.role,
      payload.name,
      payload.email,
      new Date()
    );

    return repos.userRepository.save(user);
  }

  public async login(username: string, passwordPlain: string): Promise<{ token: string; user: any }> {
    const repos = dbFactoryInstance.getRepositories();
    const user = await repos.userRepository.findByUsername(username);
    if (!user) {
      throw new Error('Authentication failed: Invalid credentials');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      throw new Error('Authentication failed: Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      this.jwtSecret,
      { expiresIn: this.tokenExpiry as any }
    );

    return {
      token,
      user: user.toJSON()
    };
  }

  public async getUserProfile(id: string): Promise<any> {
    const repos = dbFactoryInstance.getRepositories();
    const user = await repos.userRepository.findById(id);
    if (!user) {
      throw new Error('Profile not found');
    }
    return user.toJSON();
  }
}

export const authServiceInstance = new AuthService();
