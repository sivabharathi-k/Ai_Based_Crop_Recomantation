const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
require('dotenv').config();

// ── Global error guards: prevent any unhandled async error from killing the process
process.on('uncaughtException', (err) => {
  console.error('\n[FATAL] Uncaught Exception — keeping server alive:', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason) => {
  console.error('\n[FATAL] Unhandled Promise Rejection — keeping server alive:',
    reason instanceof Error ? reason.message : reason);
});

const connectDB = require('./config/database');
const authRoutes       = require('./routes/auth');
const predictionRoutes = require('./routes/predictions');
const userRoutes       = require('./routes/users');
const marketRoutes     = require('./routes/market');
const nlpRoutes        = require('./routes/nlp');

const app = express();

// Connect to MongoDB
connectDB();

// ── CORS must come BEFORE helmet so preflight OPTIONS requests are handled ──
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security middleware (after CORS)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Crop Prediction API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Diagnostic: test Python availability
app.get('/api/health/python', (req, res) => {
  const { execSync } = require('child_process');
  const candidates = ['py', 'python3', 'python'];
  const results = {};
  for (const cmd of candidates) {
    try {
      results[cmd] = execSync(`${cmd} --version`, { timeout: 3000, stdio: 'pipe' }).toString().trim();
    } catch (e) {
      results[cmd] = `NOT FOUND: ${e.message.slice(0, 80)}`;
    }
  }
  res.status(200).json({ status: 'success', pythonVersions: results });
});

// API Routes
app.use('/api/auth',        authRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/market',      marketRoutes);
app.use('/api/nlp',         nlpRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong!' : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
});

// Handle port already in use
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use.`);
    console.error(`   Run this command to free it: npx kill-port ${PORT}`);
    process.exit(1);
  } else {
    throw err;
  }
});

module.exports = app;
