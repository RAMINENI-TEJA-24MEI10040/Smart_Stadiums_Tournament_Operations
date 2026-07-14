import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { dbFactoryInstance } from '../../infrastructure/database/db-factory';
import { User, UserRole, UserProfile, AuthResult } from '../../domain/entities/user.entity';
import { IAuthService } from '../interfaces/services.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { ConflictException, UnauthorizedException, NotFoundException } from '../../shared/exceptions';
import { logger } from '../../shared/logger';

/**
 * Service managing user registration, authentication, and security token signatures.
 */
export class AuthService implements IAuthService {
  private jwtSecret: string;
  private tokenExpiry: string = '24h';
  private userRepository?: IUserRepository;

  constructor(userRepository?: IUserRepository) {
    this.userRepository = userRepository;
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error('Fatal initialization error: JWT_SECRET environment variable is missing.');
      throw new Error('JWT_SECRET environment variable is required.');
    }
    this.jwtSecret = secret;
  }

  private get userRepo(): IUserRepository {
    return this.userRepository || dbFactoryInstance.getRepositories().userRepository;
  }

  /**
   * Registers a new stadium user inside the database, hashing their password.
   *
   * @param payload Username, cleartext password, access role, name, and email.
   * @returns Resolves with the newly created User domain entity.
   */
  public async register(payload: {
    username: string;
    passwordPlain: string;
    role: UserRole;
    name: string;
    email: string;
  }): Promise<User> {
    logger.info(`Attempting to register user: ${payload.username}`);
    const existing = await this.userRepo.findByUsername(payload.username);
    if (existing) {
      logger.warn(`Registration rejected: Username ${payload.username} already exists`);
      throw new ConflictException('Registration failed: Username already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(payload.passwordPlain, salt);
    
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

    const saved = await this.userRepo.save(user);
    logger.info(`User registered successfully: ${payload.username} with ID: ${userId}`);
    return saved;
  }

  /**
   * Logs in a user by comparing their password hashes and signs a secure JWT token.
   *
   * @param username Targeted username credential.
   * @param passwordPlain Cleartext password.
   * @returns Signed JWT token and user details payload.
   */
  public async login(username: string, passwordPlain: string): Promise<AuthResult> {
    logger.info(`Authentication requested for username: ${username}`);
    const user = await this.userRepo.findByUsername(username);
    if (!user) {
      logger.warn(`Authentication failed: User ${username} not found`);
      throw new UnauthorizedException('Authentication failed: Invalid credentials');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      logger.warn(`Authentication failed: Incorrect password hash for user ${username}`);
      throw new UnauthorizedException('Authentication failed: Invalid credentials');
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      this.jwtSecret,
      { expiresIn: this.tokenExpiry as any }
    );

    logger.info(`Authentication successful for user: ${username}, token signed`);
    return {
      token,
      user: user.toJSON()
    };
  }

  /**
   * Retrieves a user's profile detail card based on their database identifier.
   *
   * @param id Target user identifier.
   * @returns User details JSON payload.
   */
  public async getUserProfile(id: string): Promise<UserProfile> {
    logger.info(`Profile details requested for User ID: ${id}`);
    const user = await this.userRepo.findById(id);
    if (!user) {
      logger.warn(`Profile query failed: User ID ${id} not found in database`);
      throw new NotFoundException('Profile not found');
    }
    return user.toJSON();
  }
}

export const authServiceInstance = new AuthService();
