// utils/tokenService.js
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const RefreshToken = require('../models/RefreshToken');

/**
 * Create a signed JWT access token (short-lived)
 */
function createAccessToken(payload) {
  const secret = process.env.JWT_SECRET;
  const ttl = process.env.ACCESS_TOKEN_EXPIRES_IN || '15m';
  if (!secret) throw new Error('JWT_SECRET missing');
  return jwt.sign(payload, secret, { expiresIn: ttl });
}

/**
 * Verify an access token; throws if invalid
 */
function verifyAccessToken(token) {
  const secret = process.env.JWT_SECRET;
  return jwt.verify(token, secret);
}

/**
 * Create and persist a refresh token (long-lived)
 * returns the string token
 */
async function createRefreshToken(userId) {
  const ttl = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';
  // convert ttl to ms for expiresAt
  const now = Date.now();
  let ms;
  if (ttl.endsWith('d')) {
    ms = parseInt(ttl.slice(0, -1), 10) * 24 * 60 * 60 * 1000;
  } else if (ttl.endsWith('h')) {
    ms = parseInt(ttl.slice(0, -1), 10) * 60 * 60 * 1000;
  } else if (ttl.endsWith('m')) {
    ms = parseInt(ttl.slice(0, -1), 10) * 60 * 1000;
  } else {
    // default 7 days
    ms = 7 * 24 * 60 * 60 * 1000;
  }
  const token = uuidv4() + '.' + uuidv4(); // random id string
  const expiresAt = new Date(now + ms);

  const doc = await RefreshToken.create({ token, user: userId, expiresAt });
  return doc.token;
}

/**
 * Rotate refresh token: revoke old, create new
 */
async function rotateRefreshToken(oldToken) {
  if (!oldToken) throw new Error('oldToken required');
  const existing = await RefreshToken.findOne({ token: oldToken });
  if (!existing || existing.revoked || existing.isExpired()) {
    // invalid token
    return null;
  }
  // revoke existing
  existing.revoked = true;
  await existing.save();

  // create new
  return await createRefreshToken(existing.user);
}

/**
 * Revoke refresh token (logout)
 */
async function revokeRefreshToken(token) {
  if (!token) return;
  await RefreshToken.updateOne({ token }, { $set: { revoked: true } });
}

module.exports = { createAccessToken, verifyAccessToken, createRefreshToken, rotateRefreshToken, revokeRefreshToken };
