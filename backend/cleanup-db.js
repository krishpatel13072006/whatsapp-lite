// Script to clean up database - keep only user1 and user2
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

// Define schemas
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

const messageSchema = new mongoose.Schema({
  from: String,
  to: String,
  fromUsername: String,
  toUsername: String,
  text: String,
  type: String,
  fileUrl: String,
  fileName: String,
  timestamp: Date,
  delivered: Boolean,
  read: Boolean,
  reactions: Array,
  edited: Boolean,
  editedAt: Date,
  deletedForEveryone: Boolean,
  pinned: Boolean,
  pinnedAt: Date,
  pinnedBy: String,
  replyTo: mongoose.Schema.Types.ObjectId,
  starredBy: [String]
});

const groupSchema = new mongoose.Schema({
  name: String,
  description: String,
  profilePicture: String,
  members: [String],
  admins: [String],
  createdBy: String,
  createdAt: Date
});

const groupMessageSchema = new mongoose.Schema({
  groupId: mongoose.Schema.Types.ObjectId,
  fromUsername: String,
  text: String,
  type: String,
  fileUrl: String,
  fileName: String,
  timestamp: Date,
  reactions: Array,
  edited: Boolean,
  editedAt: Date,
  deletedForEveryone: Boolean,
  pinned: Boolean,
  pinnedAt: Date,
  pinnedBy: String,
  replyTo: mongoose.Schema.Types.ObjectId
});

const callLogSchema = new mongoose.Schema({
  caller: String,
  callee: String,
  callType: String,
  status: String,
  duration: Number,
  timestamp: Date,
  videoUrl: String
});

const broadcastSchema = new mongoose.Schema({
  name: String,
  createdBy: String,
  recipients: [String],
  createdAt: Date
});

const scheduledMessageSchema = new mongoose.Schema({
  fromUsername: String,
  toUsername: String,
  text: String,
  type: String,
  fileUrl: String,
  fileName: String,
  scheduledFor: Date,
  status: String,
  createdAt: Date
});

const chatThemeSchema = new mongoose.Schema({
  username: String,
  chatWith: String,
  isGroup: Boolean,
  wallpaper: String,
  bubbleColor: String,
  createdAt: Date
});

const resetCodeSchema = new mongoose.Schema({
  username: String,
  code: String,
  createdAt: Date
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);
const Group = mongoose.model('Group', groupSchema);
const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);
const CallLog = mongoose.model('CallLog', callLogSchema);
const Broadcast = mongoose.model('Broadcast', broadcastSchema);
const ScheduledMessage = mongoose.model('ScheduledMessage', scheduledMessageSchema);
const ChatTheme = mongoose.model('ChatTheme', chatThemeSchema);
const ResetCode = mongoose.model('ResetCode', resetCodeSchema);

async function cleanup() {
  try {
    console.log('\n🧹 Starting database cleanup...\n');
    
    // 1. List all users before cleanup
    const allUsers = await User.find({}, 'username');
    console.log('📋 All users before cleanup:', allUsers.map(u => u.username));
    
    // 2. Keep only user1 and user2
    const keepUsers = ['user1', 'user2'];
    const deleteResult = await User.deleteMany({ 
      username: { $nin: keepUsers } 
    });
    console.log(`🗑️ Deleted ${deleteResult.deletedCount} users`);
    
    // 3. Delete messages not involving user1 or user2
    const messageDeleteResult = await Message.deleteMany({
      $and: [
        { fromUsername: { $nin: keepUsers } },
        { toUsername: { $nin: keepUsers } }
      ]
    });
    console.log(`🗑️ Deleted ${messageDeleteResult.deletedCount} messages`);
    
    // 4. Delete groups not created by user1 or user2 and not containing them
    const groupsToDelete = await Group.find({
      $and: [
        { createdBy: { $nin: keepUsers } },
        { members: { $nin: keepUsers } }
      ]
    });
    const groupIdsToDelete = groupsToDelete.map(g => g._id);
    await GroupMessage.deleteMany({ groupId: { $in: groupIdsToDelete } });
    const groupDeleteResult = await Group.deleteMany({ _id: { $in: groupIdsToDelete } });
    console.log(`🗑️ Deleted ${groupDeleteResult.deletedCount} groups and their messages`);
    
    // 5. Delete call logs not involving user1 or user2
    const callLogDeleteResult = await CallLog.deleteMany({
      $and: [
        { caller: { $nin: keepUsers } },
        { callee: { $nin: keepUsers } }
      ]
    });
    console.log(`🗑️ Deleted ${callLogDeleteResult.deletedCount} call logs`);
    
    // 6. Delete broadcasts not created by user1 or user2
    const broadcastDeleteResult = await Broadcast.deleteMany({
      createdBy: { $nin: keepUsers }
    });
    console.log(`🗑️ Deleted ${broadcastDeleteResult.deletedCount} broadcasts`);
    
    // 7. Delete scheduled messages not involving user1 or user2
    const scheduledDeleteResult = await ScheduledMessage.deleteMany({
      $and: [
        { fromUsername: { $nin: keepUsers } },
        { toUsername: { $nin: keepUsers } }
      ]
    });
    console.log(`🗑️ Deleted ${scheduledDeleteResult.deletedCount} scheduled messages`);
    
    // 8. Delete chat themes not for user1 or user2
    const themeDeleteResult = await ChatTheme.deleteMany({
      username: { $nin: keepUsers }
    });
    console.log(`🗑️ Deleted ${themeDeleteResult.deletedCount} chat themes`);
    
    // 9. Delete all reset codes
    await ResetCode.deleteMany({});
    console.log(`🗑️ Deleted all reset codes`);
    
    // 10. Show remaining users
    const remainingUsers = await User.find({}, 'username displayName email phoneNumber');
    console.log('\n✅ Remaining users:', remainingUsers.map(u => ({
      username: u.username,
      displayName: u.displayName,
      email: u.email,
      phone: u.phoneNumber
    })));
    
    // 11. Show remaining groups
    const remainingGroups = await Group.find({}, 'name members createdBy');
    console.log('\n✅ Remaining groups:', remainingGroups.map(g => ({
      name: g.name,
      members: g.members,
      createdBy: g.createdBy
    })));
    
    console.log('\n✅ Database cleanup completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

cleanup();
