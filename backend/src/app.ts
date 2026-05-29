import env from './config/env';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import http from 'http';
import apiRouter from './routes/index';

const app = express();

// ── Security middleware ───────────────────────
app.use(helmet());
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options(/.*/, cors({
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Request logging ───────────────────────────
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Cookie parser ─────────────────────────────
app.use(cookieParser());

// ── Body parsers ──────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ── Rate limiter ──────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'development',
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ── Health check ──────────────────────────────
app.get('/health', (_req: Request, res: Response) => {
  res.json({ success: true, status: 'ok', message: 'Gieo La BE is running!' });
});

// ── API routes ────────────────────────────────
app.use('/api/v1', apiRouter);

// ── 404 handler ───────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────
app.use((err: Error & { status?: number }, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || 500;
  return res.status(status).json({ success: false, message: err.message || 'Internal server error' });
});

// ── Export app for server.ts to wrap with http.Server ─────────────────────
const server = http.createServer(app);

export { app, server };
