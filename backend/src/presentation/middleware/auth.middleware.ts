import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { UserRole } from '../../domain/entities/user.entity';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: UserRole;
  };
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ status: 'Error', message: 'Access Denied: Missing Authorization Header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const jwtSecret = process.env.JWT_SECRET || 'stadium-secret-key-999';
    const decoded = jwt.verify(token, jwtSecret) as { id: string; username: string; role: UserRole };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ status: 'Error', message: 'Access Denied: Invalid or Expired Token' });
  }
}

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
