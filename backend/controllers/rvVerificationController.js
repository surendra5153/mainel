const User = require('../models/User');
const RVVerification = require('../models/RVVerification');
const { sendRVVerificationOTP } = require('../services/emailService');

const RV_EMAIL_REGEX = /^[^\s@]+@(rvce\.edu\.in|rv\.edu\.in|ms\.rvce\.edu\.in)$/i;

/**
 * Start RV College verification process
 * Validates RV email domain, generates 6-digit OTP, and sends it to the user's RV email
 * 
 * @route POST /api/rv-verification/start
 * @access Protected (requires authentication)
 * @param {Object} req.body - Request body
 * @param {string} req.body.rvEmail - RV College email address
 * @param {string} req.body.rvLoginId - Optional RV login ID
 * @param {string} req.body.idCardImageUrl - URL of uploaded ID card image
 * @returns {Object} 200 - Success response with status
 * @returns {Object} 400 - Validation error
 * @returns {Object} 404 - User not found
 * 
 * TODO: Add rate limiting to prevent OTP spam
 */
exports.startVerification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { rvEmail, rvLoginId, idCardImageUrl } = req.body;

    if (!rvEmail) {
      return res.status(400).json({
        message: 'RV email is required'
      });
    }

    if (!RV_EMAIL_REGEX.test(rvEmail)) {
      return res.status(400).json({
        message: 'Invalid RV College email domain. Please use @rvce.edu.in, @rv.edu.in, or @ms.rvce.edu.in'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // 1. Google OAuth Cross-Verification
    // MOVED TO verifyOTP: We now check this at the final step to allow OTP sending first.

    // 2. Uniqueness Check
    // Check if this RV email is already verified by ANOTHER user
    const existingVerified = await User.findOne({
      collegeEmail: rvEmail.toLowerCase().trim(),
      isVerified: true,
      _id: { $ne: userId }
    });

    if (existingVerified) {
      return res.status(409).json({ message: 'This RV email is already verified by another account.' });
    }

    // Generate 6-digit OTP and set 10-minute expiration
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Upsert verification record (create if doesn't exist, update if exists)
    // This allows users to re-submit verification if previously rejected
    const verification = await RVVerification.findOneAndUpdate(
      { userId },
      {
        userId,
        rvEmail: rvEmail.toLowerCase().trim(),
        rvLoginId: rvLoginId ? rvLoginId.trim() : undefined,
        idCardImageUrl,
        otp,
        otpExpiresAt,
        emailVerified: false,
        status: 'pending'
      },
      { upsert: true, new: true }
    );

    const emailResult = await sendRVVerificationOTP({
      userName: user.name,
      rvEmail: rvEmail.toLowerCase().trim(),
      otp,
      expiryMinutes: 10
    });

    if (!emailResult.success) {
      console.error('Failed to send RV verification OTP email (continuing in debug mode):', emailResult.error);
      // In strict production we might want to fail here, but for now we proceed
    }

    res.status(200).json({
      success: true,
      message: emailResult.success ? 'OTP sent to your RV email' : 'OTP generated (Check console/network)',
      status: 'pending',
      emailVerified: false,
      debugOtp: otp // Restore debug OTP for demo
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Verify OTP for RV College email verification
 * Validates the OTP and checks expiration (10 minutes)
 * Upon success, marks verification as complete and clears OTP data
 * 
 * @route POST /api/rv-verification/verify-otp
 * @access Protected (requires authentication)
 * @param {Object} req.body - Request body
 * @param {string} req.body.otp - 6-digit OTP received via email
 * @returns {Object} 200 - Verification successful
 * @returns {Object} 400 - Invalid or expired OTP
 * @returns {Object} 404 - No pending verification found
 */
exports.verifyOTP = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { otp } = req.body;

    if (!otp) {
      return res.status(400).json({ message: 'OTP is required' });
    }

    const verification = await RVVerification.findOne({ userId });

    if (!verification) {
      return res.status(404).json({
        success: false,
        message: 'No pending verification found. Please start verification first.'
      });
    }

    // Validate OTP matches (plain text comparison - TODO: use bcrypt for production)
    if (verification.otp !== otp.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Check if OTP has expired (10-minute window)
    if (new Date() > verification.otpExpiresAt) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.'
      });
    }

    // 1. Google OAuth Cross-Verification (Strict Check)
    // User must be authenticated via Google, and that Google email must match the RV email
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const googleProvider = (user.providers || []).find(p => p.provider === 'google');

    // Normalize emails for comparison
    const normalizedRvEmail = verification.rvEmail.toLowerCase().trim();
    const normalizedGoogleEmail = googleProvider ? googleProvider.email.toLowerCase().trim() : '';
    const normalizedUserEmail = user.email.toLowerCase().trim();

    // Allow verification if EITHER:
    // 1. The Google Provider email matches (Standard path)
    // 2. The User's primary email matches (Fallback for when provider data is missing)
    const isMatch = (googleProvider && normalizedGoogleEmail === normalizedRvEmail) ||
      (normalizedUserEmail === normalizedRvEmail);

    if (!isMatch) {
      return res.status(403).json({
        success: false,
        message: 'Security Verification Failed: You must be logged in with the specific Google Account matching your RV email to verify it.'
      });
    }

    // Mark as verified and clear OTP data for security
    // Set Expiry to 6 months (180 days)
    const expiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

    verification.emailVerified = true;
    verification.status = 'verified';
    verification.verifiedAt = new Date();
    verification.expiresAt = expiresAt;
    verification.otp = undefined;
    verification.otpExpiresAt = undefined;
    await verification.save();

    // AUTO-VERIFICATION: Update User Profile immediately
    // const user = await User.findById(userId); // Already fetched above
    if (user) {
      user.isVerified = true;
      user.collegeEmail = verification.rvEmail;
      user.rvProfile = user.rvProfile || {};
      user.rvProfile.verifiedAt = new Date();
      user.rvProfile.expiresAt = expiresAt;
      await user.save();
    }

    res.status(200).json({
      success: true,
      emailVerified: true,
      status: 'verified',
      verifiedAt: verification.verifiedAt,
      expiresAt: verification.expiresAt,
      message: 'RV College verification successful! You have been verified.'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update RV Profile Details (Branch & Year)
 * Only allowed for verified users
 */
exports.updateRVProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { branch, year } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.isVerified) {
      return res.status(403).json({ message: 'Only RV verified users can update this section.' });
    }

    if (branch) user.rvProfile.branch = branch.trim();
    if (year) {
      const parsedYear = parseInt(year, 10);
      if (!isNaN(parsedYear) && parsedYear >= 1 && parsedYear <= 5) {
        user.rvProfile.year = parsedYear;
      }
    }

    await user.save();

    res.json({
      success: true,
      rvProfile: user.rvProfile
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get current RV verification status for the authenticated user
 * Returns different fields based on verification state (none/pending/verified/rejected)
 * 
 * @route GET /api/rv-verification/status
 * @access Protected (requires authentication)
 * @returns {Object} 200 - Current verification status with relevant fields
 * @returns {string} response.status - One of: 'none', 'pending', 'verified', 'rejected'
 * @returns {boolean} response.rvVerified - True if status is 'verified'
 * @returns {boolean} response.emailVerified - True if OTP was verified
 */
exports.getStatus = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const verification = await RVVerification.findOne({ userId });

    if (!verification) {
      return res.status(200).json({
        rvVerified: false,
        status: 'none'
      });
    }

    const response = {
      rvVerified: verification.status === 'verified',
      status: verification.status,
      emailVerified: verification.emailVerified
    };

    // Include different fields based on verification status
    // This prevents exposing sensitive data (OTP, rejected notes) unnecessarily
    if (verification.status === 'verified') {
      response.rvEmail = verification.rvEmail;
      response.rvLoginId = verification.rvLoginId;
      response.idCardImageUrl = verification.idCardImageUrl;
      response.verifiedAt = verification.verifiedAt;
      response.expiresAt = verification.expiresAt;

      // Fetch user to get current profile details (which might have been updated separately)
      const user = await User.findById(userId);
      if (user && user.rvProfile) {
        response.rvProfile = user.rvProfile;
      }
    } else if (verification.status === 'pending') {
      response.rvEmail = verification.rvEmail;
      response.idCardImageUrl = verification.idCardImageUrl;
    } else if (verification.status === 'rejected') {
      response.notes = verification.notes;
      response.rejectedAt = verification.rejectedAt;
    }

    res.status(200).json(response);
  } catch (err) {
    next(err);
  }
};



/**
 * DEBUG ONLY: Get OTP for a specific email
 * Useful when email service is not configured
 */
exports.getDebugOtp = async (req, res, next) => {
  try {
    const { email } = req.params;
    if (!email) return res.status(400).json({ message: 'Email required' });

    console.log('Fetching Debug OTP for:', email);

    const verification = await RVVerification.findOne({
      rvEmail: email.toLowerCase().trim()
    }).sort({ updatedAt: -1 });

    if (!verification) {
      return res.status(404).json({ message: 'No verification record found for this email' });
    }

    res.json({
      rvEmail: verification.rvEmail,
      otp: verification.otp,
      status: verification.status,
      expiresAt: verification.otpExpiresAt,
      isExpired: new Date() > verification.otpExpiresAt
    });
  } catch (err) {
    next(err);
  }
};

