const mongoose = require('mongoose');

/**
 * Message Schema
 * Stores direct messages between users
 */
const messageSchema = new mongoose.Schema({
  from: { type: String, required: false },
  to: { type: String, required: false },
  fromUsername: { type: String, required: true },
  toUsername: { type: String, required: true },
  text: { type: String },
  type: { type: String, default: 'text' }, // text, image, file, gif, audio
  fileUrl: { type: String },
  fileName: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
  deletedFor: [{ type: String }],
  deletedForEveryone: { type: Boolean, default: false },
  read: { type: Boolean, default: false },
  starredBy: [{ type: String }], // Array of usernames who starred this message
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
  // New features
  reactions: [{
    emoji: { type: String, required: true },
    username: { type: String, required: true },
    timestamp: { type: Date, default: Date.now }
  }],
  edited: { type: Boolean, default: false },
  editedAt: { type: Date, default: null },
  editHistory: [{ text: String, editedAt: Date }],
  pinned: { type: Boolean, default: false },
  pinnedAt: { type: Date, default: null },
  pinnedBy: { type: String, default: null },
  disappearing: { type: Boolean, default: false },
  disappearsAt: { type: Date, default: null },
  audioDuration: { type: Number, default: null } // for voice messages in seconds
});

// Compound indexes for efficient queries
messageSchema.index({ fromUsername: 1, toUsername: 1, timestamp: -1 });
messageSchema.index({ toUsername: 1, timestamp: -1 });
messageSchema.index({ timestamp: 1 }, { expireAfterSeconds: 86400 * 30 }); // TTL for disappearing messages (optional)

module.exports = mongoose.model('Message', messageSchema);