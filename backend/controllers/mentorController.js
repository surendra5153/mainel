const User = require('../models/User');
const RVVerification = require('../models/RVVerification');

// Browse/search mentors by skill, rating, and simple filters
// query params: skill, minRating, limit, page
exports.browseMentors = async (req, res, next) => {
  try {
    const { skill, minRating, limit = 12, page = 1, campusDomain } = req.query;
    const skip = (page - 1) * limit;
    const filterRating = Number(minRating || 0);

    const filter = { rating: { $gte: filterRating } };
    if (skill) {
      // Search in teaches skill names (simple rule-based match)
      filter['teaches.name'] = { $regex: skill, $options: 'i' };
    }

    if (campusDomain) {
      // Filter by verified college email domain
      filter.collegeEmail = { $regex: `@${campusDomain}$`, $options: 'i' };
      filter.isVerified = true;
    }

    // EXCLUDE SELF: A user should not see themselves in the mentor list
    if (req.user && req.user.id) {
      filter._id = { $ne: req.user.id };
    }

    const mentors = await User.find(filter)
      .select('name email avatarUrl rating reviewsCount teaches learns badges credits title collegeEmail isVerified')
      .limit(Number(limit))
      .skip(skip)
      .sort({ rating: -1, reviewsCount: -1 });

    const mentorIds = mentors.map(m => m._id);
    const verifications = await RVVerification.find({
      userId: { $in: mentorIds },
      status: 'verified'
    }).select('userId').lean();

    const verifiedUserIds = new Set(verifications.map(v => v.userId.toString()));
    const mentorsWithRV = mentors.map(m => {
      const mentorObj = m.toObject();
      mentorObj.rvVerificationStatus = verifiedUserIds.has(m._id.toString()) ? 'verified' : null;
      return mentorObj;
    });

    const total = await User.countDocuments(filter);

    res.json({ mentors: mentorsWithRV, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    next(err);
  }
};

// Get a mentor's profile details (public)
exports.getMentorProfile = async (req, res, next) => {
  try {
    const { mentorId } = req.params;
    const mentor = await User.findById(mentorId).select('-passwordHash -__v');
    if (!mentor) return res.status(404).json({ message: 'Mentor not found' });

    const rvVerification = await RVVerification.findOne({ userId: mentorId }).select('status').lean();

    res.json({
      mentor: {
        id: mentor._id,
        name: mentor.name,
        email: mentor.email,
        avatarUrl: mentor.avatarUrl,
        rating: mentor.rating,
        reviewsCount: mentor.reviewsCount,
        teaches: mentor.teaches || [],
        learns: mentor.learns || [],
        badges: mentor.badges || [],
        bio: mentor.bio,
        github: mentor.github,
        linkedin: mentor.linkedin,
        twitter: mentor.twitter,
        website: mentor.website,
        title: mentor.title,
        location: mentor.location,
        yearsOfExperience: mentor.yearsOfExperience,
        isVerified: mentor.isVerified,
        rvVerificationStatus: rvVerification?.status === 'verified' ? 'verified' : null,
        demoVideos: mentor.demoVideos || [],
        projectFiles: mentor.projectFiles || [],
        credits: mentor.points
      }
    });
  } catch (err) {
    next(err);
  }
};

// Get paginated reviews for a mentor
exports.getMentorReviews = async (req, res, next) => {
  try {
    const { mentorId } = req.params;
    const { page = 1, limit = 5 } = req.query;
    const Review = require('../models/Review'); // Load dynamically or top-level

    // Query the new Scalable Collection
    const reviews = await Review.find({ mentor: mentorId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .select('rating feedback createdAt');
    // We do NOT populate learner name to keep anonymity/lightweight as per requirements ("Show... Rating, Feedback, Date... Do NOT show reviewer identity beyond 'Learner'")

    const total = await Review.countDocuments({ mentor: mentorId });

    res.json({
      reviews: reviews.map(r => ({
        id: r._id,
        rating: r.rating,
        feedback: r.feedback,
        createdAt: r.createdAt,
        reviewerName: 'Learner' // Constant anonymized name
      })),
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (err) {
    next(err);
  }
};
