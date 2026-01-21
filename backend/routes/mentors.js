const express = require('express');
const mentorController = require('../controllers/mentorController');

const router = express.Router();

// Browse/search mentors by skill, rating, etc.
const optionalAuth = require('../middleware/optionalAuth');

// Browse/search mentors by skill, rating, etc.
// Apply optionalAuth so we can exclude the current user if logged in
router.get('/', optionalAuth, mentorController.browseMentors);

// Get a mentor's public profile
router.get('/:mentorId', mentorController.getMentorProfile);

// Get paginated reviews
router.get('/:mentorId/reviews', mentorController.getMentorReviews);

module.exports = router;
