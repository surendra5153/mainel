const express = require('express');
const router = express.Router();
const controller = require('../controllers/roadmapController');
const authMiddleware = require('../middleware/auth');

// Public or Protected - decided to make them protected to ensure user context if needed later
// But for now, listing roadmaps could be public. Keeping consistent with req.
router.get('/list', authMiddleware, controller.listRoadmaps);
router.get('/:slug', authMiddleware, controller.getRoadmapBySlug);

module.exports = router;
