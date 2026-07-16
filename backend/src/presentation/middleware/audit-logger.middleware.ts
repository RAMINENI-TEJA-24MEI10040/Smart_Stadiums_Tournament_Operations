import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';
import { logger } from '../../shared/logger';

/** HTTP methods that mutate state and trigger audit logs. */
const MUTATION_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

/** Anonymous fallback context value. */
const ANONYMOUS_USER = 'anonymous';
const UNAUTHENTICATED_ROLE = 'unauthenticated';

/**
 * Audit logging middleware for tracking all database mutations.
 * Emits a structured log message using the logger utility.
 */
export function auditLogger(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const isMutation = MUTATION_METHODS.includes(method);
    
    if (isMutation) {
      const username = req.user?.username ?? ANONYMOUS_USER;
      const role = req.user?.role ?? UNAUTHENTICATED_ROLE;
      const url = req.originalUrl;
      const status = res.statusCode;

      logger.info('Audit log entry generated', {
        type: 'AUDIT',
        user: username,
        role,
        action: `${method} ${url}`,
        responseStatus: status,
        latencyMs: duration
      });
    }
  });

  next();
}
