// models/SkillRecommendationCache.js
const mongoose = require('mongoose');

/**
 * Schema for caching ML skill recommendations.
 * Stores pre-computed recommendation scores to avoid repeated calculations.
 * 
 * @schema SkillRecommendationCache
 */
const SkillRecommendationCacheSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  skillId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Skill',
    required: true,
    index: true
  },
  score: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  reason: {
    type: String,
    default: ''
  },
  updatedAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound unique index to ensure one cache entry per user-skill pair
SkillRecommendationCacheSchema.index({ userId: 1, skillId: 1 }, { unique: true });

// Index for efficient TTL queries (finding stale entries)
SkillRecommendationCacheSchema.index({ updatedAt: 1 });

/**
 * Check if this cache entry is stale (older than threshold).
 * @param {number} maxAgeMs - Maximum age in milliseconds (default 24h)
 * @returns {boolean}
 */
SkillRecommendationCacheSchema.methods.isStale = function(maxAgeMs = 24 * 60 * 60 * 1000) {
  return Date.now() - this.updatedAt.getTime() > maxAgeMs;
};

/**
 * Static method to bulk upsert recommendations for a user.
 * @param {string} userId - User ObjectId
 * @param {Array<{skillId, score, reason}>} recommendations - Array of recommendation objects
 * @returns {Promise<void>}
 */
SkillRecommendationCacheSchema.statics.bulkUpsert = async function(userId, recommendations) {
  const bulkOps = recommendations.map(rec => ({
    updateOne: {
      filter: { userId, skillId: rec.skillId },
      update: {
        $set: {
          score: rec.score,
          reason: rec.reason,
          updatedAt: new Date()
        }
      },
      upsert: true
    }
  }));

  if (bulkOps.length > 0) {
    await this.bulkWrite(bulkOps);
  }
};

/**
 * Static method to get cached recommendations for a user.
 * Only returns non-stale entries.
 * @param {string} userId - User ObjectId
 * @param {number} maxAgeMs - Maximum cache age (default 24h)
 * @param {number} limit - Maximum results to return
 * @returns {Promise<Array>}
 */
SkillRecommendationCacheSchema.statics.getFreshRecommendations = async function(
  userId,
  maxAgeMs = 24 * 60 * 60 * 1000,
  limit = 50
) {
  const cutoffDate = new Date(Date.now() - maxAgeMs);
  
  return this.find({
    userId,
    updatedAt: { $gte: cutoffDate }
  })
    .sort({ score: -1 })
    .limit(limit)
    .lean()
    .exec();
};

/**
 * Static method to clear stale cache entries (for background cleanup).
 * @param {number} maxAgeMs - Age threshold for deletion
 * @returns {Promise<number>} Number of deleted entries
 */
SkillRecommendationCacheSchema.statics.clearStale = async function(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  const cutoffDate = new Date(Date.now() - maxAgeMs);
  const result = await this.deleteMany({ updatedAt: { $lt: cutoffDate } });
  return result.deletedCount;
};

module.exports = mongoose.model('SkillRecommendationCache', SkillRecommendationCacheSchema);
