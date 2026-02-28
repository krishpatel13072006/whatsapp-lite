const mongoose = require('mongoose');

/**
 * User Schema
 * Stores user account information and preferences
 */
const userSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true, index: true },
  password: { type: String, required: true },
  displayName: { type: String, default: '' },
  phoneNumber: { type: String, unique: true, sparse: true, trim: true },
  email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
  profilePicture: { type: String, default: '' },
  about: { type: String, default: 'Hey there! I am using WhatsApp-Lite', maxlength: 139 },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  privacySettings: {
    lastSeen: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
    profilePhoto: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
    about: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
    status: { type: String, enum: ['everyone', 'contacts', 'nobody'], default: 'everyone' },
    readReceipts: { type: Boolean, default: true }
  },
  blockedContacts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  socketId: { type: String, default: null },
  pushToken: { type: String, default: null },
  joinedAt: { type: Date, default: Date.now },
  wallpaper: { type: String, default: 'default' },
  disappearingSettings: { type: Map, of: Number, default: {} }
});

// Index for faster queries
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ phoneNumber: 1 });

module.exports = mongoose.model('User', userSchema);