const mongoose = require('mongoose');

/**
 * Call Log Schema
 * Stores call history for voice and video calls
 */
const callLogSchema = new mongoose.Schema({
  caller: { type: String, required: true },
  callerUsername: { type: String, required: true },
  receiver: { type: String },
  receiverUsername: { type: String },
  callType: { type: String, enum: ['voice', 'video'], default: 'video' },
  duration: { type: Number, default: 0 }, // in seconds
  recordingUrl: { type: String },
  timestamp: { type: Date, default: Date.now, index: true },
  status: { type: String, enum: ['completed', 'missed', 'rejected'], default: 'completed' }
});

// Indexes for efficient queries
callLogSchema.index({ callerUsername: 1, timestamp: -1 });
callLogSchema.index({ receiverUsername: 1, timestamp: -1 });

module.exports = mongoose.model('CallLog', callLogSchema);