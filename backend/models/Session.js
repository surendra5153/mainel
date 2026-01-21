const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fromName: { type: String, default: 'Unknown' },
  text: { type: String },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const SessionSchema = new mongoose.Schema({
  mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  skillRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill' },
  skillName: { type: String },
  scheduledAt: { type: Date, required: true },
  durationMins: { type: Number, default: 60 },
  pointsCost: { type: Number, default: 1 },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'confirmed', 'scheduled', 'completed', 'cancelled'],
    default: 'pending',
  },
  messages: [MessageSchema],
  feedback: { type: String },
  rating: { type: Number, min: 1, max: 5 },
  meetingLink: { type: String, default: null },
  meetingPassword: { type: String, default: null },
  agenda: { type: String, default: '' },
  learnerNotes: { type: String, default: '' }, // Private notes for the learner
  videoStartedAt: { type: Date },
  videoEndedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});



const ChatMessageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = {
  Session: mongoose.models.Session || mongoose.model('Session', SessionSchema),
  ChatMessage: mongoose.models.ChatMessage || mongoose.model('ChatMessage', ChatMessageSchema)
};
