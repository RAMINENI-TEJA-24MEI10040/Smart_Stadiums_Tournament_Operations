import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import app from './app';
import { dbFactoryInstance } from './infrastructure/database/db-factory';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    console.log('Initializing database engines...');
    await dbFactoryInstance.initialize();

    const server = app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`STADIUM OPS SERVER IS ALIVE ON PORT: ${PORT}`);
      console.log(`DB PROVIDER CONFIG: ${process.env.DB_PROVIDER || 'local JSON fallback'}`);
      console.log(`====================================================`);
    });

    // Graceful Shutdown hooks
    const shutdown = async () => {
      console.log('Shutdown signal received. Shutting down server gracefully...');
      server.close(() => {
        console.log('HTTP Server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (err) {
    console.error('Fatal bootstrapping error, server aborted:', err);
    process.exit(1);
  }
}

// Uncaught system crash protections
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION CRITICAL] Server stopping:', err.message, err.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION CRITICAL] Promise rejection at:', promise, 'reason:', reason);
});

bootstrap();
