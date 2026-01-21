// routes/mlRoutes.js

/**
 * ML-powered endpoints for SkillSync.
 * Includes skill recommendations, analytics, and ML management.
 * 
 * INTEGRATION INSTRUCTIONS:
 * 
 * To enable these routes in your server.js, add the following:
 * 
 * ```javascript
 * // In server.js (after other route definitions):
 * const mlRoutes = require('./routes/mlRoutes');
 * app.use('/ml', mlRoutes);
 * ```
 * 
 * Example endpoints once mounted:
 *   - GET  /ml/recommendations/skills?limit=10
 *   - GET  /ml/recommendations/stats
 *   - POST /ml/recommendations/clear-cache
 */

const express = require('express');
const {
  getSkillRecommendations,
  getMentorRecommendations,
  getRecommendationStats,
  clearRecommendationCache
} = require('../controllers/recommendationController');

const router = express.Router();

// Optional: Import auth middleware if you want to protect certain routes
// const auth = require('../middleware/auth');

/**
 * Optional authentication middleware that doesn't fail if token is missing.
 * Populates req.user if authenticated, but allows request to proceed.
 * @param {Object} req
 * @param {Object} res
 * @param {Function} next
 */
function optionalAuth(req, res, next) {
  const jwt = require('jsonwebtoken');

  // Try to extract token
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  // Fallback to cookie
  if (!token && req.cookies && req.cookies.accessToken) {
    token = req.cookies.accessToken;
  }

  // If no token, proceed without authentication
  if (!token) {
    return next();
  }

  // Try to verify token
  try {
    const secret = process.env.JWT_SECRET;
    if (secret) {
      const decoded = jwt.verify(token, secret);
      req.user = { id: decoded.id };
    }
  } catch (err) {
    // Token invalid, but don't fail - just proceed unauthenticated
    console.log('Optional auth: token verification failed, proceeding without auth');
  }

  next();
}

/**
 * GET /ml/recommendations/skills
 * 
 * Get personalized skill recommendations for a user.
 * 
 * Query Parameters:
 *   - userId: User ID (optional if authenticated)
 *   - limit: Number of recommendations (default 10, max 50)
 *   - skipCache: Force recomputation (default false)
 * 
 * Response:
 *   {
 *     success: true,
 *     userId: "...",
 *     items: [
 *       { skillId: "...", score: 0.85, reason: "...", fallback: false }
 *     ],
 *     meta: { limit: 10, count: 10, mlEnabled: true, fallback: false }
 *   }
 * 
 * Access: Public with optional authentication
 */
router.get('/recommendations/skills', optionalAuth, getSkillRecommendations);

/**
 * GET /ml/recommendations/mentors
 * 
 * Get personalized mentor recommendations for a user and specific skills.
 * 
 * Query Parameters:
 *   - userId: User ID (optional if authenticated)
 *   - skillIds: Comma-separated skill IDs (required)
 *   - limit: Number of recommendations (default 10, max 50)
 *   - skipCache: Force recomputation (default false)
 * 
 * Response:
 *   {
 *     success: true,
 *     userId: "...",
 *     skillIds: ["...", "..."],
 *     items: [
 *       { mentorId: "...", skillId: "...", score: 0.85, reason: "...", fallback: false }
 *     ],
 *     meta: { limit: 10, count: 10, mlEnabled: true, fallback: false }
 *   }
 * 
 * Access: Public with optional authentication
 */
router.get('/recommendations/mentors', optionalAuth, getMentorRecommendations);



/**
 * GET /ml/recommendations/stats
 * 
 * Get recommendation system statistics and cache metrics.
 * Useful for monitoring and debugging.
 * 
 * Response:
 *   {
 *     success: true,
 *     stats: { processCache: {...}, modelWeights: [...], cacheTtlMs: 86400000 }
 *   }
 * 
 * Access: Admin only
 */
// router.get('/recommendations/stats', adminAuth, getRecommendationStats);

/**
 * POST /ml/recommendations/clear-cache
 * 
 * Clear all recommendation caches (process-level and database).
 * Triggers fresh computation for all subsequent requests.
 * 
 * Response:
 *   {
 *     success: true,
 *     message: "Caches cleared successfully",
 *     result: { processCache: true, dbCacheCleared: 1234 }
 *   }
 * 
 * Access: Admin only
 */
// router.post('/recommendations/clear-cache', adminAuth, clearRecommendationCache);

// TODO: Future ML endpoints to implement:
// - POST /ml/feedback - Collect user feedback on recommendations
// - GET /ml/similar-skills/:skillId - Find similar skills using embeddings
// - GET /ml/user-insights/:userId - User learning pattern analysis
// - POST /ml/retrain - Trigger model retraining with latest data

module.exports = router;
