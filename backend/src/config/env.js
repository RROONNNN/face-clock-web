'use strict';

require('dotenv').config();

const REQUIRED_VARS = ['MONGODB_URI', 'JWT_SECRET', 'REFRESH_TOKEN_SECRET'];

const missing = REQUIRED_VARS.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(`❌ Missing required environment variables: ${missing.join(', ')}`);
  process.exit(1);
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 5000,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET:            process.env.JWT_SECRET,
  REFRESH_TOKEN_SECRET:  process.env.REFRESH_TOKEN_SECRET,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
};
