// models/Skill.js
const mongoose = require('mongoose');

const SkillSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String, default: 'general' },
  description: { type: String, default: '' },
  tags: [{ type: String }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  popularity: { type: Number, default: 0 },
  title: {
    type: String,
    required: false
  },
  media: [
    {
      url: String,
      type: String
    }
  ],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
});

module.exports = mongoose.model('Skill', SkillSchema);
