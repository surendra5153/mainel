// ml/sessionSuccessModel.js

const User = require('../models/User');
const Skill = require('../models/skill');
const { Session } = require('../models/Session');
const SessionSuccessModelParams = require('../models/SessionSuccessModelParams');
const { createLogger } = require('../utils/logger');

const logger = createLogger('ML:SessionSuccess');

/**
 * Default model weights (used if no trained model exists).
 * Feature order: mentorRating, studentExperience, skillMatch, priorSessions,
 *                timeOfDay, dayOfWeek, durationMatch, availability
 */
const DEFAULT_WEIGHTS = [0.3, 0.15, 0.25, 0.1, 0.05, 0.05, 0.05, 0.05];
const DEFAULT_BIAS = 0.0;

// In-memory cache for model parameters
let cachedModel = null;

/**
 * Simple logistic regression implementation for session success prediction.
 * Uses gradient descent for training.
 * 
 * @param {Array<Array<number>>} X - Feature matrix (n_samples × n_features)
 * @param {Array<number>} y - Label vector (n_samples), values 0 or 1
 * @param {Object} options - Training options
 * @returns {Object} Trained model { weights, bias, metadata }
 */
function trainSessionSuccessModel(X, y, options = {}) {
  const {
    learningRate = 0.01,
    epochs = 100,
    regularization = 0.01
  } = options;

  if (X.length === 0 || X.length !== y.length) {
    throw new Error('Invalid training data dimensions');
  }

  const nSamples = X.length;
  const nFeatures = X[0].length;

  // Initialize weights and bias
  let weights = new Array(nFeatures).fill(0);
  let bias = 0;

  // Training loop (gradient descent)
  for (let epoch = 0; epoch < epochs; epoch++) {
    let totalLoss = 0;

    // Compute gradients
    const weightGradients = new Array(nFeatures).fill(0);
    let biasGradient = 0;

    for (let i = 0; i < nSamples; i++) {
      const features = X[i];
      const label = y[i];

      // Compute prediction (logistic function)
      const z = dotProduct(weights, features) + bias;
      const prediction = sigmoid(z);

      // Compute error
      const error = prediction - label;
      totalLoss += -label * Math.log(prediction + 1e-10) - (1 - label) * Math.log(1 - prediction + 1e-10);

      // Accumulate gradients
      for (let j = 0; j < nFeatures; j++) {
        weightGradients[j] += error * features[j];
      }
      biasGradient += error;
    }

    // Update weights with L2 regularization
    for (let j = 0; j < nFeatures; j++) {
      weights[j] -= learningRate * (weightGradients[j] / nSamples + regularization * weights[j]);
    }
    bias -= learningRate * (biasGradient / nSamples);

    // Log progress every 10 epochs
    if ((epoch + 1) % 10 === 0) {
      const avgLoss = totalLoss / nSamples;
      logger.debug(`Epoch ${epoch + 1}/${epochs}, Loss: ${avgLoss.toFixed(4)}`);
    }
  }

  // Compute training metrics
  const predictions = X.map(features => {
    const z = dotProduct(weights, features) + bias;
    return sigmoid(z) >= 0.5 ? 1 : 0;
  });

  const metrics = computeMetrics(y, predictions);

  return {
    weights,
    bias,
    metadata: {
      samplesCount: nSamples,
      ...metrics,
      trainedAt: new Date(),
      epochs,
      learningRate
    }
  };
}

/**
 * Predict session success probability.
 * 
 * @param {Object} input - Input data
 * @param {string} input.mentorId - Mentor user ID
 * @param {string} input.studentId - Student user ID
 * @param {string} input.skillId - Skill ID
 * @param {Date|string} input.slot - Scheduled time slot
 * @returns {Promise<Object>} Prediction result
 */
async function predictSessionSuccess(input) {
  try {
    const mlEnabled = process.env.ML_SESSION_PREDICTION_ENABLED !== 'false';

    if (!mlEnabled) {
      logger.info('ML session prediction disabled, using fallback');
      return fallbackPrediction();
    }

    // Load model (from cache or database)
    const model = await loadModel();

    // Fetch required data
    const [mentor, student, skill] = await Promise.all([
      User.findById(input.mentorId).lean().exec(),
      User.findById(input.studentId).lean().exec(),
      Skill.findById(input.skillId).lean().exec()
    ]);

    if (!mentor || !student || !skill) {
      logger.warn('Missing data for prediction, using fallback');
      return fallbackPrediction();
    }

    // Build feature vector
    const features = await buildSessionFeatures({
      mentor,
      student,
      skill,
      slot: new Date(input.slot)
    });

    // Make prediction
    const z = dotProduct(model.weights, features) + model.bias;
    const successProbability = sigmoid(z);

    // Determine risk level
    let riskLevel = 'low';
    if (successProbability < 0.4) {
      riskLevel = 'high';
    } else if (successProbability < 0.7) {
      riskLevel = 'medium';
    }

    return {
      successProbability,
      riskLevel,
      fallback: false,
      modelVersion: model.modelVersion || 'default'
    };

  } catch (error) {
    logger.error('Error in predictSessionSuccess:', error.message);
    return fallbackPrediction();
  }
}

/**
 * Build feature vector for session success prediction.
 * @private
 * @param {Object} params
 * @returns {Promise<Array<number>>}
 */
