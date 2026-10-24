import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB, disconnectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start Express server
connectDB()
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(`  YNK Pickles Backend running on port ${PORT}`);
      console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`===============================================`);
    });

    const gracefulClose = () => {
      console.log('[Server] Shutting down HTTP server gracefully...');
      server.close(async () => {
        console.log('[Server] HTTP server closed.');
        await disconnectDB();
        process.exit(0);
      });
    };

    process.on('SIGTERM', gracefulClose);
    process.on('SIGINT', gracefulClose);
  })
  .catch((err) => {
    const safeMsg = err.message
      ? err.message.replace(/:([^@\s]+)@/, ':****@')
      : 'Database connection error';
    console.error('Failed to start server due to database connection error:', safeMsg);
    process.exit(1);
  });
