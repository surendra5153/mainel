const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/user/profile
router.get('/profile', authController.getMe);

// PATCH /api/user/profile
router.patch('/profile', authController.updateMe);

module.exports = router;