import { client } from './client';

/**
 * Get personalized skill recommendations for a user
 * @param {Object} params - Query parameters
 * @param {string} params.userId - User ID (optional if authenticated)
 * @param {number} params.limit - Max number of recommendations
 * @param {boolean} params.skipCache - Force fresh computation
 * @returns {Promise<Object>}
 */
export async function getSkillRecommendations(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, v);
  });
  return client.get(`/ml/recommendations/skills?${qs.toString()}`);
}

/**
 * Get personalized mentor recommendations for specific skills
 * @param {Object} params - Query parameters
 * @param {string} params.userId - User ID (optional if authenticated)
 * @param {string} params.skillIds - Comma-separated skill IDs (required)
 * @param {number} params.limit - Max number of recommendations
 * @param {boolean} params.skipCache - Force fresh computation
 * @returns {Promise<Object>}
 */
export async function getMentorRecommendations(params = {}) {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, v);
  });
  return client.get(`/ml/recommendations/mentors?${qs.toString()}`);
}

/**
 * Predict session success probability
 * @param {Object} data - Session data
 * @param {string} data.mentorId - Mentor user ID
 * @param {string} data.studentId - Student user ID
 * @param {string} data.skillId - Skill ID
 * @param {string} data.slot - Scheduled time slot (ISO date string)
 * @returns {Promise<Object>}
 */
export async function predictSessionSuccess(data) {
  return client.post('/ml/predict/session-success', data);
}

/**
 * Get session success model information
 * @returns {Promise<Object>}
 */
export async function getSessionSuccessModelInfo() {
  return client.get('/ml/predict/session-success/info');
}

/**
 * Get ML recommendation statistics
 * @returns {Promise<Object>}
 */
export async function getMLStats() {
  return client.get('/ml/recommendations/stats');
}

/**
 * Clear ML recommendation caches (admin)
 * @returns {Promise<Object>}
 */
export async function clearMLCache() {
  return client.post('/ml/recommendations/clear-cache', {});
}
