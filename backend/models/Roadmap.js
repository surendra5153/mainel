const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  data: {
    label: { type: String, required: true }
  },
  type: { type: String, default: 'default' } // input, output, default
}, { _id: false });

const EdgeSchema = new mongoose.Schema({
  id: { type: String, required: true },
  source: { type: String, required: true },
  target: { type: String, required: true },
  type: { type: String, default: 'smoothstep' },
  animated: { type: Boolean, default: false }
}, { _id: false });

const RoadmapSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true }, // e.g., "Full Stack Web Development"
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true }, // e.g., "full-stack"
  description: { type: String, default: '' },
  nodes: [NodeSchema],
  edges: [EdgeSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Roadmap', RoadmapSchema);
