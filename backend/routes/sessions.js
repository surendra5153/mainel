const express = require('express');
const auth = require('../middleware/auth');
const sessionController = require('../controllers/sessionController');

const router = express.Router();

// Learner requests a session with a mentor
router.post('/', auth, sessionController.requestSession);

// Get sessions for current user
router.get('/me', auth, sessionController.listMySessions);

// Get specific session details
router.get('/:sessionId', auth, sessionController.getSession);

// Log video start
router.post('/:sessionId/video-start', auth, sessionController.joinVideo);



// Mark a session completed (mentor or learner)
router.put('/:sessionId/complete', auth, sessionController.completeSession);

// Submit rating and feedback (learner)
router.post('/:sessionId/rate', auth, sessionController.submitRating);

// Cancel a session
router.delete('/:sessionId', auth, sessionController.cancelSession);

// Update session details (agenda, notes)
router.patch('/:sessionId/details', auth, sessionController.updateSessionDetails);



// Route to accept a request
router.put('/:id/accept', auth, sessionController.acceptRequest);

// Route to reject a request
router.put('/:id/reject', auth, sessionController.rejectRequest);

// Route to schedule a session after acceptance
router.put('/:id/schedule', auth, sessionController.scheduleSession);
module.exports = router;
