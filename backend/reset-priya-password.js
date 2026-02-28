/**
 * Reset priya's password and run comprehensive tests
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

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
  wallpaper: { type: String, default: 'default' }
});

const User = mongoose.model('User', userSchema);

async function resetPassword() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const hashedPassword = await bcrypt.hash('priya123', 10);
    
    const result = await User.findOneAndUpdate(
      { username: 'priya' },
      { 
        password: hashedPassword,
        $setOnInsert: {
          displayName: 'Priya',
          email: 'priya@test.com',
          phoneNumber: '9876543211',
          about: 'Hey there! I am using WhatsApp-Lite'
        }
      },
      { upsert: true, new: true }
    );

    console.log('✅ Password reset for priya');
    console.log('Username: priya');
    console.log('Password: priya123');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

resetPassword();
