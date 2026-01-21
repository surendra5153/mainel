// models/SessionSuccessModelParams.js
const mongoose = require('mongoose');

/**
 * Schema for storing trained session success prediction model parameters.
 * Allows model weights to persist across server restarts.
 * 
 * @schema SessionSuccessModelParams
 */
const SessionSuccessModelParamsSchema = new mongoose.Schema({
  modelVersion: {
    type: String,
    required: true,
    unique: true,
    default: 'v1.0'
  },
  weights: {
    type: [Number],
    required: true
  },
  bias: {
    type: Number,
    default: 0
  },
  featureNames: {
    type: [String],
    required: true
  },
  trainingMetadata: {
    samplesCount: Number,
    accuracy: Number,
    precision: Number,
    recall: Number,
    f1Score: Number,
    trainedAt: Date,
    epochs: Number,
    learningRate: Number
  },
  isActive: {
    type: Boolean,
    default: false,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for finding active model
SessionSuccessModelParamsSchema.index({ isActive: 1, modelVersion: 1 });

/**
 * Static method to get the active model.
 * @returns {Promise<Object|null>}
 */
SessionSuccessModelParamsSchema.statics.getActiveModel = async function() {
  return this.findOne({ isActive: true }).lean().exec();
};

/**
 * Static method to set a model as active.
 * @param {string} modelVersion - Version to activate
 * @returns {Promise<void>}
 */
SessionSuccessModelParamsSchema.statics.setActiveModel = async function(modelVersion) {
  // Deactivate all models
  await this.updateMany({}, { $set: { isActive: false } });
  
  // Activate specified model
  await this.updateOne(
    { modelVersion },
    { $set: { isActive: true, updatedAt: new Date() } }
  );
};

/**
 * Static method to save new model weights.
 * @param {Object} modelData - Model data to save
 * @returns {Promise<Object>}
 */
SessionSuccessModelParamsSchema.statics.saveModel = async function(modelData) {
  const model = await this.findOneAndUpdate(
    { modelVersion: modelData.modelVersion },
    {
      $set: {
        ...modelData,
        updatedAt: new Date()
      }
    },
    { upsert: true, new: true }
  );

  return model;
};

module.exports = mongoose.model('SessionSuccessModelParams', SessionSuccessModelParamsSchema);
