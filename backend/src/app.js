'use strict';

const env = require('./config/env');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
// const connectDB = require('./config/db');
const apiRouter = require('./routes/index');

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
app.get('/health', (req, res) => {
  res.json({ success: true, status: 'ok', message: 'Gieo La BE is running!' });
});

// ── API routes ────────────────────────────────
app.use('/api/v1', apiRouter);

// ── 404 handler ───────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

// ── Global error handler ──────────────────────
app.use((err, req, res, next) => {
  const status = err.status || 500;
  return res.status(status).json({ success: false, message: err.message || 'Internal server error' });
});
// ── Export app for server.js to wrap with http.Server ─────────────────────
const http = require('http');
const server = http.createServer(app);

module.exports = { app, server };
