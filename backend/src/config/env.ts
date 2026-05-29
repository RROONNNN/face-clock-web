import dotenv from 'dotenv';
dotenv.config();

const REQUIRED_VARS = ['MONGODB_URI', 'JWT_SECRET', 'REFRESH_TOKEN_SECRET'] as const;

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

export interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  REFRESH_TOKEN_SECRET: string;
  CLIENT_URL: string;
}

const env: EnvConfig = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  MONGODB_URI: process.env.MONGODB_URI!,
  JWT_SECRET: process.env.JWT_SECRET!,
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET!,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
};

export default env;
