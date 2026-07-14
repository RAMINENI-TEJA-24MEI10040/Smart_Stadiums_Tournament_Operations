import { Request, Response, NextFunction } from 'express';

interface RateLimitInfo {
  timestamps: number[];
}

const ipCache = new Map<string, RateLimitInfo>();
const WINDOW_SIZE_MS = 60000; // 1 minute
const MAX_REQUESTS = 150; // Max requests per window

export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();

  if (!ipCache.has(ip)) {
    ipCache.set(ip, { timestamps: [now] });
    next();
    return;
  }

  const clientInfo = ipCache.get(ip)!;
  // Filter out timestamps outside window
  clientInfo.timestamps = clientInfo.timestamps.filter(t => now - t < WINDOW_SIZE_MS);

  if (clientInfo.timestamps.length >= MAX_REQUESTS) {
    res.status(429).json({
      status: 'Error',
      statusCode: 429,
      message: 'Too many requests. Please try again after 1 minute.'
    });
    return;
  }

  clientInfo.timestamps.push(now);
  next();
}
