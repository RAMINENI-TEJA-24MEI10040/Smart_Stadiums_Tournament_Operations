import { IUserRepository } from '../../application/interfaces/user-repository.interface';
import { IMatchRepository } from '../../application/interfaces/match-repository.interface';
import { IGateRepository } from '../../application/interfaces/gate-repository.interface';
import { IIncidentRepository } from '../../application/interfaces/incident-repository.interface';
import { IVolunteerRepository } from '../../application/interfaces/volunteer-repository.interface';
import { ITelemetryRepository } from '../../application/interfaces/telemetry-repository.interface';
import { logger } from '../../shared/logger';

// JSON adapter imports
import { JsonUserRepository } from '../repositories/json/user.repository';
import { JsonMatchRepository } from '../repositories/json/match.repository';
import { JsonGateRepository } from '../repositories/json/gate.repository';
import { JsonIncidentRepository } from '../repositories/json/incident.repository';
import { JsonVolunteerRepository } from '../repositories/json/volunteer.repository';
import { JsonTelemetryRepository } from '../repositories/json/telemetry.repository';

// SQLite adapter imports
import { SqliteUserRepository } from '../repositories/sqlite/user.repository';
import { SqliteMatchRepository } from '../repositories/sqlite/match.repository';
import { SqliteGateRepository } from '../repositories/sqlite/gate.repository';
import { SqliteIncidentRepository } from '../repositories/sqlite/incident.repository';
import { SqliteVolunteerRepository } from '../repositories/sqlite/volunteer.repository';
import { SqliteTelemetryRepository } from '../repositories/sqlite/telemetry.repository';
import { sqliteDbInstance } from './sqlite-db';

// PostgreSQL adapter imports
import { PostgresUserRepository } from '../repositories/postgres/user.repository';
import { PostgresMatchRepository } from '../repositories/postgres/match.repository';
import { PostgresGateRepository } from '../repositories/postgres/gate.repository';
import { PostgresIncidentRepository } from '../repositories/postgres/incident.repository';
import { PostgresVolunteerRepository } from '../repositories/postgres/volunteer.repository';
import { PostgresTelemetryRepository } from '../repositories/postgres/telemetry.repository';
import { postgresDbInstance } from './postgres-db';

export interface RepositoryContainer {
  userRepository: IUserRepository;
  matchRepository: IMatchRepository;
  gateRepository: IGateRepository;
  incidentRepository: IIncidentRepository;
  volunteerRepository: IVolunteerRepository;
  telemetryRepository: ITelemetryRepository;
}

/** Supported database provider identifiers. */
type DbProvider = 'postgres' | 'postgresql' | 'sqlite' | 'sqlite3' | 'json';

class DatabaseFactory {
  private container: RepositoryContainer | null = null;

  /**
   * Initializes the database connection and builds the repository container
   * matching the `DB_PROVIDER` environment variable.
   * Falls back to SQLite if PostgreSQL connection fails.
   */
  public async initialize(): Promise<RepositoryContainer> {
    const provider = (process.env.DB_PROVIDER ?? 'json').toLowerCase() as DbProvider;

    if (provider === 'postgres' || provider === 'postgresql') {
      await this.initializePostgres();
    } else if (provider === 'sqlite' || provider === 'sqlite3') {
      await this.initializeSqlite();
    } else {
      this.initializeJson();
    }

    return this.container!;
  }

  private async initializePostgres(): Promise<void> {
    try {
      await postgresDbInstance.initialize();
      this.container = {
        userRepository: new PostgresUserRepository(),
        matchRepository: new PostgresMatchRepository(),
        gateRepository: new PostgresGateRepository(),
        incidentRepository: new PostgresIncidentRepository(),
        volunteerRepository: new PostgresVolunteerRepository(),
        telemetryRepository: new PostgresTelemetryRepository()
      };
      logger.info('Database initialized successfully using provider: POSTGRESQL');
    } catch (err) {
      logger.warn('PostgreSQL connection failed — falling back to SQLite.', { error: err instanceof Error ? err.message : String(err) });
      await this.initializeSqlite();
    }
  }

  private async initializeSqlite(): Promise<void> {
    await sqliteDbInstance.initialize();
    this.container = {
      userRepository: new SqliteUserRepository(),
      matchRepository: new SqliteMatchRepository(),
      gateRepository: new SqliteGateRepository(),
      incidentRepository: new SqliteIncidentRepository(),
      volunteerRepository: new SqliteVolunteerRepository(),
      telemetryRepository: new SqliteTelemetryRepository()
    };
    logger.info('Database initialized successfully using provider: SQLITE');
  }

  private initializeJson(): void {
    this.container = {
      userRepository: new JsonUserRepository(),
      matchRepository: new JsonMatchRepository(),
      gateRepository: new JsonGateRepository(),
      incidentRepository: new JsonIncidentRepository(),
      volunteerRepository: new JsonVolunteerRepository(),
      telemetryRepository: new JsonTelemetryRepository()
    };
    logger.info('Database initialized successfully using provider: LOCAL JSON FILE');
  }

  /**
   * Returns the active repository container.
   * @throws Error if initialize() has not been called yet.
   */
  public getRepositories(): RepositoryContainer {
    if (!this.container) {
      throw new Error('DatabaseFactory has not been initialized. Call initialize() first.');
    }
    return this.container;
  }
}

export const dbFactoryInstance = new DatabaseFactory();
