// ml/skillRecommender.js

const User = require('../models/User');
const Skill = require('../models/skill');
const SkillRecommendationCache = require('../models/SkillRecommendationCache');
const { buildSkillFeatures } = require('./featureBuilders/skillFeatures');
const { createSimpleCache } = require('../utils/simpleCache');
const { createLogger } = require('../utils/logger');

const logger = createLogger('ML:SkillRecommender');

// In-memory cache for process-level caching (avoid repeated DB queries)
const processCache = createSimpleCache({
  sweepIntervalMs: 5 * 60 * 1000, // 5 minutes
  maxSize: 500
});

/**
 * Hardcoded linear model weights for skill recommendation.
 * These weights are applied to the feature vector produced by buildSkillFeatures.
 * Features order:
 *   0: Tag similarity (Jaccard)
 *   1: Category match
 *   2: Skill popularity (normalized)
 *   3: Learning gap indicator
 *   4: Recency score
 *   5: Complementary skill indicator
 *   6: Skill level gap
 * 
 * TODO: Train these weights offline using historical session/rating data
 * TODO: Implement A/B testing framework for weight optimization
 */
const MODEL_WEIGHTS = [
  0.25,  // Tag similarity
  0.15,  // Category match
  0.10,  // Popularity
  0.25,  // Learning gap
  0.10,  // Recency
  0.10,  // Complementarity
  0.05   // Skill level gap
];

/**
 * Cache TTL configuration (24 hours)
 */
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Recommend skills for a user.
 * 
 * @param {Object} params - Recommendation parameters
 * @param {string} params.userId - User ObjectId or string
 * @param {number} params.limit - Maximum number of recommendations (default: 10, max: 50)
 * @param {boolean} params.skipCache - Force recomputation, skip cache (default: false)
 * @returns {Promise<Object>} Recommendation result
 * @returns {string} result.userId - User ID
 * @returns {Array<Object>} result.items - Recommended skills
 * @returns {string} result.items[].skillId - Skill ObjectId
 * @returns {number} result.items[].score - Recommendation score [0, 1]
 * @returns {string} result.items[].reason - Human-readable explanation
 * @returns {boolean} result.items[].fallback - True if using fallback mode
 */
async function recommendSkillsForUser({ userId, limit = 10, skipCache = false }) {
  const requestLimit = Math.min(Math.max(1, limit), 50);

  try {
    // Check if ML recommendations are enabled
    const mlEnabled = process.env.ML_SKILL_RECOMMENDATION_ENABLED !== 'false';

    if (!mlEnabled) {
      logger.info('ML recommendations disabled, using fallback');
      return await fallbackRecommendations(userId, requestLimit);
    }

    // Try process-level cache first (very fast)
    const processCacheKey = `rec:${userId}:${requestLimit}`;
    if (!skipCache) {
      const cached = processCache.get(processCacheKey);
      if (cached) {
        logger.debug('Process cache hit for user', userId);
        return cached;
      }
    }

    // Fetch user data
    const user = await User.findById(userId).lean().exec();
    if (!user) {
      logger.warn('User not found:', userId);
      return await fallbackRecommendations(userId, requestLimit);
    }

    // Check DB cache for existing recommendations
    if (!skipCache) {
      const cachedRecs = await SkillRecommendationCache.getFreshRecommendations(
        userId,
        CACHE_TTL_MS,
        requestLimit
      );

      if (cachedRecs && cachedRecs.length >= requestLimit) {
        logger.debug('DB cache hit for user', userId);
        const result = {
          userId,
          items: cachedRecs.slice(0, requestLimit).map(rec => ({
            skillId: rec.skillId,
            score: rec.score,
            reason: rec.reason,
            fallback: false
          }))
        };

        // Store in process cache
        processCache.set(processCacheKey, result, 5 * 60 * 1000); // 5 min
        return result;
      }
    }

    // Compute fresh recommendations
    logger.info('Computing fresh recommendations for user', userId);
    const recommendations = await computeRecommendations(user, requestLimit * 3); // Compute more, rank top-k

    // Store in DB cache (async, don't block response)
    SkillRecommendationCache.bulkUpsert(userId, recommendations)
      .catch(err => logger.error('Failed to cache recommendations:', err.message));

    const result = {
      userId,
      items: recommendations.slice(0, requestLimit).map(rec => ({
        skillId: rec.skillId,
        score: rec.score,
        reason: rec.reason,
        fallback: false
      }))
    };

    // Store in process cache
    processCache.set(processCacheKey, result, 5 * 60 * 1000);

    return result;

  } catch (error) {
    logger.error('Error in recommendSkillsForUser:', error.message);
    return await fallbackRecommendations(userId, requestLimit);
  }
}

/**
 * Compute recommendations using ML model.
 * @private
 * @param {Object} user - User document
 * @param {number} limit - Number of recommendations to compute
 * @returns {Promise<Array>}
 */
