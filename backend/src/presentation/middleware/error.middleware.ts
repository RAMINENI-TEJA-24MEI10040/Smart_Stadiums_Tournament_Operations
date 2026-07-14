import { Request, Response, NextFunction } from 'express';
import { TelemetryProvider } from '../../infrastructure/telemetry/telemetry';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Register error in Telemetry Provider
  TelemetryProvider.logError();

  const isProduction = process.env.NODE_ENV === 'production';
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error Handler] HTTP ${status} - ${message}`, err.stack);

  res.status(status).json({
    status: 'Error',
    statusCode: status,
    message: status === 500 && isProduction ? 'Internal System Error. Please contact administrator.' : message,
    ...(isProduction ? {} : { stack: err.stack })
  });
}
