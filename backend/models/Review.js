const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    mentor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    learner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true, unique: true },
    rating: { type: Number, min: 1, max: 5, required: true },
    feedback: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now, index: -1 } // Index via Date for faster sorting
});

module.exports = mongoose.model('Review', ReviewSchema);
