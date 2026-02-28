const mongoose = require('mongoose');

/**
 * Group Message Schema
 * Stores messages within group chats
 */
const groupMessageSchema = new mongoose.Schema({
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  fromUsername: { type: String, required: true },
  text: { type: String },
  type: { type: String, default: 'text' },
  fileUrl: { type: String },
  fileName: { type: String },
  timestamp: { type: Date, default: Date.now },
  deletedForEveryone: { type: Boolean, default: false },
  starredBy: [{ type: String }], // Array of usernames who starred this message
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
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: 'GroupMessage', default: null },
  audioDuration: { type: Number, default: null }
});

// Compound indexes for efficient queries
groupMessageSchema.index({ groupId: 1, timestamp: -1 });
groupMessageSchema.index({ groupId: 1, pinned: 1 });

module.exports = mongoose.model('GroupMessage', groupMessageSchema);