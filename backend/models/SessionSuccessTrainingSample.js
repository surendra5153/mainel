// models/SessionSuccessTrainingSample.js
const mongoose = require('mongoose');

/**
 * Schema for storing historical training samples for session success prediction.
 * Used to train and improve the ML model over time.
 * 
 * @schema SessionSuccessTrainingSample
 */
const SessionSuccessTrainingSampleSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  studentId: {
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
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    index: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  durationMins: {
    type: Number,
    default: 60
  },
  label: {
    type: String,
    enum: ['success', 'fail', 'neutral'],
    required: true,
    index: true
  },
  features: {
    type: Map,
    of: Number
  },
  metadata: {
    mentorRating: Number,
    studentExperience: Number,
    skillMatch: Number,
    priorSessions: Number,
    timeslotHour: Number,
    dayOfWeek: Number
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient querying
SessionSuccessTrainingSampleSchema.index({ mentorId: 1, studentId: 1, skillId: 1 });
SessionSuccessTrainingSampleSchema.index({ label: 1, createdAt: -1 });
SessionSuccessTrainingSampleSchema.index({ createdAt: -1 });

/**
 * Static method to create training sample from session.
 * @param {Object} session - Session document
 * @param {string} label - Success label ('success', 'fail', 'neutral')
 * @param {Object} features - Optional pre-computed features
 * @returns {Promise<Object>}
 */
SessionSuccessTrainingSampleSchema.statics.createFromSession = async function(session, label, features = {}) {
  const sample = {
    mentorId: session.mentor,
    studentId: session.learner,
    skillId: session.skillRef,
    sessionId: session._id,
    scheduledAt: session.scheduledAt,
    durationMins: session.durationMins || 60,
    label,
    features,
    metadata: {
      timeslotHour: new Date(session.scheduledAt).getHours(),
      dayOfWeek: new Date(session.scheduledAt).getDay()
    }
  };

  return this.create(sample);
};

/**
 * Static method to get training dataset.
 * @param {Object} filters - Query filters
 * @param {number} limit - Maximum samples to return
 * @returns {Promise<Array>}
 */
SessionSuccessTrainingSampleSchema.statics.getTrainingData = async function(filters = {}, limit = 10000) {
  return this.find(filters)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()
    .exec();
};

/**
 * Static method to get label distribution statistics.
 * @returns {Promise<Object>}
 */
SessionSuccessTrainingSampleSchema.statics.getLabelDistribution = async function() {
  const distribution = await this.aggregate([
    {
      $group: {
        _id: '$label',
        count: { $sum: 1 }
      }
    }
  ]);

  const result = { success: 0, fail: 0, neutral: 0, total: 0 };
  
  for (const item of distribution) {
    result[item._id] = item.count;
    result.total += item.count;
  }

  return result;
};

module.exports = mongoose.model('SessionSuccessTrainingSample', SessionSuccessTrainingSampleSchema);
