import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import path from 'path';
import mongoose from 'mongoose';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import logisticsRoutes from './routes/logisticsRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS configuration supporting credentials (cookies)
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  })
);

// Body parsers & cookie parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Request logging (non-sensitive)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve uploaded images statically
const uploadDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadDir));

// API health check (Monitors server and MongoDB readyState)
app.get('/api/v1/health', (req, res) => {
  const isDbReady = mongoose.connection.readyState === 1;
  const dbStatus =
    mongoose.connection.readyState === 1
      ? 'connected'
      : mongoose.connection.readyState === 2
      ? 'connecting'
      : 'disconnected';

  res.status(isDbReady ? 200 : 503).json({
    status: isDbReady ? 'healthy' : 'degraded',
    database: {
      status: dbStatus,
      readyState: mongoose.connection.readyState,
      name: mongoose.connection.name || 'ynk_pickles'
    },
    timestamp: new Date().toISOString(),
    service: 'YNK Pickles API',
    uptime: process.uptime()
  });
});

// Middleware: Guard database-dependent API endpoints against broken connections
const requireDbReady = (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database connection is temporarily unavailable. Please retry shortly.'
    });
  }
  next();
};

// Mount versioned API routes with database readiness check
app.use('/api/v1/auth', requireDbReady, authRoutes);
app.use('/api/v1/products', requireDbReady, productRoutes);
app.use('/api/v1/cart', requireDbReady, cartRoutes);
app.use('/api/v1/settings', requireDbReady, settingsRoutes);
app.use('/api/v1/admin', requireDbReady, adminRoutes);
app.use('/api/v1/logistics', logisticsRoutes);

// Catch 404 for unhandled API routes
app.use('/api', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found.`
  });
});

// Centralized error handling middleware
app.use(errorHandler);

export default app;
