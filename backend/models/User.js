// models/User.js
const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  skillRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: false }, // optional link to catalog
  name: { type: String, required: true, trim: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'expert'], default: 'beginner' },
  description: { type: String, default: '' },
  endorsementsCount: { type: Number, default: 0 }, // endorsements for this user-skill
  endorsements: [{ // who endorsed and optional comment
    by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    comment: { type: String },
    createdAt: { type: Date, default: Date.now }
  }]
}, { _id: true });

const BadgeSchema = new mongoose.Schema({
  key: { type: String, required: true },   // e.g., "endorsed_10"
  title: { type: String, required: true }, // e.g., "Top Endorsed Mentor"
  awardedAt: { type: Date, default: Date.now }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String },
  avatarUrl: { type: String, default: '' },
  teaches: [SkillSchema], // skills user can teach
  learns: [SkillSchema],  // skills user wants to learn
  points: { type: Number, default: 100 },
  karma: { type: Number, default: 0 }, // DEPRECATED: Do not use. Use 'level' for reputation.
  level: {
    type: String,
    enum: ['Novice', 'Apprentice', 'Master', 'Grandmaster'],
    default: 'Novice'
  },
  rating: { type: Number, default: 5 },
  reviewsCount: { type: Number, default: 0 },
  providers: [{ provider: String, providerId: String, email: String, avatarUrl: String }],
  badges: [BadgeSchema], // DEPRECATED: Do not use.
  createdAt: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  collegeId: {
    type: String,
    required: false,
    description: "College ID for verification purposes."
  },
  demoVideos: [
    {
      url: String,
      publicId: String,
      title: String,
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  ratings: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  collegeEmail: {
    type: String,
    required: false,
    unique: false,
    match: /.+@.+\.(edu|ac\.[a-z]{2}|edu\.[a-z]{2}|fr|jp|mx|ie|it|sg)$/ // Academic domains regex
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  rvProfile: {
    branch: { type: String, trim: true },
    year: { type: Number, min: 1, max: 5 },
    verifiedAt: { type: Date },
    expiresAt: { type: Date }
  },
  bio: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  github: {
    type: String,
    default: ''
  },
  linkedin: {
    type: String,
    default: ''
  },
  twitter: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: ''
  },
  yearsOfExperience: {
    type: Number,
    default: 0
  },
  isMentor: {
    type: Boolean,
    default: false
  },
  isOnline: {
    type: Boolean,
    default: false
  },
  projectFiles: [
    {
      url: String,
      description: String,
      uploadedAt: { type: Date, default: Date.now }
    }
  ],
  reviews: [
    {
      from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      rating: { type: Number, min: 1, max: 5 },
      feedback: { type: String, default: '' },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  roadmapGoal: {
    type: String,
    default: 'full-stack' // Default roadmap
  },
  // Security Question (Opt-in Password Recovery)
  securityQuestion: { type: String },
  securityAnswerHash: { type: String },
  securityAnswerAttempts: { type: Number, default: 0 },
  securityLockoutUntil: { type: Date, default: null },


}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

UserSchema.virtual('skillsOffered').get(function () {
  return this.teaches;
});

UserSchema.virtual('skillsWanted').get(function () {
  return this.learns;
});

module.exports = mongoose.model('User', UserSchema);
