// controllers/analyticsController.js

const { predictSessionSuccess } = require('../ml/sessionSuccessModel');
const { createLogger } = require('../utils/logger');

const logger = createLogger('Controller:Analytics');

/**
 * Predict session success probability.
 * 
 * Route: POST /ml/predict/session-success
 * Body:
 *   - mentorId: Mentor user ID (required)
 *   - studentId: Student user ID (required)
 *   - skillId: Skill ID (required)
 *   - slot: Scheduled time slot (required, ISO date string)
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function predictSessionSuccessController(req, res, next) {
  try {
    const { mentorId, studentId, skillId, slot } = req.body;

    // Validate required fields
    if (!mentorId || !studentId || !skillId || !slot) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: mentorId, studentId, skillId, slot'
      });
    }

    // Validate slot is a valid date
    const slotDate = new Date(slot);
    if (isNaN(slotDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid slot date format (use ISO 8601)'
      });
    }

    // Check if ML is enabled
    const mlEnabled = process.env.ML_SESSION_PREDICTION_ENABLED !== 'false';

    logger.debug('Predicting session success:', { mentorId, studentId, skillId, slot });

    // Call ML predictor
    const prediction = await predictSessionSuccess({
      mentorId,
      studentId,
      skillId,
      slot: slotDate
    });

    // Return prediction result
    return res.status(200).json({
      success: true,
      prediction: {
        successProbability: prediction.successProbability,
        riskLevel: prediction.riskLevel,
        fallback: prediction.fallback,
        modelVersion: prediction.modelVersion
      },
      meta: {
        mlEnabled,
        predictedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    logger.error('Error in predictSessionSuccessController:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to predict session success',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Get session success model information.
 * 
 * Route: GET /ml/predict/session-success/info
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function getSessionSuccessModelInfo(req, res, next) {
  try {
    const SessionSuccessModelParams = require('../models/SessionSuccessModelParams');
    
    const activeModel = await SessionSuccessModelParams.getActiveModel();
    const allModels = await SessionSuccessModelParams.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
      .exec();

    const mlEnabled = process.env.ML_SESSION_PREDICTION_ENABLED !== 'false';

    return res.status(200).json({
      success: true,
      activeModel: activeModel ? {
        version: activeModel.modelVersion,
        trainedAt: activeModel.trainingMetadata?.trainedAt,
        accuracy: activeModel.trainingMetadata?.accuracy,
        samplesCount: activeModel.trainingMetadata?.samplesCount
      } : null,
      availableModels: allModels.map(m => ({
        version: m.modelVersion,
        isActive: m.isActive,
        trainedAt: m.trainingMetadata?.trainedAt,
        accuracy: m.trainingMetadata?.accuracy
      })),
      meta: {
        mlEnabled,
        totalModels: allModels.length
      }
    });

  } catch (error) {
    logger.error('Error in getSessionSuccessModelInfo:', error.message);
    next(error);
  }
}

/**
 * Batch predict multiple sessions.
 * 
 * Route: POST /ml/predict/session-success/batch
 * Body:
 *   - sessions: Array of {mentorId, studentId, skillId, slot}
 * 
 * @param {Object} req - Express request
 * @param {Object} res - Express response
 * @param {Function} next - Express next middleware
 */
async function batchPredictSessionSuccess(req, res, next) {
  try {
    const { sessions } = req.body;

    if (!Array.isArray(sessions) || sessions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'sessions must be a non-empty array'
      });
    }

    if (sessions.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 sessions per batch request'
      });
    }

    logger.debug('Batch predicting', sessions.length, 'sessions');

    // Predict each session
    const predictions = await Promise.all(
      sessions.map(async (session, index) => {
        try {
          const result = await predictSessionSuccess(session);
          return {
            index,
            ...session,
            prediction: result
          };
        } catch (error) {
          logger.warn('Failed to predict session', index, ':', error.message);
          return {
            index,
            ...session,
            prediction: null,
            error: error.message
          };
        }
      })
    );

    return res.status(200).json({
      success: true,
      predictions,
      meta: {
        total: sessions.length,
        successful: predictions.filter(p => p.prediction).length,
        failed: predictions.filter(p => !p.prediction).length
      }
    });

  } catch (error) {
    logger.error('Error in batchPredictSessionSuccess:', error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to process batch predictions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = {
  predictSessionSuccessController,
  getSessionSuccessModelInfo,
  batchPredictSessionSuccess
};
