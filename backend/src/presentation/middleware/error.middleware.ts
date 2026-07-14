import { Request, Response, NextFunction } from 'express';
import { TelemetryProvider } from '../../infrastructure/telemetry/telemetry';
import { logger } from '../../shared/logger';

/** Shape of errors that carry an explicit HTTP status code. */
interface HttpError {
  status?: number;
  statusCode?: number;
  message?: string;
  stack?: string;
}

/**
 * Global Express error-handling middleware.
 * Maps typed CustomExceptions and generic errors to structured JSON responses.
 * In production, hides stack traces to prevent information disclosure.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  TelemetryProvider.logError();

  const isProduction = process.env.NODE_ENV === 'production';
  const httpError = err as HttpError;
  const status = httpError.status ?? httpError.statusCode ?? 500;
  const message = httpError.message ?? 'Internal Server Error';

  logger.error(`HTTP ${status} — ${message}`, err instanceof Error ? err : undefined);

  res.status(status).json({
    status: 'Error',
    statusCode: status,
    message: status === 500 && isProduction
      ? 'Internal system error. Please contact the administrator.'
      : message,
    ...(isProduction ? {} : { stack: httpError.stack })
  });
}
