const mongoose = require('mongoose');

const RVVerificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  rvEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  rvLoginId: {
    type: String,
    trim: true
  },
  idCardImageUrl: {
    type: String,
    required: false // DEPRECATED: No longer required as of Jan 2026
  },
  otp: {
    type: String
    // TODO: Hash OTP value using bcrypt for better security
  },
  otpExpiresAt: {
    type: Date
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verifiedAt: {
    type: Date
  },
  rejectedAt: {
    type: Date
  },
  notes: {
    type: String
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

RVVerificationSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('RVVerification', RVVerificationSchema);
