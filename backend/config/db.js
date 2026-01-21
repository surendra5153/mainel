// config/db.js
const mongoose = require('mongoose');

/**
 * connectDB - connects to MongoDB using the provided URI or process.env.MONGO_URI.
 * Throws a descriptive error if no URI is available.
 *
 * Usage:
 *   const connectDB = require('./config/db');
 *   connectDB(process.env.MONGO_URI);
 */
const connectDB = async (uri) => {
  const mongoUri = uri || process.env.MONGO_URI;

  // If you want an explicit local fallback during development, set ALLOW_LOCAL_MONGO=true in .env
  const allowLocal = process.env.ALLOW_LOCAL_MONGO === 'true';
  const localFallback = 'mongodb://localhost:27017/skill-swap';

  const finalUri = mongoUri || (allowLocal ? localFallback : null);

  if (!finalUri) {
    // Fail fast with a helpful message
    const err = new Error(
      'MongoDB URI is not set. Set MONGO_URI in your .env, or set ALLOW_LOCAL_MONGO=true for a local fallback.\n' +
      'Example .env:\n' +
      '  MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/skill-swap\n' +
      '  OR\n' +
      '  ALLOW_LOCAL_MONGO=true (to use mongodb://localhost:27017/skill-swap)'
    );
    // Log and throw so nodemon stops and you can fix env
    console.error(err.message);
    throw err;
  }

  try {
    const conn = await mongoose.connect(finalUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error.message || error);
    throw error;
  }
};

module.exports = connectDB;
