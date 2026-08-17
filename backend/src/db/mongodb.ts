import mongoose from 'mongoose';
import { config } from '../config/env.js';

// Disable query buffering when disconnected so requests fail fast with helpful error messages
mongoose.set('bufferCommands', false);

/**
 * Connects to MongoDB Atlas using Mongoose.
 */
export async function connectDB(): Promise<typeof mongoose | null> {
  if (!config.mongoUri) {
    console.warn('⚠️ MONGODB_URI is not set in environment variables. Database operations will be disabled until MONGODB_URI is configured.');
    return null;
  }

  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Atlas connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('❌ MongoDB Atlas connection error:', error);
    return null;
  }
}

/**
 * Helper to check whether database connection is active.
 */
export function isDBConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

/**
 * Tests active MongoDB Atlas connectivity by pinging the database admin API.
 */
export async function checkDBHealth(): Promise<{
  connected: boolean;
  message: string;
  details?: Record<string, any>;
}> {
  if (!config.mongoUri) {
    return {
      connected: false,
      message: 'MONGODB_URI environment variable is missing.',
    };
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
    }

    if (!mongoose.connection.db) {
      throw new Error('Database connection instance is undefined');
    }

    const pingResult = await mongoose.connection.db.admin().ping();

    return {
      connected: true,
      message: 'MongoDB Atlas is connected and healthy',
      details: {
        host: mongoose.connection.host,
        dbName: mongoose.connection.name,
        readyState: mongoose.connection.readyState,
        ping: pingResult,
      },
    };
  } catch (error: any) {
    return {
      connected: false,
      message: `MongoDB Atlas connection check failed: ${error.message || error}`,
    };
  }
}
