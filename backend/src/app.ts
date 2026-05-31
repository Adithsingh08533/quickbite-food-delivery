/**
 * QuickBite – Express Application
 *
 * This file configures the Express app (middleware stack, routes, error handling).
 * It does NOT start the HTTP server — that's server.ts.
 * This separation makes the app easily importable in tests without starting a server.
 */

import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import config from './config/config';
import { swaggerSpec } from './config/swagger';
import apiRoutes from './routes';
import { apiRateLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import { notFound } from './middleware/notFound.middleware';
import logger from './utils/logger';

const app: Application = express();

// ─── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow Cloudinary images
}));

// ─── CORS Configuration ───────────────────────────────────────────────────────
// CORS_ORIGIN can be a comma-separated list: "http://localhost:5173,https://quickbite.vercel.app"
const rawCorsOrigins = config.server.corsOrigin
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    if (rawCorsOrigins.includes(origin)) return callback(null, true);
    // In development, allow any localhost port for convenience
    if (config.isDev && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      return callback(null, true);
    }
    logger.warn(`CORS blocked origin: ${origin}`);
    callback(new Error(`CORS: origin ${origin} is not allowed`));
  },
  credentials: true,         // Allow cookies (refresh token)
  methods:     ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── Request Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));           // Prevent large payload attacks
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());                            // Parse httpOnly refresh token cookie

// ─── HTTP Request Logging ─────────────────────────────────────────────────────
if (config.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) },
  }));
}

// ─── API Rate Limiting ────────────────────────────────────────────────────────
app.use('/api', apiRateLimiter);

// ─── Swagger UI (Development only) ───────────────────────────────────────────
if (config.isDev) {
  app.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customCss:      '.swagger-ui .topbar { display: none }',
      customSiteTitle:'QuickBite API Docs',
      swaggerOptions: { persistAuthorization: true },
    })
  );
  logger.info('Swagger UI available at /api/docs');
}

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    success:   true,
    status:    'healthy',
    timestamp: new Date().toISOString(),
    version:   '1.0.0',
  });
});

// ─── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/v1', apiRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use(notFound);

// ─── Global Error Handler (MUST be last) ─────────────────────────────────────
app.use(errorHandler);

export default app;
