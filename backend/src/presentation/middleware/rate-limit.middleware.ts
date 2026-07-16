import { Request, Response, NextFunction } from 'express';

interface RateLimitInfo {
  timestamps: number[];
}

/** In-memory client request rate limiter cache map. */
const ipCache = new Map<string, RateLimitInfo>();

/** Time window duration of the rate limiter (e.g. 1 minute in milliseconds). */
const WINDOW_SIZE_MS = 60 * 1000;

/** Maximum allowed hits inside the time window. */
const MAX_REQUESTS = 150;

/** Default fallback IP when express request has no IP defined. */
const DEFAULT_FALLBACK_IP = 'unknown-ip';

/**
 * Global rate-limiting middleware.
 * Implements a sliding-window rate limit using memory caches.
 */
export function rateLimiter(req: Request, res: Response, next: NextFunction): void {
  const ip = req.ip ?? req.socket.remoteAddress ?? DEFAULT_FALLBACK_IP;
  const now = Date.now();

  let clientInfo = ipCache.get(ip);
  if (!clientInfo) {
    clientInfo = { timestamps: [] };
    ipCache.set(ip, clientInfo);
  }

  // Filter out request timestamps that fell outside the sliding window
  clientInfo.timestamps = clientInfo.timestamps.filter(t => now - t < WINDOW_SIZE_MS);

  if (clientInfo.timestamps.length >= MAX_REQUESTS) {
    res.status(429).json({
      status: 'Error',
      statusCode: 429,
      message: `Too many requests from this IP. Please try again after ${WINDOW_SIZE_MS / 1000} seconds.`
    });
    return;
  }

  clientInfo.timestamps.push(now);
  next();
}
