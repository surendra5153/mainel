// models/MentorRecommendationCache.js
const mongoose = require('mongoose');

/**
 * Schema for caching ML mentor recommendations.
 * Stores pre-computed mentor scores per user-skill pair.
 * 
 * @schema MentorRecommendationCache
 */
const MentorRecommendationCacheSchema = new mongoose.Schema({
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
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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

// Compound unique index to ensure one cache entry per user-skill-mentor tuple
MentorRecommendationCacheSchema.index(
  { userId: 1, skillId: 1, mentorId: 1 },
  { unique: true }
);

// Index for efficient TTL queries
MentorRecommendationCacheSchema.index({ updatedAt: 1 });

// Index for queries by mentor (useful for analytics)
MentorRecommendationCacheSchema.index({ mentorId: 1, score: -1 });

/**
 * Check if this cache entry is stale.
 * @param {number} maxAgeMs - Maximum age in milliseconds (default 24h)
 * @returns {boolean}
 */
MentorRecommendationCacheSchema.methods.isStale = function(maxAgeMs = 24 * 60 * 60 * 1000) {
  return Date.now() - this.updatedAt.getTime() > maxAgeMs;
};

/**
 * Static method to bulk upsert mentor recommendations.
 * @param {string} userId - User ObjectId
 * @param {string} skillId - Skill ObjectId
 * @param {Array<{mentorId, score, reason}>} recommendations
 * @returns {Promise<void>}
 */
MentorRecommendationCacheSchema.statics.bulkUpsert = async function(userId, skillId, recommendations) {
  const bulkOps = recommendations.map(rec => ({
    updateOne: {
      filter: { userId, skillId, mentorId: rec.mentorId },
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
 * Get fresh cached recommendations for a user-skill pair.
 * @param {string} userId - User ObjectId
 * @param {string} skillId - Skill ObjectId
 * @param {number} maxAgeMs - Maximum cache age (default 24h)
 * @param {number} limit - Maximum results
 * @returns {Promise<Array>}
 */
MentorRecommendationCacheSchema.statics.getFreshRecommendations = async function(
  userId,
  skillId,
  maxAgeMs = 24 * 60 * 60 * 1000,
  limit = 50
) {
  const cutoffDate = new Date(Date.now() - maxAgeMs);
  
  return this.find({
    userId,
    skillId,
    updatedAt: { $gte: cutoffDate }
  })
    .sort({ score: -1 })
    .limit(limit)
    .lean()
    .exec();
};

/**
 * Clear stale cache entries.
 * @param {number} maxAgeMs - Age threshold
 * @returns {Promise<number>} Number of deleted entries
 */
MentorRecommendationCacheSchema.statics.clearStale = async function(maxAgeMs = 7 * 24 * 60 * 60 * 1000) {
  const cutoffDate = new Date(Date.now() - maxAgeMs);
  const result = await this.deleteMany({ updatedAt: { $lt: cutoffDate } });
  return result.deletedCount;
};

module.exports = mongoose.model('MentorRecommendationCache', MentorRecommendationCacheSchema);
