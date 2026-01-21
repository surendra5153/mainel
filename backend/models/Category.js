// models/Category.js
const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // e.g. "programming"
  title: { type: String, required: true },             // e.g. "Programming"
  description: { type: String, default: '' },
  tags: [{ type: String }],                            // commonly associated tags
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Category', CategorySchema);
