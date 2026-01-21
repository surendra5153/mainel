const User = require('../models/User');
const { createLogger } = require('../utils/logger');
const logger = createLogger('Service:Gamification');

const LEVELS = [
    { name: 'Novice', threshold: 0 },
    { name: 'Apprentice', threshold: 5 },   // 5 sessions
    { name: 'Master', threshold: 20 },      // 20 sessions
    { name: 'Grandmaster', threshold: 50 }  // 50 sessions
];

/**
 * Update User Level based on activity (sessions completed).
 * We use 'reviewsCount' as a proxy for completed teaching sessions for now.
 * @param {string} userId
 */
async function updateUserLevel(userId) {
    try {
        const user = await User.findById(userId);
        if (!user) return;

        // Metric: Number of reviews received (indicates sessions taught and rated)
        // Alternatively, we could count Session documents where mentor=userId and status='completed'
        // But 'reviewsCount' is already aggregated on the user model.
        const activityCount = user.reviewsCount || 0;

        const newLevelObj = LEVELS.slice().reverse().find(l => activityCount >= l.threshold);
        const newLevel = newLevelObj ? newLevelObj.name : 'Novice';

        if (newLevel !== user.level) {
            user.level = newLevel;
            await user.save();
            logger.info(`User ${userId} leveled up to ${newLevel}`);
        }
    } catch (error) {
        logger.error(`Failed to update level for ${userId}: ${error.message}`);
    }
}

module.exports = {
    updateUserLevel,
    LEVELS
};
