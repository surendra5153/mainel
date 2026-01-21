// ml/mentorRecommender.js

const User = require('../models/User');
const Skill = require('../models/skill');
const { Session } = require('../models/Session');
const MentorRecommendationCache = require('../models/MentorRecommendationCache');
const { buildMentorFeatures } = require('./featureBuilders/mentorFeatures');
const { createSimpleCache } = require('../utils/simpleCache');
const { createLogger } = require('../utils/logger');

const logger = createLogger('ML:MentorRecommender');

// Process-level cache
const processCache = createSimpleCache({
  sweepIntervalMs: 5 * 60 * 1000,
  maxSize: 500
});

/**
 * Hardcoded model weights for mentor recommendation.
 * Features order:
 *   0: Mentor rating average
 *   1: Session completion rate
 *   2: Skill match quality
 *   3: Skill overlap with student
 *   4: Experience level
 *   5: Recent activity
 *   6: Success streak
 *   7: Availability
 * 
 * TODO: Train these weights using historical data
 */
const MODEL_WEIGHTS = [
  0.25,  // Rating average
  0.20,  // Completion rate
  0.20,  // Skill match
  0.10,  // Skill overlap
  0.08,  // Experience
  0.07,  // Recent activity
  0.05,  // Success streak
  0.05   // Availability
];

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Recommend mentors for a user and specific skills.
 * 
 * @param {Object} params
 * @param {string} params.userId - User ObjectId
 * @param {Array<string>} params.skillIds - Array of skill ObjectIds
 * @param {number} params.limit - Maximum recommendations (default 10, max 50)
 * @param {boolean} params.skipCache - Force recomputation
 * @returns {Promise<Object>} Recommendation result
 */
async function recommendMentors({ userId, skillIds = [], limit = 10, skipCache = false }) {
  const requestLimit = Math.min(Math.max(1, limit), 50);

  try {
    const mlEnabled = process.env.ML_MENTOR_RECOMMENDATION_ENABLED !== 'false';

    if (!mlEnabled) {
      logger.info('ML mentor recommendations disabled, using fallback');
      return await fallbackMentorRecommendations(userId, skillIds, requestLimit);
    }

    // Validate inputs
    if (!skillIds || skillIds.length === 0) {
      logger.warn('No skillIds provided');
      return { userId, skillIds: [], items: [] };
    }

    // Check process cache
    const processCacheKey = `mentor:${userId}:${skillIds.join(',')}:${requestLimit}`;
    if (!skipCache) {
      const cached = processCache.get(processCacheKey);
      if (cached) {
        logger.debug('Process cache hit for mentor recommendations');
        return cached;
      }
    }

    // Fetch user
    const user = await User.findById(userId).lean().exec();
    if (!user) {
      logger.warn('User not found:', userId);
      return await fallbackMentorRecommendations(userId, skillIds, requestLimit);
    }

    // Check DB cache for each skill
    const allRecommendations = [];
    const skillsNeedingComputation = [];

    for (const skillId of skillIds) {
      if (!skipCache) {
        const cachedRecs = await MentorRecommendationCache.getFreshRecommendations(
          userId,
          skillId,
          CACHE_TTL_MS,
          requestLimit
        );

        if (cachedRecs && cachedRecs.length > 0) {
          logger.debug('DB cache hit for skill', skillId);
          allRecommendations.push(...cachedRecs.map(rec => ({
            mentorId: rec.mentorId,
            skillId: rec.skillId,
            score: rec.score,
            reason: rec.reason,
            fallback: false
          })));
        } else {
          skillsNeedingComputation.push(skillId);
        }
      } else {
        skillsNeedingComputation.push(skillId);
      }
    }

    // Compute fresh recommendations for cache misses
    if (skillsNeedingComputation.length > 0) {
      logger.info('Computing fresh mentor recommendations for', skillsNeedingComputation.length, 'skills');

      for (const skillId of skillsNeedingComputation) {
        const freshRecs = await computeMentorRecommendations(user, skillId, requestLimit * 2);
        allRecommendations.push(...freshRecs);

        // Cache results (async)
        if (freshRecs.length > 0) {
          MentorRecommendationCache.bulkUpsert(userId, skillId, freshRecs)
            .catch(err => logger.error('Failed to cache mentor recommendations:', err.message));
        }
      }
    }

    // Deduplicate and rank by score
    const mentorScores = new Map();
    for (const rec of allRecommendations) {
      const key = rec.mentorId.toString();
      if (!mentorScores.has(key) || mentorScores.get(key).score < rec.score) {
        mentorScores.set(key, rec);
      }
    }

    const rankedItems = Array.from(mentorScores.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, requestLimit);

    const result = {
      userId,
      skillIds,
      items: rankedItems
    };

    // Store in process cache
    processCache.set(processCacheKey, result, 5 * 60 * 1000);

    return result;

  } catch (error) {
    logger.error('Error in recommendMentors:', error.message);
    return await fallbackMentorRecommendations(userId, skillIds, requestLimit);
  }
}