async function buildSessionFeatures({ mentor, student, skill, slot }) {
  const features = [];

  // Feature 1: Mentor rating (normalized)
  const mentorRating = (mentor.ratings?.average || mentor.rating || 3) / 5;
  features.push(mentorRating);

  // Feature 2: Student experience level (approximated)
  const studentSkills = student.teaches?.length || 0;
  const studentExperience = Math.min(1, studentSkills / 10);
  features.push(studentExperience);

  // Feature 3: Skill match quality
  const skillMatch = calculateSkillMatchFeature(mentor, skill);
  features.push(skillMatch);

  // Feature 4: Prior sessions between mentor and student
  const priorSessions = await countPriorSessions(mentor._id, student._id);
  const priorSessionsNorm = Math.min(1, priorSessions / 5);
  features.push(priorSessionsNorm);

  // Feature 5: Time of day (normalized hour)
  const hour = slot.getHours();
  const timeOfDay = hour / 24;
  features.push(timeOfDay);

  // Feature 6: Day of week (0=Sunday, normalized)
  const dayOfWeek = slot.getDay() / 7;
  features.push(dayOfWeek);

  // Feature 7: Duration match (assume 60 min is ideal)
  const durationMatch = 1.0; // Default, could be parameterized
  features.push(durationMatch);

  // Feature 8: Mentor availability
  const availability = mentor.isOnline ? 1.0 : 0.5;
  features.push(availability);

  return features;
}

/**
 * Calculate skill match feature.
 * @private
 */
function calculateSkillMatchFeature(mentor, skill) {
  const teaches = mentor.teaches || [];
  const skillNameLower = skill.name.toLowerCase();

  for (const teachSkill of teaches) {
    if (teachSkill.name.toLowerCase() === skillNameLower) {
      const levelScores = {
        'beginner': 0.4,
        'intermediate': 0.6,
        'advanced': 0.8,
        'expert': 1.0
      };
      return levelScores[teachSkill.level] || 0.5;
    }
  }

  return 0.2; // Low match if skill not found
}

/**
 * Count prior sessions between mentor and student.
 * @private
 */
async function countPriorSessions(mentorId, studentId) {
  try {
    const count = await Session.countDocuments({
      mentor: mentorId,
      learner: studentId,
      status: 'completed'
    });
    return count;
  } catch (error) {
    logger.warn('Error counting prior sessions:', error.message);
    return 0;
  }
}

/**
 * Load model from cache or database.
 * @private
 */
async function loadModel() {
  // Check cache
  if (cachedModel && cachedModel.cachedAt > Date.now() - 5 * 60 * 1000) {
    return cachedModel;
  }

  // Load from database
  try {
    const dbModel = await SessionSuccessModelParams.getActiveModel();

    if (dbModel && dbModel.weights && dbModel.weights.length > 0) {
      cachedModel = {
        weights: dbModel.weights,
        bias: dbModel.bias || 0,
        modelVersion: dbModel.modelVersion,
        cachedAt: Date.now()
      };
      logger.info('Loaded model from database:', dbModel.modelVersion);
      return cachedModel;
    }
  } catch (error) {
    logger.warn('Error loading model from database:', error.message);
  }

  // Use default model
  cachedModel = {
    weights: DEFAULT_WEIGHTS,
    bias: DEFAULT_BIAS,
    modelVersion: 'default',
    cachedAt: Date.now()
  };
  logger.info('Using default model weights');
  return cachedModel;
}

/**
 * Fallback prediction when ML is disabled or errors occur.
 * @private
 */
function fallbackPrediction() {
  return {
    successProbability: 0.7, // Neutral positive assumption
    riskLevel: 'medium',
    fallback: true,
    modelVersion: 'fallback'
  };
}

/**
 * Compute evaluation metrics (accuracy, precision, recall, F1).
 * @private
 */
function computeMetrics(yTrue, yPred) {
  let tp = 0, fp = 0, tn = 0, fn = 0;

  for (let i = 0; i < yTrue.length; i++) {
    if (yTrue[i] === 1 && yPred[i] === 1) tp++;
    else if (yTrue[i] === 0 && yPred[i] === 1) fp++;
    else if (yTrue[i] === 0 && yPred[i] === 0) tn++;
    else if (yTrue[i] === 1 && yPred[i] === 0) fn++;
  }

  const accuracy = (tp + tn) / (tp + fp + tn + fn);
  const precision = tp / (tp + fp) || 0;
  const recall = tp / (tp + fn) || 0;
  const f1Score = 2 * (precision * recall) / (precision + recall) || 0;

  return { accuracy, precision, recall, f1Score };
}

/**
 * Sigmoid activation function.
 * @private
 */
function sigmoid(z) {
  return 1 / (1 + Math.exp(-z));
}

/**
 * Dot product of two vectors.
 * @private
 */
function dotProduct(a, b) {
  if (a.length !== b.length) {
    throw new Error('Vector dimensions must match');
  }
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    sum += a[i] * b[i];
  }
  return sum;
}

/**
 * Clear model cache (force reload).
 */
function clearModelCache() {
  cachedModel = null;
  logger.info('Model cache cleared');
}

module.exports = {
  trainSessionSuccessModel,
  predictSessionSuccess,
  clearModelCache
};
