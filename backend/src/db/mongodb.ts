import mongoose from 'mongoose';
import { config } from '../config/env.js';

/**
 * Connects to MongoDB Atlas using Mongoose.
 */
export async function connectDB(): Promise<typeof mongoose | null> {
  if (!config.mongoUri) {
    console.warn('⚠️ MONGODB_URI is not set in environment variables.');
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
    // If not connected yet, attempt connection
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(config.mongoUri, {
        serverSelectionTimeoutMS: 5000,
      });
    }

    if (!mongoose.connection.db) {
      throw new Error('Database connection instance is undefined');
    }

    // Actually test connectivity by sending a ping command to MongoDB Atlas
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
