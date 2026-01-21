const User = require('../models/User');
const Skill = require('../models/skill');
const { Session } = require('../models/Session');
const { generateMeetingLink } = require('../utils/jitsiHelper');
const { sendSessionRequest, sendSessionScheduled } = require('../services/emailService');

// Create a new session booking (learner requests a session with mentor)
exports.requestSession = async (req, res, next) => {
  try {
    const learnerId = req.user.id;
    const { mentorId, skillId, skillName, scheduledAt, durationMins, pointsCost, agenda } = req.body;

    if (!mentorId || !scheduledAt) return res.status(400).json({ message: 'mentorId and scheduledAt are required' });

    const mentor = await User.findById(mentorId);
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });

    const learner = await User.findById(learnerId);
    if (!learner) return res.status(404).json({ message: 'Learner not found' });

    const cost = Number(pointsCost || 1);
    if ((learner.points || 0) < cost) return res.status(400).json({ message: 'Insufficient points' });

    // deduct learner points immediately (simple flow)
    learner.points = (learner.points || 0) - cost;
    await learner.save();

    const session = new Session({
      mentor: mentorId,
      learner: learnerId,
      skillRef: skillId || undefined,
      skillName: skillName || undefined,
      scheduledAt: new Date(scheduledAt),
      durationMins: durationMins || 60,
      pointsCost: cost,
      status: 'pending',
      agenda: agenda || ''
    });

    await session.save();

    sendSessionRequest(mentor, learner, session).catch(err => {
      console.error('Failed to send session request email:', err.message);
    });

    res.status(201).json({ message: 'requested', session });
  } catch (err) {
    next(err);
  }
};

/**
 * Get Session Details (Secure)
 * GET /api/sessions/:sessionId
 */
exports.getSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId)
      .populate('mentor', 'name email avatarUrl')
      .populate('learner', 'name email avatarUrl');

    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Security check: only participants can see details
    const isMentor = session.mentor._id.toString() === userId;
    const isLearner = session.learner._id.toString() === userId;

    if (!isMentor && !isLearner) return res.status(403).json({ message: 'Not authorized' });

    res.json(session);
  } catch (err) {
    next(err);
  }
};

/**
 * Log Video Start
 * POST /api/sessions/:sessionId/video-start
 */
exports.joinVideo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (session.mentor.toString() !== userId && session.learner.toString() !== userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!session.videoStartedAt) {
      session.videoStartedAt = new Date();
      await session.save();
    }

    res.json({ message: 'logged' });
  } catch (err) {
    next(err);
  }
};

/**
 * Update Session Details (Agenda for Mentor, Notes for Learner)
 * PATCH /api/sessions/:sessionId/details
 */
exports.updateSessionDetails = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const { agenda, learnerNotes } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // Check permissions
    const isMentor = session.mentor.toString() === userId;
    const isLearner = session.learner.toString() === userId;

    if (!isMentor && !isLearner) return res.status(403).json({ message: 'Not allowed' });

    // Mentor can update agenda
    if (isMentor && agenda !== undefined) {
      session.agenda = agenda;
    }

    // Learner can update notes
    if (isLearner && learnerNotes !== undefined) {
      session.learnerNotes = learnerNotes;
    }

    // Learner can ALSO update agenda (collaborative) if desired? 
    // Requirement said "Mentor can define an agenda... Learner can take notes". 
    // Let's stick to Mentor-only agenda for now to keep roles distinct, or allow both?
    // "Mentor can define an agenda" implies ownership. But maybe learner wants to suggest topics.
    // For now, allow Mentor to set Agenda.

    await session.save();
    res.json({ message: 'updated', session });
  } catch (err) {
    next(err);
  }
};

// List sessions for current user
exports.listMySessions = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const query = { $or: [{ mentor: userId }, { learner: userId }] };
    const sessions = await Session.find(query).sort({ scheduledAt: -1 }).populate('mentor', 'name email avatarUrl').populate('learner', 'name email avatarUrl');
    res.json({ sessions });
  } catch (err) {
    next(err);
  }
};



// Mark session complete and apply credits to mentor, add feedback/rating
exports.completeSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const { rating, feedback } = req.body;

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });
    // only mentor or learner can mark complete
    if (![session.mentor.toString(), session.learner.toString()].includes(userId)) return res.status(403).json({ message: 'Not allowed' });

    if (session.status === 'completed') return res.status(400).json({ message: 'Already completed' });

    session.status = 'completed';
    session.rating = rating || session.rating;
    session.feedback = feedback || session.feedback;
    await session.save();

    // End video tracking
    if (session.videoStartedAt && !session.videoEndedAt) {
      session.videoEndedAt = new Date();
      await session.save();
    }

    // award mentor points (simple rule: mentor earns 80% of cost)
    const mentor = await User.findById(session.mentor);
    if (mentor) {
      const reward = Math.max(0, Math.round((session.pointsCost || 0) * 0.8));
      mentor.points = (mentor.points || 0) + reward;
      await mentor.save();

      // GAMIFICATION: Update Level based on activity
      const { updateUserLevel } = require('../services/gamificationService');
      await updateUserLevel(mentor._id);
    }

    res.json({ message: 'completed', session });
  } catch (err) {
    next(err);
  }
};

