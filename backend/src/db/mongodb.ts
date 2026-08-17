import { MongoClient, Db } from 'mongodb';
import { Bindings, getEnvVar } from '../config/env.js';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

/**
 * Service layer for managing MongoDB Atlas database connections.
 * Compatible with Cloudflare Workers (requires `nodejs_compat` flag in wrangler config).
 */
export async function getDatabase(env: Bindings): Promise<Db> {
  const uri = getEnvVar(env, 'MONGODB_URI');

  if (!uri) {
    throw new Error('MONGODB_URI is not configured in environment variables.');
  }

  if (cachedDb && cachedClient) {
    return cachedDb;
  }

  try {
    const client = new MongoClient(uri);
    await client.connect();
    cachedClient = client;
    cachedDb = client.db('ai_job_portal');
    return cachedDb;
  } catch (error) {
    console.error('Failed to connect to MongoDB Atlas:', error);
    throw new Error('Database connection failed. Please check your MONGODB_URI configuration.');
  }
}

/**
 * Closes the active MongoDB connection if initialized.
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
  }
}
