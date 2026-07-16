import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { dbFactoryInstance } from '../../infrastructure/database/db-factory';
import { User, UserRole, UserProfile, AuthResult } from '../../domain/entities/user.entity';
import { IAuthService } from '../interfaces/services.interface';
import { IUserRepository } from '../interfaces/user-repository.interface';
import { ConflictException, UnauthorizedException, NotFoundException } from '../../shared/exceptions';
import { logger } from '../../shared/logger';

/** Bcrypt password hashing salt rounds configuration. */
const BCRYPT_SALT_ROUNDS = 10;

/** Default authorization token lifetime. */
const DEFAULT_TOKEN_EXPIRY = '24h';

/**
 * Service managing user registration, authentication, and security token signatures.
 * Completely decoupled from databases using constructor-based dependency injection.
 */
export class AuthService implements IAuthService {
  private readonly jwtSecret: string;
  private readonly tokenExpiry: string;
  private readonly userRepository: IUserRepository;

  /**
   * Creates an instance of AuthService.
   * @param userRepository Injected repository adapter for user persistence
   */
  constructor(userRepository: IUserRepository) {
    this.userRepository = userRepository;
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error('Fatal initialization error: JWT_SECRET environment variable is missing.');
      throw new Error('JWT_SECRET environment variable is required.');
    }
    this.jwtSecret = secret;
    this.tokenExpiry = process.env.JWT_EXPIRY ?? DEFAULT_TOKEN_EXPIRY;
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
    const existing = await this.userRepository.findByUsername(payload.username);
    if (existing) {
      logger.warn(`Registration rejected: Username ${payload.username} already exists`);
      throw new ConflictException('Registration failed: Username already exists');
    }

    const salt = await bcrypt.genSalt(BCRYPT_SALT_ROUNDS);
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

    const saved = await this.userRepository.save(user);
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
    const user = await this.userRepository.findByUsername(username);
    if (!user) {
      logger.warn(`Authentication failed: User ${username} not found`);
      throw new UnauthorizedException('Authentication failed: Invalid credentials');
    }

    const isMatch = await bcrypt.compare(passwordPlain, user.passwordHash);
    if (!isMatch) {
      logger.warn(`Authentication failed: Incorrect password hash for user ${username}`);
      throw new UnauthorizedException('Authentication failed: Invalid credentials');
    }

    const options: jwt.SignOptions = { expiresIn: this.tokenExpiry as jwt.SignOptions['expiresIn'] };
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      this.jwtSecret,
      options
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
    const user = await this.userRepository.findById(id);
    if (!user) {
      logger.warn(`Profile query failed: User ID ${id} not found in database`);
      throw new NotFoundException('Profile not found');
    }
    return user.toJSON();
  }
}

let authServiceInstanceCache: AuthService | null = null;

/**
 * Returns the active AuthService instance.
 * Instantiates the service lazily once the database repositories are initialized.
 */
export function getAuthService(): AuthService {
  if (!authServiceInstanceCache) {
    const repos = dbFactoryInstance.getRepositories();
    authServiceInstanceCache = new AuthService(repos.userRepository);
  }
  return authServiceInstanceCache;
}
