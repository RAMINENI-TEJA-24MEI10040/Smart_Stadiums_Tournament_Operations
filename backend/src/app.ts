import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimiter } from './presentation/middleware/rate-limit.middleware';
import { errorHandler } from './presentation/middleware/error.middleware';
import { auditLogger } from './presentation/middleware/audit-logger.middleware';
import { TelemetryProvider } from './infrastructure/telemetry/telemetry';

// Routes
import authRouter from './presentation/routes/auth.routes';
import matchRouter from './presentation/routes/match.routes';
import stadiumRouter from './presentation/routes/stadium.routes';
import incidentRouter from './presentation/routes/incident.routes';
import volunteerRouter from './presentation/routes/volunteer.routes';
import aiRouter from './presentation/routes/ai.routes';

const app = express();

// 1. Enterprise Security Headers (Helmet, CSP, HSTS)
app.use(helmet());
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https://*"],
    connectSrc: ["'self'", "https://*"],
    upgradeInsecureRequests: []
  }
}));
app.use(helmet.hsts({
  maxAge: 31536000, // 1 year
  includeSubDomains: true,
  preload: true
}));

// 2. Cross-Origin Resource Sharing (CORS) whitelist
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',') 
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Access Denied: CORS policy violation'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 3. IP Flood Rate Limiter
app.use(rateLimiter);

// 4. Request Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 5. Observability Telemetry Tracker (log REST api latency)
app.use((_req, _res, next) => {
  const start = Date.now();
  TelemetryProvider.incrementActiveConnections();

  _res.on('finish', () => {
    const duration = Date.now() - start;
    TelemetryProvider.logApiDuration(duration);
    TelemetryProvider.decrementActiveConnections();
  });

  next();
});

// 6. Custom Audit Logger (logs mutative operations)
app.use(auditLogger);

import path from 'path';

// 7. Endpoint routing prefixes
app.use('/api/auth', authRouter);
app.use('/api/matches', matchRouter);
app.use('/api/stadium', stadiumRouter);
app.use('/api/incidents', incidentRouter);
app.use('/api/volunteers', volunteerRouter);
app.use('/api/ai', aiRouter);

if (process.env.NODE_ENV === 'production') {
  const distPath = path.resolve(__dirname, '../../frontend/dist');
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  // Standard Health check index route
  app.get('/', (_req, res) => {
    res.status(200).json({
      status: 'Success',
      message: 'Stadium Operations Command Center API Online'
    });
  });
}

// 8. Global Error Handler Sanitizer
app.use(errorHandler);

export default app;
