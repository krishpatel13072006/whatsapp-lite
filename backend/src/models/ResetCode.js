const mongoose = require('mongoose');

/**
 * Reset Code Schema
 * Stores password reset verification codes
 */
const resetCodeSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // Code expires in 10 minutes
});

module.exports = mongoose.model('ResetCode', resetCodeSchema);