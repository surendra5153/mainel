// controllers/recommendationController.js

const { recommendSkillsForUser } = require('../ml/skillRecommender');
const { recommendMentors } = require('../ml/mentorRecommender');
const { createLogger } = require('../utils/logger');

const logger = createLogger('Controller:Recommendations');

/**
 * Get skill recommendations for a user.
 * 
 * Route: GET /ml/recommendations/skills
 * Query params:
 *   - userId: Optional user ID (if not authenticated)
 *   - limit: Number of recommendations (default 10, max 50)
 *   - skipCache: Force recomputation (default false)
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function getSkillRecommendations(req, res, next) {
  try {
    // Determine user ID: prefer authenticated user, fallback to query param
    let userId = null;

    if (req.user && req.user.id) {
      userId = req.user.id;
    } else if (req.query.userId) {
      userId = req.query.userId;
      logger.info('Using userId from query param (unauthenticated request)');
    } else {
      return res.status(400).json({
        success: false,
        message: 'User ID required: either authenticate or provide userId query parameter'
      });
    }

    // Parse and validate limit
    const rawLimit = parseInt(req.query.limit, 10);
    const limit = isNaN(rawLimit) ? 10 : Math.min(Math.max(1, rawLimit), 50);

    // Parse skipCache flag
    const skipCache = req.query.skipCache === 'true';

    logger.debug('Getting recommendations for user', userId, 'limit:', limit);

    // Call ML recommender
    const recommendations = await recommendSkillsForUser({
      userId,
      limit,
      skipCache
    });

    // Check if ML is disabled via environment variable
    const mlEnabled = process.env.ML_SKILL_RECOMMENDATION_ENABLED !== 'false';

    // HYDRATION & VALIDATION STEP
    const Skill = require('../models/skill');
    const recommendedIds = recommendations.items.map(r => r.skillId);

    // Fetch real skill details
    const validSkills = await Skill.find({ _id: { $in: recommendedIds } })
      .select('name category tags popularity')
      .lean();

    const skillMap = new Map(validSkills.map(s => [s._id.toString(), s]));

    // Merge scores with real data
    const hydratedItems = recommendations.items
      .map(rec => {
        const skill = skillMap.get(rec.skillId.toString());
        if (!skill) return null;

        return {
          skillId: skill._id,
          name: skill.name,
          category: skill.category,
          score: rec.score,
          reason: rec.reason,
          fallback: rec.fallback || false
        };
      })
      .filter(Boolean);

    // FALLBACK IF EMPTY
    if (hydratedItems.length === 0) {
      logger.warn('No valid skill recommendations found. Using fallback.');

      const popularSkills = await Skill.find({})
        .sort({ popularity: -1 })
        .limit(limit)
        .select('name category tags popularity')
        .lean();

      const fallbackItems = popularSkills.map(s => ({
        skillId: s._id,
        name: s.name,
        category: s.category,
        score: s.popularity ? Math.min(1, Math.log10(s.popularity + 1) / 4) : 0.5,
        reason: 'Popular in community',
        fallback: true
      }));

      hydratedItems.push(...fallbackItems);
    }

    // Return consistent response shape
    return res.status(200).json({
      success: true,
      userId: recommendations.userId,
      items: hydratedItems,
      meta: {
        limit,
        count: hydratedItems.length,
        mlEnabled,
        fallback: hydratedItems.some(i => i.fallback)
      }
    });

  } catch (error) {
    logger.error('Error in getSkillRecommendations:', error.message);

    // Return graceful error with empty recommendations
    return res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      items: []
    });
  }
}

/**
 * Get recommendation system statistics.
 * Admin-only endpoint for monitoring.
 * 
 * Route: GET /ml/recommendations/stats
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function getRecommendationStats(req, res, next) {
  try {
    const { getStats } = require('../ml/skillRecommender');
    const stats = getStats();

    return res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Error in getRecommendationStats:', error.message);
    next(error);
  }
}

/**
 * Clear recommendation caches.
 * Admin-only endpoint for cache management.
 * 
 * Route: POST /ml/recommendations/clear-cache
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function clearRecommendationCache(req, res, next) {
  try {
    const { clearAllCaches } = require('../ml/skillRecommender');
    const result = await clearAllCaches();

    logger.info('Recommendation caches cleared:', result);

    return res.status(200).json({
      success: true,
      message: 'Caches cleared successfully',
      result
    });
  } catch (error) {
    logger.error('Error in clearRecommendationCache:', error.message);
    next(error);
  }
}

/**
 * Get mentor recommendations for a user and specific skills.
 * 
 * Route: GET /ml/recommendations/mentors
 * Query params:
 *   - userId: Optional user ID (if not authenticated)
 *   - skillIds: Comma-separated skill IDs (required)
 *   - limit: Number of recommendations (default 10, max 50)
 *   - skipCache: Force recomputation (default false)
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function getMentorRecommendations(req, res, next) {
  try {
    const { getMentorRecommendationsAI } = require('../services/mlService');
    const User = require('../models/User'); // Ensure User model is available

    // Determine user ID
    let userId = null;
    if (req.user && req.user.id) {
      userId = req.user.id;
    } else if (req.query.userId) {
      userId = req.query.userId;
      logger.info('Using userId from query param (unauthenticated request)');
    } else {
      return res.status(400).json({
        success: false,
        message: 'User ID required: either authenticate or provide userId query parameter'
      });
    }

    // Parse and validate limit
    const rawLimit = parseInt(req.query.limit, 10);
    const limit = isNaN(rawLimit) ? 10 : Math.min(Math.max(1, rawLimit), 50);

    // Fetch Target User
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Fetch Candidates (All users who teach something, excluding self)
    // In production, optimize this query to only fetch relevant candidates if needed
    const candidates = await User.find({
      _id: { $ne: userId },
      'teaches.0': { $exists: true } // Users who teach at least one skill
    }).select('name teaches learns');

    logger.debug('Getting AI mentor recommendations for', userId, 'Candidates count:', candidates.length);

    // Call Python ML Service
    const mlResults = await getMentorRecommendationsAI(targetUser, candidates, limit);

    // HYDRATION & VALIDATION STEP
    // The ML service might return IDs, but we must ensure they strictly exist in our current DB
    // and fetch their latest profile data (avatar, rating, etc.)
    const recommendedIds = mlResults.map(r => r.mentorId || r.user_id);

    const validMentors = await User.find({ _id: { $in: recommendedIds } })
      .select('name avatarUrl rating reviewsCount teaches bio title occupation location')
      .lean();

    const mentorMap = new Map(validMentors.map(m => [m._id.toString(), m]));

    // Merge ML scores with real DB data
    const finalResults = mlResults
      .map(rec => {
        const uid = rec.mentorId || rec.user_id;
        const mentor = mentorMap.get(uid);
        if (!mentor) return null; // Skip if user not found in DB

        return {
          mentorId: mentor._id,
          name: mentor.name,
          avatarUrl: mentor.avatarUrl,
          title: mentor.title || 'Mentor',
          score: rec.score || 0,
          reason: rec.reason || 'Recommended Match',
          matchPercentage: Math.round((rec.score || 0) * 100)
        };
      })
      .filter(Boolean); // Remove nulls

    // FALLBACK IF VALIDATION REMOVES ALL RECOMMENDATIONS
    // This happens if the ML service indexes are out of sync with the current DB (e.g. after reseeding)
    if (finalResults.length === 0) {
      logger.warn('ML recommendations invalid or stale. Using DB fallback.');

      const fallbackMentors = await User.find({
        _id: { $ne: userId },
        'teaches.0': { $exists: true } // Must teach something
      })
        .sort({ rating: -1, reviewsCount: -1 })
        .limit(limit)
        .select('name avatarUrl rating reviewsCount teaches bio title occupation location')
        .lean();

      const fallbackItems = fallbackMentors.map(m => ({
        mentorId: m._id,
        name: m.name,
        avatarUrl: m.avatarUrl,
        title: m.title || 'Mentor',
        score: (m.rating || 3) / 5, // Normalize rating to 0-1
        reason: 'Highly Rated Mentor',
        matchPercentage: Math.round(((m.rating || 3) / 5) * 100),
        fallback: true
      }));

      finalResults.push(...fallbackItems);
    }

    // Return response
    return res.status(200).json({
      success: true,
      userId: userId,
      items: finalResults,
      meta: {
        limit,
        count: finalResults.length,
        mlEnabled: true,
        source: 'python-microservice-validated'
      }
    });

  } catch (error) {
    logger.error('Error in getMentorRecommendations:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Failed to generate mentor recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      items: []
    });
  }
}

module.exports = {
  getSkillRecommendations,
  getMentorRecommendations,
  getRecommendationStats,
  clearRecommendationCache
};
