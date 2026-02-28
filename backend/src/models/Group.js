const mongoose = require('mongoose');

/**
 * Group Schema
 * Stores group chat information
 */
const groupSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  profilePicture: { type: String, default: '' },
  theme: { type: String, default: '#00a884' }, // Group theme color
  createdBy: { type: String, required: true }, // username of creator
  admins: [{ type: String }], // usernames of admins
  members: [{ type: String }], // usernames of members
  createdAt: { type: Date, default: Date.now }
});

// Index for member lookups
groupSchema.index({ members: 1 });
groupSchema.index({ createdBy: 1 });

module.exports = mongoose.model('Group', groupSchema);