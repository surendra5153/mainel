// routes/analyticsRoutes.js

/**
 * ML analytics and prediction endpoints for SkillSync.
 * Includes session success prediction and model management.
 * 
 * INTEGRATION INSTRUCTIONS:
 * 
 * To enable these routes in your server.js, add the following:
 * 
 * ```javascript
 * // In server.js (after other route definitions):
 * const analyticsRoutes = require('./routes/analyticsRoutes');
 * app.use('/api/ml', analyticsRoutes);
 * ```
 * 
 * Example endpoints once mounted:
 *   - POST /api/ml/predict/session-success
 *   - GET  /api/ml/predict/session-success/info
 *   - POST /api/ml/predict/session-success/batch
 */

const express = require('express');
const {
  predictSessionSuccessController,
  getSessionSuccessModelInfo,
  batchPredictSessionSuccess
} = require('../controllers/analyticsController');

const router = express.Router();

// Optional: Import auth middleware
// const auth = require('../middleware/auth');

/**
 * POST /ml/predict/session-success
 * 
 * Predict the success probability of a proposed session.
 * 
 * Request Body:
 *   {
 *     mentorId: "...",
 *     studentId: "...",
 *     skillId: "...",
 *     slot: "2024-01-15T14:00:00Z"
 *   }
 * 
 * Response:
 *   {
 *     success: true,
 *     prediction: {
 *       successProbability: 0.85,
 *       riskLevel: "low",
 *       fallback: false,
 *       modelVersion: "v1234567890"
 *     },
 *     meta: {
 *       mlEnabled: true,
 *       predictedAt: "2024-01-10T12:00:00Z"
 *     }
 *   }
 * 
 * Access: Public (consider adding auth for production)
 */
router.post('/predict/session-success', predictSessionSuccessController);

/**
 * GET /ml/predict/session-success/info
 * 
 * Get information about the session success prediction model.
 * Returns active model version, training metrics, and available models.
 * 
 * Response:
 *   {
 *     success: true,
 *     activeModel: {
 *       version: "v1234567890",
 *       trainedAt: "2024-01-01T00:00:00Z",
 *       accuracy: 0.85,
 *       samplesCount: 1000
 *     },
 *     availableModels: [...],
 *     meta: {
 *       mlEnabled: true,
 *       totalModels: 5
 *     }
 *   }
 * 
 * Access: Public (consider adding auth for production)
 */
router.get('/predict/session-success/info', getSessionSuccessModelInfo);

/**
 * POST /ml/predict/session-success/batch
 * 
 * Batch predict multiple sessions at once (max 100 per request).
 * 
 * Request Body:
 *   {
 *     sessions: [
 *       { mentorId: "...", studentId: "...", skillId: "...", slot: "..." },
 *       { mentorId: "...", studentId: "...", skillId: "...", slot: "..." }
 *     ]
 *   }
 * 
 * Response:
 *   {
 *     success: true,
 *     predictions: [
 *       { index: 0, mentorId: "...", prediction: {...} },
 *       { index: 1, mentorId: "...", prediction: {...} }
 *     ],
 *     meta: {
 *       total: 2,
 *       successful: 2,
 *       failed: 0
 *     }
 *   }
 * 
 * Access: Public (consider adding auth for production)
 * TODO: Add rate limiting for batch endpoints
 */
router.post('/predict/session-success/batch', batchPredictSessionSuccess);

// TODO: Future analytics endpoints:
// - POST /ml/analytics/user-insights/:userId - Get learning pattern insights
// - GET /ml/analytics/skill-trends - Analyze trending skills over time
// - POST /ml/analytics/mentor-performance - Analyze mentor performance metrics
// - GET /ml/analytics/session-patterns - Discover optimal session patterns

module.exports = router;