// Cancel session: if learner cancels after deduction, simple policy: refund if cancelled sufficiently early
exports.cancelSession = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    // only learner or mentor can cancel
    if (![session.mentor.toString(), session.learner.toString()].includes(userId)) return res.status(403).json({ message: 'Not allowed' });

    if (session.status === 'completed' || session.status === 'cancelled') return res.status(400).json({ message: 'Cannot cancel' });

    // refund policy: if cancelled more than 24 hours before scheduledAt, refund credits
    const now = new Date();
    const scheduled = new Date(session.scheduledAt);
    const diffMs = scheduled - now;
    let refund = 0;
    if (diffMs > 24 * 60 * 60 * 1000) refund = session.pointsCost || 0;

    if (refund > 0) {
      const learner = await User.findById(session.learner);
      if (learner) { learner.points = (learner.points || 0) + refund; await learner.save(); }
    }

    session.status = 'cancelled';
    await session.save();
    res.json({ message: 'cancelled', session, refund });
  } catch (err) {
    next(err);
  }
};

// Submit rating and feedback after session completion
exports.submitRating = async (req, res, next) => {
  try {
    const learnerId = req.user.id;
    const { sessionId } = req.params;
    const { rating, feedback } = req.body;

    // Hardened Duplicate Protection
    const Session = require('../models/Session');
    const Review = require('../models/Review');
    const User = require('../models/User');

    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ message: 'Rating must be 1-5' });

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ message: 'Session not found' });

    if (session.learner.toString() !== learnerId) return res.status(403).json({ message: 'Only learner can rate' });

    // Conflict Check: If session already has a rating
    if (session.rating) {
      return res.status(409).json({ message: 'Session already rated' });
    }

    session.rating = rating;
    session.feedback = feedback || '';
    await session.save();

    // Create scalable Review document
    const review = new Review({
      mentor: session.mentor,
      learner: learnerId,
      session: sessionId,
      rating: rating,
      feedback: feedback || ''
    });
    await review.save();

    // Update mentor reputation (Aggregate only - Scalable)
    const mentor = await User.findById(session.mentor);
    if (mentor) {
      // Calculate new average using moving average formula or simpler re-calculation if possible.
      // Since current 'rating' is stored, and 'reviewsCount' is stored.
      // New Avg = ((Old Avg * Old Count) + New Rating) / (Old Count + 1)
      const oldRating = mentor.rating || 0;
      const oldCount = mentor.reviewsCount || 0; // Note: reviewsCount on user might include legacy count

      const newCount = oldCount + 1;
      const newRating = ((oldRating * oldCount) + Number(rating)) / newCount;

      mentor.rating = Math.round(newRating * 10) / 10;
      mentor.reviewsCount = newCount;

      // Do NOT push to mentor.reviews array anymore (Scalability Fix)

      await mentor.save();

      // GAMIFICATION: Update Level (rating received adds to count)
      const { updateUserLevel } = require('../services/gamificationService');
      await updateUserLevel(mentor._id);
    }

    res.json({ message: 'rated', session });
  } catch (err) {
    if (err.code === 11000) { // Catch race condition on unique index if enforced (session unique in Review)
      return res.status(409).json({ message: 'Session already rated' });
    }
    next(err);
  }
};



// Accept a request with meeting link
exports.acceptRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Only the mentor (receiver) can accept the request
    if (session.mentor.toString() !== userId) {
      return res.status(403).json({ message: 'Only the mentor can accept this request' });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({ message: 'Session is not pending' });
    }

    const { link, password } = generateMeetingLink(session._id.toString());

    session.status = 'accepted';
    session.meetingLink = link;
    session.meetingPassword = password;
    await session.save();

    const populatedSession = await Session.findById(session._id)
      .populate('mentor', 'name email')
      .populate('learner', 'name email');

    if (populatedSession) {
      sendSessionScheduled(
        populatedSession.mentor,
        populatedSession.learner,
        populatedSession
      ).catch(err => {
        console.error('Failed to send session scheduled email:', err.message);
      });
    }

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Reject a request
exports.rejectRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    // Only the mentor (receiver) can reject the request
    if (session.mentor.toString() !== userId) {
      return res.status(403).json({ message: 'Only the mentor can reject this request' });
    }

    if (session.status !== 'pending') {
      return res.status(400).json({ message: 'Session is not pending' });
    }

    session.status = 'rejected';
    await session.save();

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Schedule a session after acceptance
exports.scheduleSession = async (req, res) => {
  try {
    const { scheduledAt, durationMins, meetingLink, agenda } = req.body;
    const updateData = {
      status: 'scheduled',
      scheduledAt: new Date(scheduledAt),
      durationMins: durationMins || 60
    };

    if (agenda) {
      updateData.agenda = agenda;
    }

    if (meetingLink) {
      updateData.meetingLink = meetingLink;
      // If manually providing link, assume no password or handled externally
    } else {
      const { link, password } = generateMeetingLink(req.params.id);
      updateData.meetingLink = link;
      updateData.meetingPassword = password;
    }

    const session = await Session.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('mentor', 'name email')
      .populate('learner', 'name email');

    if (!session) {
      return res.status(404).json({ message: 'Session not found' });
    }

    sendSessionScheduled(session.mentor, session.learner, session).catch(err => {
      console.error('Failed to send session scheduled email:', err.message);
    });

    res.status(200).json(session);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
