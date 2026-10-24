import mongoose from 'mongoose';

/**
 * Mask sensitive credentials in MongoDB connection string for safe logging
 */
export const maskMongoUri = (uri) => {
  if (!uri || typeof uri !== 'string') return '';
  try {
    // Standard and SRV regex for user:password
    return uri.replace(
      /(mongodb(?:\+srv)?:\/\/)([^:@\s]+):([^@\s]+)@/i,
      '$1$2:****@'
    );
  } catch {
    return 'mongodb+srv://****:****@masked-cluster';
  }
};

let isEventListenersAttached = false;

/**
 * Configure Mongoose connection event listeners for resilience and monitoring
 */
const attachEventListeners = () => {
  if (isEventListenersAttached) return;

  mongoose.connection.on('connected', () => {
    const host = mongoose.connection.host || 'unknown-host';
    const dbName = mongoose.connection.name || 'ynk_pickles';
    console.log(`[MongoDB] Successfully connected to database: ${dbName} (Host: ${host})`);
  });

  mongoose.connection.on('error', (err) => {
    const safeMsg = err.message ? err.message.replace(/:([^@\s]+)@/, ':****@') : 'Database connection error';
    console.error(`[MongoDB] Connection error: ${safeMsg}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[MongoDB] Connection lost. Reconnection will be attempted automatically.');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[MongoDB] Connection re-established successfully.');
  });

  isEventListenersAttached = true;
};

/**
 * Connect to MongoDB / MongoDB Atlas with resilient options and error handling
 */
export const connectDB = async (customUri = null) => {
  // If already connected, return existing connection to avoid duplicate pools
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  const rawUri = customUri || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ynk_pickles';
  const targetDbName = process.env.DB_NAME || 'ynk_pickles';
  const maskedUri = maskMongoUri(rawUri);

  attachEventListeners();

  const connectionOptions = {
    dbName: targetDbName,
    autoIndex: true,
    serverSelectionTimeoutMS: 10000, // 10 seconds timeout for server selection (e.g. Atlas network check)
    socketTimeoutMS: 45000,
    maxPoolSize: 10, // Optimized for production and Atlas shared/dedicated tiers
    minPoolSize: 2,
    heartbeatFrequencyMS: 10000
  };

  try {
    console.log(`[MongoDB] Initializing connection to: ${maskedUri} [Target DB: ${targetDbName}]`);
    const conn = await mongoose.connect(rawUri, connectionOptions);
    return conn;
  } catch (error) {
    const safeErrorMsg = error.message
      ? error.message.replace(/:([^@\s]+)@/, ':****@')
      : 'Unknown MongoDB connection error';

    console.error(`[MongoDB] Failed to connect: ${safeErrorMsg}`);

    // If running in test suite, throw so test runner can handle
    if (process.env.NODE_ENV === 'test') {
      throw error;
    }

    // In production/dev server, rethrow or allow caller to handle gracefully
    throw error;
  }
};

/**
 * Disconnect cleanly from MongoDB (used for testing and graceful shutdown)
 */
export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close(false);
    console.log('[MongoDB] Connection closed cleanly.');
  }
};

/**
 * Check if MongoDB connection is active and healthy
 */
export const isDbConnected = () => {
  return mongoose.connection.readyState === 1;
};

/**
 * Graceful termination handling
 */
const handleTermination = async (signal) => {
  console.log(`[Server] Received ${signal}. Closing MongoDB connection...`);
  try {
    await disconnectDB();
  } finally {
    process.exit(0);
  }
};

if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'test') {
  process.on('SIGINT', () => handleTermination('SIGINT'));
  process.on('SIGTERM', () => handleTermination('SIGTERM'));
}
