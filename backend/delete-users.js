// Script to delete all users except user1
require('dotenv').config();
const mongoose = require('mongoose');

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

// Message schema
const messageSchema = new mongoose.Schema({
  fromUsername: String,
  toUsername: String,
  text: String,
  type: String,
  fileUrl: String,
  fileName: String,
  timestamp: Date,
  read: Boolean,
  starredBy: [String]
});

const Message = mongoose.model('Message', messageSchema);

// Group schema
const groupSchema = new mongoose.Schema({
  name: String,
  members: [String],
  admins: [String],
  createdBy: String,
  description: String,
  profilePicture: String,
  theme: String
});

const Group = mongoose.model('Group', groupSchema);

// Broadcast schema
const broadcastSchema = new mongoose.Schema({
  name: String,
  createdBy: String,
  recipients: [String]
});

const Broadcast = mongoose.model('Broadcast', broadcastSchema);

// CallLog schema
const callLogSchema = new mongoose.Schema({
  caller: String,
  callee: String,
  type: String,
  status: String,
  timestamp: Date,
  duration: Number
});

const CallLog = mongoose.model('CallLog', callLogSchema);

async function deleteAllUsersExceptUser1() {
  try {
    // Get all users
    const allUsers = await User.find({});
    console.log(`📋 Found ${allUsers.length} users`);
    
    // Find users to delete (all except user1)
    const usersToDelete = allUsers.filter(u => u.username !== 'user1');
    console.log(`🗑️ Users to delete: ${usersToDelete.map(u => u.username).join(', ')}`);
    
    // Delete messages from/to deleted users
    for (const user of usersToDelete) {
      console.log(`\n🗑️ Deleting data for: ${user.username}`);
      
      // Delete messages
      const msgResult = await Message.deleteMany({
        $or: [
          { fromUsername: user.username },
          { toUsername: user.username }
        ]
      });
      console.log(`  Deleted ${msgResult.deletedCount} messages`);
      
      // Delete call logs
      const callResult = await CallLog.deleteMany({
        $or: [
          { caller: user.username },
          { callee: user.username }
        ]
      });
      console.log(`  Deleted ${callResult.deletedCount} call logs`);
      
      // Delete groups created by user
      const groupResult = await Group.deleteMany({
        createdBy: user.username
      });
      console.log(`  Deleted ${groupResult.deletedCount} groups`);
      
      // Delete broadcasts created by user
      const broadcastResult = await Broadcast.deleteMany({
        createdBy: user.username
      });
      console.log(`  Deleted ${broadcastResult.deletedCount} broadcasts`);
      
      // Delete the user
      await User.deleteOne({ username: user.username });
      console.log(`  ✅ User deleted: ${user.username}`);
    }
    
    // Remove deleted users from groups
    const deletedUsernames = usersToDelete.map(u => u.username);
    await Group.updateMany(
      {},
      { $pullAll: { members: deletedUsernames, admins: deletedUsernames } }
    );
    console.log('\n✅ Removed deleted users from all groups');
    
    // Remove deleted users from broadcasts
    await Broadcast.updateMany(
      {},
      { $pullAll: { recipients: deletedUsernames } }
    );
    console.log('✅ Removed deleted users from all broadcasts');
    
    // Delete empty groups
    const emptyGroupsResult = await Group.deleteMany({
      members: { $size: 0 }
    });
    console.log(`✅ Deleted ${emptyGroupsResult.deletedCount} empty groups`);
    
    // Show remaining users
    const remainingUsers = await User.find({});
    console.log(`\n📊 Remaining users: ${remainingUsers.map(u => u.username).join(', ')}`);
    
    console.log('\n✅ Cleanup complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

deleteAllUsersExceptUser1();
