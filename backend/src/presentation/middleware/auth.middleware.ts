import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { UserRole } from '../../domain/entities/user.entity';
import { logger } from '../../shared/logger';

/** Structure of the verified authentication token payload. */
export interface TokenPayload {
  id: string;
  username: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
}

/** Type guard to verify that a decoded token payload contains the required fields. */
function isTokenPayload(payload: unknown): payload is TokenPayload {
  if (typeof payload !== 'object' || payload === null) {
    return false;
  }
  const p = payload as Record<string, unknown>;
  return (
    typeof p.id === 'string' &&
    typeof p.username === 'string' &&
    typeof p.role === 'string'
  );
}

/**
 * Middleware validating JSON Web Tokens (JWT) inside the HTTP Authorization header.
 * Attaches the verified user profile payload context to the request.
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ status: 'Error', message: 'Access Denied: Missing Authorization Header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error('Authentication configuration error: JWT_SECRET environment variable is missing.');
      res.status(500).json({ status: 'Error', message: 'Internal Server Error' });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret);
    if (!isTokenPayload(decoded)) {
      res.status(403).json({ status: 'Error', message: 'Access Denied: Invalid Token Payload' });
      return;
    }

    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ status: 'Error', message: 'Access Denied: Invalid or Expired Token' });
  }
}

/**
 * Role-Based Access Control (RBAC) middleware.
 * Verifies that the authenticated user possesses one of the allowed operational roles.
 * @param allowedRoles List of roles authorized to run this route
 */
export function authorize(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ status: 'Error', message: 'Access Denied: Unauthenticated Request' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ status: 'Error', message: 'Access Denied: Unauthorized User Role' });
      return;
    }

    next();
  };
}
