import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables before any other imports
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import app from './app';
import { dbFactoryInstance } from './infrastructure/database/db-factory';
import { logger } from './shared/logger';

const PORT = process.env.PORT ?? 5000;

async function bootstrap(): Promise<void> {
  try {
    logger.info('Initializing database engines...');
    await dbFactoryInstance.initialize();

    const server = app.listen(PORT, () => {
      logger.info(`Stadium Ops API server started on port ${PORT}`, {
        port: PORT,
        dbProvider: process.env.DB_PROVIDER ?? 'json'
      });
    });

    const shutdown = async (): Promise<void> => {
      logger.info('Shutdown signal received — closing server gracefully...');
      server.close(() => {
        logger.info('HTTP server closed successfully.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (err) {
    logger.error('Fatal bootstrapping error — server aborted.', err instanceof Error ? err : new Error(String(err)));
    process.exit(1);
  }
}

process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION — server stopping.', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('UNHANDLED PROMISE REJECTION detected.', reason instanceof Error ? reason : new Error(String(reason)));
});

bootstrap();
