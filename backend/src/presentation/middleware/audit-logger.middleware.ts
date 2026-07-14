import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware';

export function auditLogger(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const method = req.method;
    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    
    if (isMutation) {
      const username = req.user ? req.user.username : 'anonymous';
      const role = req.user ? req.user.role : 'unauthenticated';
      const url = req.originalUrl;
      const status = res.statusCode;

      console.log(
        `[AUDIT LOG] [${new Date().toISOString()}] User: "${username}" (Role: ${role}) | Action: ${method} ${url} | Response Status: ${status} | Latency: ${duration}ms`
      );
    }
  });

  next();
}
