// Script to reset passwords for user1 and user2
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 60000,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// User schema
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  phoneNumber: String,
  displayName: String,
  about: String,
  profilePicture: String,
  isOnline: Boolean,
  socketId: String,
  lastSeen: Date,
  wallpaper: String,
  privacySettings: Object,
  blockedContacts: [String],
  createdAt: Date
});

const User = mongoose.model('User', userSchema);

async function resetPasswords() {
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('user123', salt);
    
    // Update user1
    const user1 = await User.findOneAndUpdate(
      { username: 'user1' },
      { password: hashedPassword },
      { new: true }
    );
    console.log('✅ Updated password for user1:', user1 ? 'Success' : 'User not found');
    
    // Update user2
    const user2 = await User.findOneAndUpdate(
      { username: 'user2' },
      { password: hashedPassword },
      { new: true }
    );
    console.log('✅ Updated password for user2:', user2 ? 'Success' : 'User not found');
    
    // Verify by comparing
    if (user1) {
      const match1 = await bcrypt.compare('user123', user1.password);
      console.log('🔍 Verify user1 password:', match1 ? 'Match' : 'No match');
    }
    
    if (user2) {
      const match2 = await bcrypt.compare('user123', user2.password);
      console.log('🔍 Verify user2 password:', match2 ? 'Match' : 'No match');
    }
    
    console.log('\n✅ Password reset complete! Both users now have password: user123');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetPasswords();
