'use strict';

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: '30d' },
  );
};

/**
 * Generates an opaque refresh token (64-char hex string).
 * Returns both the raw token (to send to client) and its SHA-256 hash (to store in DB).
 */
const generateRefreshToken = () => {
  const raw  = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHmac('sha256', process.env.REFRESH_TOKEN_SECRET).update(raw).digest('hex');
  return { raw, hash };
};

module.exports = { generateToken, generateRefreshToken };
