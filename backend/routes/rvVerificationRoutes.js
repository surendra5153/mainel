const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');

const controller = require('../controllers/rvVerificationController');

router.post('/start', authMiddleware, controller.startVerification);
router.post('/verify-otp', authMiddleware, controller.verifyOTP);
router.get('/status', authMiddleware, controller.getStatus);
router.patch('/rv-profile', authMiddleware, controller.updateRVProfile);


module.exports = router;
