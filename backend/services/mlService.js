const axios = require('axios');
const User = require('../models/User');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

/**
 * Call Python ML service to get mentor recommendations.
 * 
 * @param {Object} targetUser - The user looking for a mentor (Mongoose doc or object)
 * @param {Array} candidates - List of potential mentors (Mongoose docs or objects)
 * @param {Number} limit - Number of recommendations
 * @returns {Promise<Array>} - List of recommended items with scores
 */
exports.getMentorRecommendationsAI = async (targetUser, candidates, limit = 5) => {
    try {
        // 1. Format Target User
        const targetPayload = {
            user_id: targetUser._id.toString(),
            skills: targetUser.teaches ? targetUser.teaches.map(t => t.name) : [],
            goals: targetUser.learns ? targetUser.learns.map(l => l.name) : []
        };

        // 2. Format Candidates
        const candidatesPayload = candidates.map(c => ({
            user_id: c._id.toString(),
            name: c.name,
            skills: c.teaches ? c.teaches.map(t => t.name) : []
        }));

        // 3. Make Request
        const response = await axios.post(`${ML_SERVICE_URL}/recommend`, {
            target_user: targetPayload,
            candidates: candidatesPayload,
            top_n: limit
        });

        if (response.data && response.data.recommendations) {
            return response.data.recommendations;
        }

        return [];

    } catch (error) {
        console.error('ML Service Error:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.warn('⚠️ Python ML Service is not running. Returning empty AI recommendations.');
        }
        // Fallback: Return empty or handle gracefully
        return [];
    }
};
