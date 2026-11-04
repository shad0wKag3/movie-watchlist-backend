import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  JWT_SECRET: process.env.JWT_SECRET || 'gdgoc_default_jwt_secret_key_change_me',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};

