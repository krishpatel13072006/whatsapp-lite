const mongoose = require('mongoose');

/**
 * Scheduled Message Schema
 * Stores messages scheduled for future delivery
 */
const scheduledMessageSchema = new mongoose.Schema({
  fromUsername: { type: String, required: true },
  toUsername: { type: String, required: true },
  text: { type: String },
  type: { type: String, default: 'text' },
  fileUrl: { type: String },
  fileName: { type: String },
  scheduledFor: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'sent', 'cancelled'], default: 'pending' },
  createdAt: { type: Date, default: Date.now }
});

// Index for scheduled message processing
scheduledMessageSchema.index({ scheduledFor: 1, status: 1 });
scheduledMessageSchema.index({ fromUsername: 1 });

module.exports = mongoose.model('ScheduledMessage', scheduledMessageSchema);