/**
 * Compute mentor recommendations for a user-skill pair.
 * @private
 * @param {Object} user
 * @param {string} skillId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function computeMentorRecommendations(user, skillId, limit) {
  try {
    // Fetch skill
    const skill = await Skill.findById(skillId).lean().exec();
    if (!skill) {
      logger.warn('Skill not found:', skillId);
      return [];
    }

    // Find candidate mentors who teach this skill
    const candidateMentors = await User.find({
      isMentor: true,
      'teaches.name': { $regex: new RegExp(skill.name, 'i') }
    }).lean().exec();

    if (candidateMentors.length === 0) {
      logger.info('No mentors found for skill:', skill.name);
      return [];
    }

    // TODO: Load session history for more accurate features
    const history = {};

    // Score each mentor
    const scoredMentors = [];

    for (const mentor of candidateMentors) {
      try {
        // Skip if mentor is the same as user
        if (mentor._id.toString() === user._id.toString()) continue;

        const { features, explanation } = buildMentorFeatures({
          user,
          mentor,
          skill,
          history
        });

        const score = computeLinearScore(features);

        scoredMentors.push({
          mentorId: mentor._id,
          skillId,
          score: Math.max(0, Math.min(1, score)),
          reason: explanation
        });
      } catch (err) {
        logger.warn('Failed to score mentor', mentor._id, ':', err.message);
      }
    }

    // Sort and return top-k
    scoredMentors.sort((a, b) => b.score - a.score);
    return scoredMentors.slice(0, limit);

  } catch (error) {
    logger.error('Error computing mentor recommendations:', error.message);
    return [];
  }
}

/**
 * Compute linear model score.
 * @private
 * @param {Array<number>} features
 * @returns {number}
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
 * Fallback mentor recommendation strategy.
 * @private
 * @param {string} userId
 * @param {Array<string>} skillIds
 * @param {number} limit
 * @returns {Promise<Object>}
 */
async function fallbackMentorRecommendations(userId, skillIds, limit) {
  try {
    if (!skillIds || skillIds.length === 0) {
      // No skills specified, return top-rated mentors
      const topMentors = await User.find({ isMentor: true })
        .sort({ 'ratings.average': -1, 'ratings.count': -1 })
        .limit(limit)
        .lean()
        .exec();

      return {
        userId,
        skillIds: [],
        items: topMentors.map(mentor => ({
          mentorId: mentor._id,
          skillId: null,
          score: normalizeFallbackRating(mentor.ratings?.average || 0),
          reason: 'Highly rated mentor',
          fallback: true
        }))
      };
    }

    // Fetch skills
    const skills = await Skill.find({ _id: { $in: skillIds } }).lean().exec();
    const skillNames = skills.map(s => s.name);

    // Find mentors who teach these skills
    const mentors = await User.find({
      isMentor: true,
      'teaches.name': { $in: skillNames.map(n => new RegExp(n, 'i')) }
    })
      .sort({ 'ratings.average': -1, lastSeen: -1 })
      .limit(limit * 2)
      .lean()
      .exec();

    const items = [];
    for (const mentor of mentors) {
      for (const skill of skills) {
        const teaches = mentor.teaches.find(t =>
          t.name.toLowerCase().includes(skill.name.toLowerCase())
        );

        if (teaches) {
          items.push({
            mentorId: mentor._id,
            skillId: skill._id,
            score: normalizeFallbackRating(mentor.ratings?.average || 0),
            reason: 'Mentor teaches this skill',
            fallback: true
          });
        }
      }
    }

    // Deduplicate and limit
    const uniqueMentors = new Map();
    for (const item of items) {
      const key = item.mentorId.toString();
      if (!uniqueMentors.has(key)) {
        uniqueMentors.set(key, item);
      }
    }

    return {
      userId,
      skillIds,
      items: Array.from(uniqueMentors.values()).slice(0, limit)
    };

  } catch (error) {
    logger.error('Fallback mentor recommendations failed:', error.message);
    return { userId, skillIds, items: [] };
  }
}

/**
 * Normalize rating for fallback mode.
 * @private
 * @param {number} rating
 * @returns {number}
 */
function normalizeFallbackRating(rating) {
  return Math.max(0, Math.min(1, (rating - 1) / 4));
}

/**
 * Clear all caches.
 * @returns {Promise<Object>}
 */
async function clearAllCaches() {
  processCache.clear();
  const dbCleared = await MentorRecommendationCache.deleteMany({});

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
  recommendMentors,
  clearAllCaches,
  getStats
};