async function computeRecommendations(user, limit) {
  // Fetch candidate skills
  // TODO: Implement smarter candidate selection (collaborative filtering, embeddings)
  const candidateSkills = await Skill.find({})
    .limit(limit * 2) // Fetch more candidates than needed
    .lean()
    .exec();

  if (candidateSkills.length === 0) {
    logger.warn('No skills found in database');
    return [];
  }

  // Filter out skills user already teaches at expert level
  const userSkillNames = new Set(
    (user.teaches || []).map(s => s.name.toLowerCase())
  );

  const filteredCandidates = candidateSkills.filter(skill => {
    const skillNameLower = skill.name.toLowerCase();

    // Allow if user doesn't have it
    if (!userSkillNames.has(skillNameLower)) return true;

    // Allow if user has it but not at expert level
    const userSkill = (user.teaches || []).find(s => s.name.toLowerCase() === skillNameLower);
    return userSkill && userSkill.level !== 'expert';
  });

  // Compute scores for each candidate
  const scoredSkills = [];

  for (const skill of filteredCandidates) {
    try {
      const { features, explanation } = buildSkillFeatures({
        user,
        skill,
        history: {} // TODO: Pass actual history when available
      });

      const score = computeLinearScore(features);

      // Generate enhanced explanation based on dominant feature
      // Features: [Tag(0), Category(1), Popularity(2), LearningGap(3), Recency(4), Complementary(5), LevelGap(6)]
      // Weights: [0.25, 0.15, 0.10, 0.25, 0.10, 0.10, 0.05]
      let reason = explanation || 'Recommended for you';

      // Heuristic: Find highest weighted contribution
      const weightedFeatures = features.map((v, i) => v * MODEL_WEIGHTS[i]);
      const maxIndex = weightedFeatures.indexOf(Math.max(...weightedFeatures));

      if (maxIndex === 0) reason = `Matches your interests in ${skill.tags?.[0] || 'related topics'}`;
      else if (maxIndex === 1) reason = `Popular in your preferred category: ${skill.category}`;
      else if (maxIndex === 2) reason = 'Highly popular in the community';
      else if (maxIndex === 3) reason = 'Great next step for your learning path';
      else if (maxIndex === 5) reason = 'Complements your existing skills';

      scoredSkills.push({
        skillId: skill._id,
        score: Math.max(0, Math.min(1, score)), // Clamp to [0, 1]
        reason: reason
      });
    } catch (err) {
      logger.warn('Failed to score skill', skill._id, ':', err.message);
    }
  }

  // Sort by score descending
  scoredSkills.sort((a, b) => b.score - a.score);

  return scoredSkills.slice(0, limit);
}

/**
 * Compute linear model score: score = w · x
 * @private
 * @param {Array<number>} features - Feature vector
 * @returns {number} Score
 */
function computeLinearScore(features) {
  if (features.length !== MODEL_WEIGHTS.length) {
    logger.warn('Feature length mismatch:', features.length, 'vs', MODEL_WEIGHTS.length);
  }

  let score = 0;
  const len = Math.min(features.length, MODEL_WEIGHTS.length);

  for (let i = 0; i < len; i++) {
    score += features[i] * MODEL_WEIGHTS[i];
  }

  return score;
}

/**
 * Fallback recommendation strategy: return top skills by popularity.
 * Used when ML is disabled or errors occur.
 * @private
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<Object>}
 */
async function fallbackRecommendations(userId, limit) {
  try {
    const popularSkills = await Skill.find({})
      .sort({ popularity: -1 })
      .limit(limit)
      .lean()
      .exec();

    return {
      userId,
      items: popularSkills.map(skill => ({
        skillId: skill._id,
        score: normalizePopularityForFallback(skill.popularity || 0),
        reason: 'Popular skill in the community',
        fallback: true
      }))
    };
  } catch (error) {
    logger.error('Fallback recommendations failed:', error.message);
    return {
      userId,
      items: []
    };
  }
}

/**
 * Normalize popularity for fallback mode.
 * @private
 * @param {number} popularity
 * @returns {number}
 */
function normalizePopularityForFallback(popularity) {
  if (popularity <= 0) return 0.1;
  return Math.min(1, Math.log10(popularity + 1) / Math.log10(1001));
}

/**
 * Clear all recommendation caches.
 * Useful for testing or when model weights change.
 * @returns {Promise<Object>} Statistics about cleared items
 */
async function clearAllCaches() {
  processCache.clear();
  const dbCleared = await SkillRecommendationCache.deleteMany({});

  return {
    processCache: true,
    dbCacheCleared: dbCleared.deletedCount
  };
}

/**
 * Get recommendation statistics.
 * @returns {Object}
 */
function getStats() {
  return {
    processCache: processCache.getStats(),
    modelWeights: MODEL_WEIGHTS,
    cacheTtlMs: CACHE_TTL_MS
  };
}

module.exports = {
  recommendSkillsForUser,
  clearAllCaches,
  getStats
};
