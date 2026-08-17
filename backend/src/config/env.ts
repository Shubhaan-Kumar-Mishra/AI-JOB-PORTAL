import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const config = {
  port: parseInt(process.env.PORT || '5001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  adzunaAppId: process.env.ADZUNA_APP_ID || '',
  adzunaAppKey: process.env.ADZUNA_APP_KEY || '',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  resendApiKey: process.env.RESEND_API_KEY || '',
};
