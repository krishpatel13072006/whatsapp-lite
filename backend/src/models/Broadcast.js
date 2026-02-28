const mongoose = require('mongoose');

/**
 * Broadcast Schema
 * Stores broadcast lists for sending messages to multiple recipients
 */
const broadcastSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: String, required: true },
  recipients: [{ type: String }], // usernames
  createdAt: { type: Date, default: Date.now }
});

// Index for user's broadcasts
broadcastSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Broadcast', broadcastSchema);