// models/RefreshToken.js
const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  revoked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

RefreshTokenSchema.methods.isExpired = function () {
  return Date.now() >= this.expiresAt.getTime();
};

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
