require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const webpush = require('web-push');

// Initialize Web Push
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:' + (process.env.EMAIL_USER || 'test@example.com'),
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.warn('⚠️ Web Push VAPID keys missing in .env — push notifications will not work');
}

const app = express();
app.use(cors({
  origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
  methods: ["GET", "POST", "DELETE"],
  credentials: true
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/stickers', express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "http://127.0.0.1:3000"],
    methods: ["GET", "POST", "DELETE"],
    credentials: true
  }
});

console.log('🔄 Connecting to MongoDB...');
console.log('📍 URI:', process.env.MONGO_URI.substring(0, 60) + '...');

// ===== EMAIL TRANSPORTER =====
const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'krishpatelhacker.13579@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password-here'
  }
});

// Function to send verification code email
const sendVerificationEmail = async (email, code, username) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER || 'krishpatelhacker.13579@gmail.com',
      to: email,
      subject: 'WhatsApp-Lite Password Reset Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #25D366; margin-bottom: 20px;">WhatsApp-Lite Password Reset</h2>
            <p style="color: #333; font-size: 16px;">Hello <strong>${username}</strong>,</p>
            <p style="color: #666; font-size: 14px;">You requested to reset your password. Use the following verification code:</p>
            <div style="background-color: #25D366; color: white; font-size: 32px; font-weight: bold; text-align: center; padding: 20px; border-radius: 8px; margin: 20px 0; letter-spacing: 5px;">
              ${code}
            </div>
            <p style="color: #999; font-size: 12px;">This code will expire in 10 minutes. If you didn't request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px; text-align: center;">© WhatsApp-Lite Team</p>
          </div>
        </div>
      `
    };

    await emailTransporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email: ${error.message}`);
    return false;
  }
};

// ===== MONGODB CONNECTION =====
mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 60000,
  connectTimeoutMS: 30000,
  retryWrites: true,
  w: 'majority',
  maxPoolSize: 10,
  minPoolSize: 2
})
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
  })
  .catch(err => {
    console.error('❌ MongoDB connection failed:', err.message);
    console.error('Please check:');
    console.error('1. IP Whitelist in MongoDB Atlas (should include 0.0.0.0/0)');
    console.error('2. Username and password in .env file');
    console.error('3. Internet connection');
    process.exit(1);
  });

// ===== SCHEMAS =====
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
  notificationSettings: {
    sound: { type: Boolean, default: true },
    pushEnabled: { type: Boolean, default: false },
    muteAll: { type: Boolean, default: false }
  },
  pushSubscription: { type: Object, default: null } // Stores Web Push subscription object
});

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
  audioDuration: { type: Number, default: null }, // for voice messages in seconds
  forwarded: { type: Boolean, default: false } // indicates if message was forwarded
});

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

// Group Chat Schema
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

// Group Message Schema
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
  audioDuration: { type: Number, default: null },
  forwarded: { type: Boolean, default: false } // indicates if message was forwarded
});

// Scheduled Message Schema
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

// Chat Theme Schema
const chatThemeSchema = new mongoose.Schema({
  username: { type: String, required: true },
  chatWith: { type: String, required: true }, // username or group ID
  isGroup: { type: Boolean, default: false },
  wallpaper: { type: String, default: 'default' },
  bubbleColor: { type: String, default: '#005c4b' },
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Message = mongoose.model('Message', messageSchema);
const CallLog = mongoose.model('CallLog', callLogSchema);
const Group = mongoose.model('Group', groupSchema);
const GroupMessage = mongoose.model('GroupMessage', groupMessageSchema);
const ScheduledMessage = mongoose.model('ScheduledMessage', scheduledMessageSchema);
const ChatTheme = mongoose.model('ChatTheme', chatThemeSchema);

// Broadcast List Schema
const broadcastSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdBy: { type: String, required: true },
  recipients: [{ type: String }], // usernames
  createdAt: { type: Date, default: Date.now }
});
const Broadcast = mongoose.model('Broadcast', broadcastSchema);

// Password Reset Code Schema
const resetCodeSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 600 } // Code expires in 10 minutes
});
const ResetCode = mongoose.model('ResetCode', resetCodeSchema);

// Status (Stories) Schema
const statusSchema = new mongoose.Schema({
  username: { type: String, required: true, index: true },
  type: { type: String, enum: ['image', 'video', 'text'], required: true },
  fileUrl: { type: String }, // For image/video status
  text: { type: String }, // For text status
  caption: { type: String }, // Optional caption for image/video
  backgroundColor: { type: String, default: '#25D366' }, // Background color for text status
  textColor: { type: String, default: '#ffffff' },
  viewers: [{ type: String }], // Array of usernames who viewed
  createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-delete after 24 hours
});
const Status = mongoose.model('Status', statusSchema);

// Helper function to get the set of usernames that a user has chatted with
async function getContactSet(username) {
  const from = await Message.distinct('toUsername', { fromUsername: username });
  const to = await Message.distinct('fromUsername', { toUsername: username });
  return new Set([...from, ...to]);
}

// Apply privacy filters to a user object based on requester's perspective
function filterUserObject(requesterUsername, user, contactSet) {
  // Convert Mongoose document to plain object if needed
  const userObj = user.toObject ? user.toObject() : user;

  // If requester is the user, return all fields (including phone/email)
  if (requesterUsername === userObj.username) {
    return userObj;
  }
  const privacy = userObj.privacySettings || {};
  const isContact = contactSet.has(userObj.username);
  // Create a shallow copy to avoid modifying original
  const filtered = { ...userObj };
  // Profile photo
  if (privacy.profilePhoto === 'nobody' || (privacy.profilePhoto === 'contacts' && !isContact)) {
    filtered.profilePicture = null;
  }
  // About
  if (privacy.about === 'nobody' || (privacy.about === 'contacts' && !isContact)) {
    filtered.about = null;
  }
  // Last seen and online status
  if (privacy.lastSeen === 'nobody' || (privacy.lastSeen === 'contacts' && !isContact)) {
    filtered.lastSeen = null;
    filtered.isOnline = false;
  }
  // Phone and email: only for self
  filtered.phoneNumber = null;
  filtered.email = null;
  return filtered;
}

// Multer setup
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// JWT Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: "Access denied" });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
};

// ===== AUTH ROUTES =====

app.post('/api/register', async (req, res) => {
  try {
    const { username, password, email, phoneNumber } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: "Username already exists" });
    }

    // Check if email is already taken
    if (email) {
      const existingEmail = await User.findOne({ email: email.toLowerCase() });
      if (existingEmail) {
        return res.status(400).json({ message: "Email already registered" });
      }
    }

    // Check if phone is already taken
    if (phoneNumber) {
      const existingPhone = await User.findOne({ phoneNumber });
      if (existingPhone) {
        return res.status(400).json({ message: "Phone number already registered" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      username,
      password: hashedPassword,
      displayName: username,
      email: email ? email.toLowerCase() : undefined,
      phoneNumber: phoneNumber || undefined,
      about: 'Hey there! I am using WhatsApp-Lite'
    });

    await newUser.save();
    console.log(`✅ User registered: ${username}${email ? ` (${email})` : ''}${phoneNumber ? ` (${phoneNumber})` : ''}`);
    res.json({ message: "User created!" });
  } catch (error) {
    console.error('Register error:', error.message);
    res.status(500).json({ message: "Error creating user", error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(`🔐 Login attempt: ${username}`);

    const user = await User.findOne({ username });
    if (!user) {
      console.log(`❌ User not found: ${username}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      console.log(`❌ Invalid password for: ${username}`);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '24h' });
    console.log(`✅ Login successful: ${username}`);
    res.json({ token, username: user.username });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

// ===== PASSWORD RESET ROUTES =====

// Generate random 6-digit code
const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Request password reset
app.post('/api/request-password-reset', async (req, res) => {
  try {
    const { identifier } = req.body;

    if (!identifier || !identifier.trim()) {
      return res.status(400).json({ message: "Please provide a username, email, or phone number." });
    }

    const trimmedIdentifier = identifier.trim();

    // Build a dynamic query based on the input type
    let query = {};

    // Check if it's an email (contains @)
    if (trimmedIdentifier.includes('@')) {
      query = { email: trimmedIdentifier.toLowerCase() };
      console.log(`🔍 Searching by email: ${trimmedIdentifier.toLowerCase()}`);
    }
    // Check if it's a phone number (only digits, spaces, dashes, and optional +)
    else if (/^\+?[\d\s-]+$/.test(trimmedIdentifier)) {
      const cleanPhone = trimmedIdentifier.replace(/[\s-]/g, '');
      query = { phoneNumber: cleanPhone };
      console.log(`🔍 Searching by phone: ${cleanPhone}`);
    }
    // Otherwise, assume it's a username
    else {
      query = { username: trimmedIdentifier };
      console.log(`🔍 Searching by username: ${trimmedIdentifier}`);
    }

    // Execute the precise query
    const user = await User.findOne(query);

    if (!user) {
      return res.status(404).json({ message: "No account found with that information." });
    }

    // Generate reset code
    const code = generateResetCode();

    // Delete any existing reset codes for this user
    await ResetCode.deleteMany({ username: user.username });

    // Save new reset code (expires in 10 minutes)
    const resetCodeDoc = new ResetCode({
      username: user.username,
      code,
      createdAt: new Date()
    });
    await resetCodeDoc.save();

    console.log(`🔐 Password reset code for ${user.username}: ${code}`);

    // Send verification email if user has email
    let emailSent = false;
    if (user.email) {
      console.log(`📧 Sending code to email: ${user.email}`);
      emailSent = await sendVerificationEmail(user.email, code, user.username);
    }

    // Log phone (SMS would require Twilio or similar service)
    if (user.phoneNumber) {
      console.log(`📱 SMS would be sent to phone: ${user.phoneNumber} with code: ${code}`);
    }

    res.json({
      message: emailSent ? "Verification code sent to your email" : "Verification code generated",
      username: user.username,
      demoCode: code, // Remove in production
      emailSent: emailSent
    });
  } catch (error) {
    console.error('Password reset request error:', error.message);
    res.status(500).json({ message: "Error sending reset code", error: error.message });
  }
});

// Verify reset code
app.post('/api/verify-reset-code', async (req, res) => {
  try {
    const { username, code } = req.body;

    const resetCode = await ResetCode.findOne({ username, code });

    if (!resetCode) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    res.json({ message: "Code verified" });
  } catch (error) {
    console.error('Verify code error:', error.message);
    res.status(500).json({ message: "Error verifying code", error: error.message });
  }
});

// Reset password
app.post('/api/reset-password', async (req, res) => {
  try {
    const { username, code, newPassword } = req.body;

    // Verify code again
    const resetCode = await ResetCode.findOne({ username, code });

    if (!resetCode) {
      return res.status(400).json({ message: "Invalid or expired code" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await User.updateOne({ username }, { password: hashedPassword });

    // Delete used reset code
    await ResetCode.deleteMany({ username });

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ message: "Error resetting password", error: error.message });
  }
});

// ===== PROFILE ROUTES =====

// Generate QR code for current user
app.get('/api/qr-code', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Create QR data with user info
    const qrData = JSON.stringify({
      type: 'whatsapp-lite-contact',
      username: user.username,
      displayName: user.displayName || user.username,
      timestamp: Date.now()
    });

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#ffffff',
        light: '#1f2c34'
      }
    });

    res.json({
      qrCode: qrCodeDataUrl,
      username: user.username,
      displayName: user.displayName || user.username
    });
  } catch (error) {
    res.status(500).json({ message: "Error generating QR code", error: error.message });
  }
});

// Scan QR code and add contact
app.post('/api/scan-qr', authenticateToken, async (req, res) => {
  try {
    const { qrData } = req.body;

    // Parse QR data
    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch (e) {
      return res.status(400).json({ message: "Invalid QR code format" });
    }

    // Validate QR code type
    if (parsedData.type !== 'whatsapp-lite-contact') {
      return res.status(400).json({ message: "Not a valid WhatsApp-Lite QR code" });
    }

    // Check if user exists
    const targetUser = await User.findOne({ username: parsedData.username });
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Can't add yourself
    if (parsedData.username === req.user.username) {
      return res.status(400).json({ message: "Cannot add yourself as contact" });
    }

    // Get current user
    const currentUser = await User.findOne({ username: req.user.username });

    // Add to contacts if not already there
    if (!currentUser.contacts.includes(parsedData.username)) {
      currentUser.contacts.push(parsedData.username);
      await currentUser.save();
    }

    res.json({
      message: "Contact added successfully",
      contact: {
        username: targetUser.username,
        displayName: targetUser.displayName || targetUser.username,
        profilePicture: targetUser.profilePicture || '',
        about: targetUser.about || ''
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error scanning QR code", error: error.message });
  }
});

app.get('/api/user-settings', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({
      wallpaper: user.wallpaper || 'default',
      email: user.email || '',
      phone: user.phoneNumber || '',
      phoneNumber: user.phoneNumber || '',
      displayName: user.displayName || '',
      about: user.about || 'Hey there! I am using WhatsApp-Lite',
      profilePicture: user.profilePicture || '',
      privacySettings: user.privacySettings
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching settings", error: error.message });
  }
});

app.post('/api/update-profile', authenticateToken, async (req, res) => {
  try {
    const updateData = {};
    if (req.body.displayName !== undefined) updateData.displayName = req.body.displayName;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.phoneNumber !== undefined) updateData.phoneNumber = req.body.phoneNumber;
    if (req.body.about !== undefined) updateData.about = req.body.about;
    if (req.body.profilePicture !== undefined) updateData.profilePicture = req.body.profilePicture;

    const user = await User.findOneAndUpdate(
      { username: req.user.username },
      updateData,
      { new: true }
    );
    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
});

app.post('/api/update-wallpaper', authenticateToken, async (req, res) => {
  try {
    await User.findOneAndUpdate(
      { username: req.user.username },
      { wallpaper: req.body.wallpaper }
    );
    res.json({ message: "Wallpaper updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error updating wallpaper", error: error.message });
  }
});

app.post('/api/upload-profile-picture', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const fileUrl = `${backendUrl}/uploads/${req.file.filename}`;
    const user = await User.findOneAndUpdate(
      { username: req.user.username },
      { profilePicture: fileUrl },
      { new: true }
    );

    // Also update contacts list to reflect new profile picture
    const updatedUser = user.toObject();
    updatedUser.profilePicture = fileUrl;

    res.json({ message: "Profile picture updated successfully", profilePicture: fileUrl, user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Error uploading profile picture", error: error.message });
  }
});

// ===== UPLOAD WALLPAPER (was missing — caused upload failure) =====
app.post('/api/upload-wallpaper', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const wallpaperUrl = `/uploads/${req.file.filename}`;

    // Save the wallpaper path to the user's record
    await User.findOneAndUpdate(
      { username: req.user.username },
      { wallpaper: wallpaperUrl }
    );

    res.json({ message: "Wallpaper uploaded successfully", wallpaperUrl });
  } catch (error) {
    res.status(500).json({ message: "Error uploading wallpaper", error: error.message });
  }
});


// ===== NOTIFICATION SETTINGS =====

app.get('/api/notifications/vapidPublicKey', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

app.post('/api/notifications/subscribe', authenticateToken, async (req, res) => {
  try {
    const subscription = req.body;
    await User.findOneAndUpdate(
      { username: req.user.username },
      { pushSubscription: subscription }
    );
    res.json({ message: "Push subscription saved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error saving subscription", error: error.message });
  }
});

app.post('/api/notifications/settings', authenticateToken, async (req, res) => {
  try {
    const { sound, pushEnabled, muteAll } = req.body;
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.notificationSettings = {
      ...user.notificationSettings,
      ...(sound !== undefined && { sound }),
      ...(pushEnabled !== undefined && { pushEnabled }),
      ...(muteAll !== undefined && { muteAll })
    };

    await user.save();
    res.json({ message: "Notification settings updated", settings: user.notificationSettings });
  } catch (error) {
    res.status(500).json({ message: "Error updating notification settings", error: error.message });
  }
});

app.get('/api/notifications/settings', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Return default settings if none exist
    const settings = user.notificationSettings || {
      sound: true,
      pushEnabled: false,
      muteAll: false
    };

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notification settings", error: error.message });
  }
});

// ===== PRIVACY SETTINGS =====

app.get('/api/privacy-settings', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.privacySettings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching privacy settings", error: error.message });
  }
});

app.post('/api/privacy-settings', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: "User not found" });

    user.privacySettings = { ...user.privacySettings, ...req.body };
    await user.save();
    res.json({ message: "Privacy settings updated successfully", privacySettings: user.privacySettings });
  } catch (error) {
    res.status(500).json({ message: "Error updating privacy settings", error: error.message });
  }
});

// ===== BLOCKED CONTACTS =====

app.get('/api/blocked-contacts', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username })
      .populate('blockedContacts', 'username displayName profilePicture about');

    res.json(user.blockedContacts || []);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blocked contacts", error: error.message });
  }
});

app.post('/api/block-contact', authenticateToken, async (req, res) => {
  try {
    const { contactId, username } = req.body;
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Support both contactId and username for blocking
    let targetId = contactId;
    if (!targetId && username) {
      const contactToBlock = await User.findOne({ username });
      if (contactToBlock) {
        targetId = contactToBlock._id;
      } else {
        return res.status(404).json({ message: "Contact not found" });
      }
    }

    if (targetId && !user.blockedContacts.some(c => c && c.toString() === targetId.toString())) {
      user.blockedContacts.push(targetId);
      await user.save();
    }

    const blockedUsers = await User.find({ _id: { $in: user.blockedContacts || [] } })
      .select('username displayName profilePicture about');

    res.json({ message: "Contact blocked successfully", blockedContacts: blockedUsers });
  } catch (error) {
    res.status(500).json({ message: "Error blocking contact", error: error.message });
  }
});

app.post('/api/unblock-contact', authenticateToken, async (req, res) => {
  try {
    const { contactId, username } = req.body;
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Support both contactId and username for unblocking
    if (contactId) {
      user.blockedContacts = (user.blockedContacts || []).filter(c => c && c.toString() !== contactId);
    } else if (username) {
      // Find the user to get their ID
      const contactToUnblock = await User.findOne({ username });
      if (contactToUnblock) {
        const contactIdStr = contactToUnblock._id.toString();
        user.blockedContacts = (user.blockedContacts || []).filter(c => c && c.toString() !== contactIdStr);
      }
    }

    await user.save();

    const blockedUsers = await User.find({ _id: { $in: user.blockedContacts || [] } })
      .select('username displayName profilePicture about');

    res.json({ message: "Contact unblocked successfully", blockedContacts: blockedUsers });
  } catch (error) {
    res.status(500).json({ message: "Error unblocking contact", error: error.message });
  }
});

// ===== PUBLIC PROFILE =====

app.get('/api/user-public-profile/:username', authenticateToken, async (req, res) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username });
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    // Get contact set for the requester
    const contactSet = await getContactSet(req.user.username);

    // Apply privacy filters
    const filteredUser = filterUserObject(req.user.username, targetUser, contactSet);

    const publicProfile = {
      _id: filteredUser._id?.toString() || filteredUser._id,
      username: filteredUser.username,
      displayName: filteredUser.displayName || filteredUser.username,
      profilePicture: filteredUser.profilePicture,
      about: filteredUser.about,
      isOnline: filteredUser.isOnline || false,
      lastSeen: filteredUser.lastSeen,
      phoneNumber: filteredUser.phoneNumber,
      email: filteredUser.email
    };

    res.json(publicProfile);
  } catch (error) {
    res.status(500).json({ message: "Error fetching public profile", error: error.message });
  }
});

// ===== CHECK IF USER EXISTS =====
app.get('/api/check-user/:username', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('username displayName profilePicture about isOnline lastSeen privacySettings');

    if (!user) {
      return res.json({ exists: false, message: "User not found" });
    }

    // Get contact set for the requester
    const contactSet = await getContactSet(req.user.username);

    // Apply privacy filters
    const filtered = filterUserObject(req.user.username, user, contactSet);

    res.json({
      exists: true,
      user: {
        _id: filtered._id,
        username: filtered.username,
        displayName: filtered.displayName || filtered.username,
        profilePicture: filtered.profilePicture,
        about: filtered.about,
        isOnline: filtered.isOnline,
        lastSeen: filtered.lastSeen
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Error checking user", error: error.message });
  }
});

// ===== GET ALL USERS =====

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;
    const users = await User.find({ username: { $ne: currentUsername } })
      .select('username displayName profilePicture about isOnline lastSeen privacySettings')
      .sort({ username: 1 });

    // Get contact set for the requester
    const contactSet = await getContactSet(currentUsername);

    // Apply privacy filters to each user and ensure plain objects
    const filteredUsers = users.map(user => {
      const filtered = filterUserObject(currentUsername, user, contactSet);
      // Ensure we have a plain object with all required fields
      return {
        _id: filtered._id,
        username: filtered.username,
        displayName: filtered.displayName || filtered.username,
        profilePicture: filtered.profilePicture,
        about: filtered.about,
        isOnline: filtered.isOnline,
        lastSeen: filtered.lastSeen
      };
    });

    res.json(filteredUsers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
});

app.get('/api/all-users', authenticateToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;
    const searchQuery = req.query.search || '';

    const query = { username: { $ne: currentUsername } };
    if (searchQuery) {
      query.$or = [
        { username: { $regex: searchQuery, $options: 'i' } },
        { displayName: { $regex: searchQuery, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('username displayName profilePicture about isOnline lastSeen privacySettings')
      .limit(50);

    // Get contact set for the requester
    const contactSet = await getContactSet(currentUsername);

    // Apply privacy filters to each user and ensure plain objects
    const filteredUsers = users.map(user => {
      const filtered = filterUserObject(currentUsername, user, contactSet);
      return {
        _id: filtered._id,
        username: filtered.username,
        displayName: filtered.displayName || filtered.username,
        profilePicture: filtered.profilePicture,
        about: filtered.about,
        isOnline: filtered.isOnline,
        lastSeen: filtered.lastSeen
      };
    });

    res.json(filteredUsers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
});

// ===== GET RECENT CHATS =====

app.get('/api/recent-chats', authenticateToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;
    console.log(`📋 Fetching recent chats for ${currentUsername}`);

    // Get all unique users this user has chatted with
    const messages = await Message.find({
      $or: [
        { fromUsername: currentUsername },
        { toUsername: currentUsername }
      ]
    }).select('fromUsername toUsername').sort({ timestamp: -1 });

    console.log(`📨 Found ${messages.length} messages`);

    const uniqueUsers = new Set();
    messages.forEach(msg => {
      // Only add the OTHER user, not the current user
      if (msg.fromUsername === currentUsername && msg.toUsername !== currentUsername) {
        uniqueUsers.add(msg.toUsername);
      } else if (msg.toUsername === currentUsername && msg.fromUsername !== currentUsername) {
        uniqueUsers.add(msg.fromUsername);
      }
    });

    console.log(`👥 Unique users: ${uniqueUsers.size}`, Array.from(uniqueUsers));

    // Get user details for each unique user (excluding current user)
    const usernames = Array.from(uniqueUsers).filter(u => u !== currentUsername);
    const users = await User.find({ username: { $in: usernames } })
      .select('username displayName profilePicture about isOnline lastSeen privacySettings');

    // Get contact set for the requester (though these are contacts, still need for privacy checks)
    const contactSet = await getContactSet(currentUsername);

    // Apply privacy filters to each user and ensure plain objects
    const filteredUsers = users.map(user => {
      const filtered = filterUserObject(currentUsername, user, contactSet);
      return {
        _id: filtered._id,
        username: filtered.username,
        displayName: filtered.displayName || filtered.username,
        profilePicture: filtered.profilePicture,
        about: filtered.about,
        isOnline: filtered.isOnline,
        lastSeen: filtered.lastSeen
      };
    });

    console.log(`✅ Returning ${filteredUsers.length} recent chats`);
    res.json(filteredUsers);
  } catch (error) {
    console.error('❌ Error fetching recent chats:', error.message);
    res.status(500).json({ message: "Error fetching recent chats", error: error.message });
  }
});

// ===== GET UNREAD MESSAGE COUNTS =====
app.get('/api/unread-counts', authenticateToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;

    // Aggregate unread message counts grouped by sender
    const unreadCounts = await Message.aggregate([
      {
        $match: {
          toUsername: currentUsername,
          read: false,
          deletedForEveryone: false
        }
      },
      {
        $group: {
          _id: '$fromUsername',
          count: { $sum: 1 }
        }
      }
    ]);

    // Convert to object format { username: count }
    const countsMap = {};
    unreadCounts.forEach(item => {
      countsMap[item._id] = item.count;
    });

    res.json(countsMap);
  } catch (error) {
    console.error('❌ Error fetching unread counts:', error.message);
    res.status(500).json({ message: "Error fetching unread counts", error: error.message });
  }
});

// ===== GET ALL MESSAGES =====

app.get('/api/all-messages', authenticateToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;

    const messages = await Message.find({
      $or: [
        { fromUsername: currentUsername },
        { toUsername: currentUsername }
      ],
      deletedForEveryone: false
    }).sort({ timestamp: 1 }).limit(1000).populate('replyTo');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error: error.message });
  }
});

// ===== MESSAGES =====

app.post('/api/save-message', authenticateToken, async (req, res) => {
  try {
    const { toUsername, text, type, fileUrl, fileName, forwarded } = req.body;
    const fromUsername = req.user.username;

    const message = new Message({
      from: req.user.userId,
      to: toUsername,
      fromUsername,
      toUsername,
      text,
      type: type || 'text',
      fileUrl,
      fileName,
      forwarded: forwarded || false,
      starredBy: []
    });

    await message.save();
    res.json({ message: "Message saved", messageId: message._id, _id: message._id });
  } catch (error) {
    res.status(500).json({ message: "Error saving message", error: error.message });
  }
});

// Get starred messages — MUST be before /api/messages/:otherUsername
app.get('/api/messages/starred', authenticateToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;

    // Find individual messages where the current user has starred them
    const individualMessages = await Message.find({
      starredBy: { $in: [currentUsername] },
      deletedForEveryone: false
    }).sort({ timestamp: -1 }).populate('replyTo');

    // Find user's groups
    const userGroups = await Group.find({ members: currentUsername }).select('_id');
    const groupIds = userGroups.map(g => g._id);

    // Find group messages where the current user has starred them
    const groupMessagesRaw = await GroupMessage.find({
      groupId: { $in: groupIds },
      starredBy: { $in: [currentUsername] },
      deletedForEveryone: false
    }).sort({ timestamp: -1 }).populate('groupId', 'name').populate('replyTo');

    const groupMessages = groupMessagesRaw.map(msg => ({
      ...msg.toObject(),
      isGroup: true,
    }));

    const combinedResults = [...individualMessages, ...groupMessages];
    combinedResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    res.json(combinedResults);
  } catch (error) {
    console.error('Error fetching starred messages:', error);
    res.status(500).json({ message: "Error fetching starred messages", error: error.message });
  }
});

// Search messages — MUST be before /api/messages/:otherUsername
app.get('/api/messages/search', authenticateToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;
    const searchQuery = req.query.q || '';

    if (!searchQuery.trim()) {
      return res.json([]);
    }

    const individualMessages = await Message.find({
      $or: [
        { fromUsername: currentUsername, text: { $regex: searchQuery, $options: 'i' } },
        { toUsername: currentUsername, text: { $regex: searchQuery, $options: 'i' } }
      ],
      deletedForEveryone: false
    }).populate('replyTo');

    const userGroups = await Group.find({ members: currentUsername }).select('_id');
    const groupIds = userGroups.map(g => g._id);

    const groupMessagesRaw = await GroupMessage.find({
      groupId: { $in: groupIds },
      text: { $regex: searchQuery, $options: 'i' },
      deletedForEveryone: false
    }).populate('groupId', 'name').populate('replyTo');

    const groupMessages = groupMessagesRaw.map(msg => ({
      ...msg.toObject(),
      isGroup: true,
    }));

    const combinedResults = [...individualMessages, ...groupMessages];
    combinedResults.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const finalResults = combinedResults.slice(0, 50);

    res.json(finalResults);
  } catch (error) {
    res.status(500).json({ message: "Error searching messages", error: error.message });
  }
});

// Get pinned messages for a specific chat — MUST be before /api/messages/:otherUsername
app.get('/api/messages/pinned/:chatWith', authenticateToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;
    const chatWith = req.params.chatWith;

    const messages = await Message.find({
      $or: [
        { fromUsername: currentUsername, toUsername: chatWith },
        { fromUsername: chatWith, toUsername: currentUsername }
      ],
      pinned: true,
      deletedForEveryone: false
    }).sort({ pinnedAt: -1 }).populate('replyTo');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pinned messages", error: error.message });
  }
});

// Fetch messages for a specific chat (dynamic param — must be LAST of all /api/messages/ GET routes)
app.get('/api/messages/:otherUsername', authenticateToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;
    const otherUsername = req.params.otherUsername;

    const messages = await Message.find({
      $or: [
        { fromUsername: currentUsername, toUsername: otherUsername },
        { fromUsername: otherUsername, toUsername: currentUsername }
      ],
      deletedForEveryone: false
    }).sort({ timestamp: 1 }).populate('replyTo');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error: error.message });
  }
});

// Star/unstar a message
app.put('/api/messages/:messageId/star', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    const username = req.user.username;

    if (!message) return res.status(404).json({ message: "Message not found" });

    // Initialize starredBy array if it doesn't exist
    if (!message.starredBy) {
      message.starredBy = [];
    }

    // Check if user already starred this message
    const userStarredIndex = message.starredBy.indexOf(username);

    if (userStarredIndex === -1) {
      // User hasn't starred, add them
      message.starredBy.push(username);
    } else {
      // User already starred, remove them
      message.starredBy.splice(userStarredIndex, 1);
    }

    await message.save();

    // Return whether this user has starred the message
    const isStarred = message.starredBy.includes(username);
    res.json({ success: true, starred: isStarred, starredBy: message.starredBy });
  } catch (error) {
    res.status(500).json({ message: "Error starring message", error: error.message });
  }
});

// Star/unstar a group message
app.put('/api/group-message/:messageId/star', authenticateToken, async (req, res) => {
  try {
    const message = await GroupMessage.findById(req.params.messageId);
    const username = req.user.username;

    if (!message) return res.status(404).json({ message: "Group message not found" });

    // Initialize starredBy array if it doesn't exist
    if (!message.starredBy) {
      message.starredBy = [];
    }

    // Check if user already starred this message
    const userStarredIndex = message.starredBy.indexOf(username);

    if (userStarredIndex === -1) {
      // User hasn't starred, add them
      message.starredBy.push(username);
    } else {
      // User already starred, remove them
      message.starredBy.splice(userStarredIndex, 1);
    }

    await message.save();

    // Return whether this user has starred the message
    const isStarred = message.starredBy.includes(username);
    res.json({ success: true, starred: isStarred, starredBy: message.starredBy });
  } catch (error) {
    res.status(500).json({ message: "Error starring group message", error: error.message });
  }
});


// (Starred messages route moved above /api/messages/:otherUsername to fix route ordering)

// Delete message for everyone (individual chat)
app.delete('/api/messages/:messageId', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Only allow sender to delete
    if (message.fromUsername !== req.user.username) {
      return res.status(403).json({ message: "Not authorized" });
    }

    message.deletedForEveryone = true;
    await message.save();

    res.json({ success: true, message: "Message deleted for everyone" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting message", error: error.message });
  }
});

// Pin/unpin a message
app.post('/api/message/:messageId/pin', authenticateToken, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Verify authorized user
    if (message.fromUsername !== req.user.username && message.toUsername !== req.user.username) {
      return res.status(403).json({ message: "Not authorized" });
    }

    message.pinned = !message.pinned;
    if (message.pinned) {
      message.pinnedAt = new Date();
      message.pinnedBy = req.user.username;
    } else {
      message.pinnedAt = null;
      message.pinnedBy = null;
    }

    await message.save();
    res.json({ success: true, pinned: message.pinned });
  } catch (error) {
    res.status(500).json({ message: "Error pinning message", error: error.message });
  }
});

// Pin/unpin a group message
app.post('/api/group-message/:messageId/pin', authenticateToken, async (req, res) => {
  try {
    const message = await GroupMessage.findById(req.params.messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    message.pinned = !message.pinned;
    if (message.pinned) {
      message.pinnedAt = new Date();
      message.pinnedBy = req.user.username;
    } else {
      message.pinnedAt = null;
      message.pinnedBy = null;
    }

    await message.save();
    res.json({ success: true, pinned: message.pinned });
  } catch (error) {
    res.status(500).json({ message: "Error pinning group message", error: error.message });
  }
});

// Get pinned messages for a specific chat
app.get('/api/messages/pinned/:chatWith', authenticateToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;
    const chatWith = req.params.chatWith;

    const messages = await Message.find({
      $or: [
        { fromUsername: currentUsername, toUsername: chatWith },
        { fromUsername: chatWith, toUsername: currentUsername }
      ],
      pinned: true,
      deletedForEveryone: false
    }).sort({ pinnedAt: -1 }).populate('replyTo');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pinned messages", error: error.message });
  }
});

// Get pinned group messages
app.get('/api/group-messages/pinned/:groupId', authenticateToken, async (req, res) => {
  try {
    const groupId = req.params.groupId;

    const messages = await GroupMessage.find({
      groupId,
      pinned: true,
      deletedForEveryone: false
    }).sort({ pinnedAt: -1 }).populate('replyTo');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching pinned group messages", error: error.message });
  }
});

// (Search messages route moved above /api/messages/:otherUsername to fix route ordering)

// ===== FILE UPLOAD =====

app.post('/api/upload-file', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const fileUrl = `http://localhost:5000/uploads/${req.file.filename}`;
    const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'file';

    res.json({ fileUrl, fileName: req.file.originalname, fileType });
  } catch (error) {
    res.status(500).json({ message: "Error uploading file", error: error.message });
  }
});

// ===== GET ALL REGISTERED USERS (for Block Users feature) =====
app.get('/api/all-users', authenticateToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;
    const users = await User.find({ username: { $ne: currentUsername } })
      .select('username displayName profilePicture');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
});

// ===== DISAPPEARING MESSAGES =====

// Set disappearing messages duration for a chat
app.post('/api/disappearing-messages', authenticateToken, async (req, res) => {
  try {
    const { chatWith, duration, isGroup } = req.body; // duration in seconds, 0 = off
    const currentUsername = req.user.username;

    await User.findOneAndUpdate(
      { username: currentUsername },
      { $set: { [`disappearingSettings.${chatWith}`]: duration } }
    );

    res.json({ success: true, chatWith, duration });
  } catch (error) {
    res.status(500).json({ message: "Error setting disappearing messages", error: error.message });
  }
});

// Get disappearing message setting for a chat
app.get('/api/disappearing-messages/:chatWith', authenticateToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;
    const { chatWith } = req.params;
    const user = await User.findOne({ username: currentUsername }).select('disappearingSettings');
    const duration = user?.disappearingSettings?.get(chatWith) || 0;
    res.json({ chatWith, duration });
  } catch (error) {
    res.status(500).json({ message: "Error getting disappearing messages setting", error: error.message });
  }
});

// ===== CALL LOGS =====

app.post('/api/save-call', authenticateToken, upload.single('video'), async (req, res) => {
  try {
    const callLog = new CallLog({
      caller: req.user.userId,
      callerUsername: req.user.username,
      receiver: req.body.receiver,
      receiverUsername: req.body.receiverUsername,
      callType: req.body.callType || 'video',
      duration: req.body.duration || 0,
      recordingUrl: req.file ? `uploads/${req.file.filename}` : null,
      status: req.body.status || 'completed'
    });

    await callLog.save();
    console.log(`✅ Call logged: ${req.user.username} → ${req.body.receiverUsername}`);
    res.json({ success: true, callLogId: callLog._id });
  } catch (error) {
    console.error('Error saving call:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/call-logs', authenticateToken, async (req, res) => {
  try {
    const logs = await CallLog.find({
      $or: [
        { callerUsername: req.user.username },
        { receiverUsername: req.user.username }
      ]
    }).sort({ timestamp: -1 }).limit(50);

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/call-logs/:id', authenticateToken, async (req, res) => {
  try {
    const log = await CallLog.findById(req.params.id);
    if (!log) return res.status(404).json({ message: "Call log not found" });

    // Delete recording file if exists
    if (log.recordingUrl) {
      const filePath = path.join(__dirname, log.recordingUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await CallLog.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Call log deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting call log" });
  }
});

// ===== DELETE USER ACCOUNT =====
app.delete('/api/delete-account', authenticateToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;
    const currentUserId = req.user.userId;

    console.log(`🗑️ Deleting account for user: ${currentUsername} (ID: ${currentUserId})`);

    // Delete all messages sent or received by the user
    const msgResult = await Message.deleteMany({
      $or: [
        { fromUsername: currentUsername },
        { toUsername: currentUsername }
      ]
    });
    console.log(`Deleted ${msgResult.deletedCount} messages`);

    // Delete all group messages from the user
    const groupMsgResult = await GroupMessage.deleteMany({
      fromUsername: currentUsername
    });
    console.log(`Deleted ${groupMsgResult.deletedCount} group messages`);

    // Delete all call logs
    const callResult = await CallLog.deleteMany({
      $or: [
        { callerUsername: currentUsername },
        { receiverUsername: currentUsername }
      ]
    });
    console.log(`Deleted ${callResult.deletedCount} call logs`);

    // Remove user from all groups (members and admins arrays)
    const removeFromGroupsResult = await Group.updateMany(
      {},
      {
        $pull: {
          members: currentUsername,
          admins: currentUsername
        }
      }
    );
    console.log(`Removed user from ${removeFromGroupsResult.modifiedCount} groups`);

    // Delete groups where user was the creator and is now empty
    const emptyGroupsResult = await Group.deleteMany({
      createdBy: currentUsername,
      members: { $size: 0 }
    });
    console.log(`Deleted ${emptyGroupsResult.deletedCount} empty groups created by user`);

    // Delete all broadcasts created by the user
    const broadcastResult = await Broadcast.deleteMany({
      createdBy: currentUsername
    });
    console.log(`Deleted ${broadcastResult.deletedCount} broadcasts`);

    // Remove user from all broadcast recipients
    const removeFromBroadcastsResult = await Broadcast.updateMany(
      {},
      { $pull: { recipients: currentUsername } }
    );
    console.log(`Removed user from ${removeFromBroadcastsResult.modifiedCount} broadcasts`);

    // Delete scheduled messages from the user
    const scheduledResult = await ScheduledMessage.deleteMany({
      fromUsername: currentUsername
    });
    console.log(`Deleted ${scheduledResult.deletedCount} scheduled messages`);

    // Delete chat themes for the user
    const themeResult = await ChatTheme.deleteMany({
      username: currentUsername
    });
    console.log(`Deleted ${themeResult.deletedCount} chat themes`);

    // Delete profile picture file if exists
    const user = await User.findOne({ username: currentUsername });
    if (user && user.profilePicture) {
      try {
        const filename = user.profilePicture.split('/').pop();
        const filePath = path.join(__dirname, 'uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Deleted profile picture: ${filename}`);
        }
      } catch (fileErr) {
        console.log('Could not delete profile picture file:', fileErr.message);
      }
    }

    // Delete the user account - try both methods
    let deleteResult = null;
    if (currentUserId) {
      deleteResult = await User.findByIdAndDelete(currentUserId);
    }
    if (!deleteResult) {
      deleteResult = await User.findOneAndDelete({ username: currentUsername });
    }

    if (deleteResult) {
      console.log(`✅ Account deleted successfully: ${currentUsername}`);
      res.json({ success: true, message: "Account deleted successfully" });
    } else {
      console.log(`⚠️ User not found for deletion: ${currentUsername}`);
      res.status(404).json({ message: "User not found" });
    }
  } catch (error) {
    console.error('❌ Error deleting account:', error.message);
    res.status(500).json({ message: "Error deleting account", error: error.message });
  }
});

// ===== STATUS (STORIES) ROUTES =====

// Create a new status
app.post('/api/status', authenticateToken, upload.single('file'), async (req, res) => {
  console.log('=== STATUS UPLOAD REQUEST ===');
  console.log('Body:', req.body);
  console.log('File:', req.file ? req.file.originalname : 'No file');
  console.log('User:', req.user?.username);

  try {
    const { type, text, caption, backgroundColor, textColor } = req.body;
    const username = req.user.username;

    if (!type || !['image', 'video', 'text'].includes(type)) {
      console.log('Invalid type:', type);
      return res.status(400).json({ message: "Invalid status type" });
    }

    if (type === 'text' && !text) {
      return res.status(400).json({ message: "Text is required for text status" });
    }

    if ((type === 'image' || type === 'video') && !req.file) {
      return res.status(400).json({ message: "File is required for image/video status" });
    }

    const status = new Status({
      username,
      type,
      fileUrl: req.file ? `/uploads/${req.file.filename}` : null,
      text: text || null,
      caption: caption || null,
      backgroundColor: backgroundColor || '#25D366',
      textColor: textColor || '#ffffff'
    });

    console.log('Saving status:', status);
    await status.save();
    console.log('Status saved successfully:', status._id);

    // Get user info for response
    const user = await User.findOne({ username });

    console.log('Sending response...');
    res.status(201).json({
      message: "Status created successfully",
      status: {
        _id: status._id,
        type: status.type,
        fileUrl: status.fileUrl,
        text: status.text,
        caption: status.caption,
        backgroundColor: status.backgroundColor,
        textColor: status.textColor,
        createdAt: status.createdAt,
        username: status.username,
        displayName: user?.displayName || username,
        profilePicture: user?.profilePicture || null
      }
    });
    console.log('Response sent!');
  } catch (error) {
    console.error('ERROR creating status:', error);
    res.status(500).json({ message: "Error creating status", error: error.message });
  }
});

// Get all statuses (from contacts and self)
app.get('/api/status', authenticateToken, async (req, res) => {
  console.log('=== FETCH STATUSES ===');
  try {
    const username = req.user.username;
    console.log('Fetching statuses for:', username);

    // Get user's contacts
    const user = await User.findOne({ username });
    const contacts = user?.contacts || [];
    console.log('User contacts:', contacts);

    // Get statuses from the last 24 hours from self and contacts
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const statuses = await Status.find({
      username: { $in: [username, ...contacts] },
      createdAt: { $gte: twentyFourHoursAgo }
    }).sort({ createdAt: -1 });

    console.log('Found statuses:', statuses.length);

    // Group statuses by username
    const groupedStatuses = {};
    for (const status of statuses) {
      if (!groupedStatuses[status.username]) {
        const statusUser = await User.findOne({ username: status.username });
        groupedStatuses[status.username] = {
          username: status.username,
          displayName: statusUser?.displayName || status.username,
          profilePicture: statusUser?.profilePicture || null,
          statuses: []
        };
      }
      groupedStatuses[status.username].statuses.push({
        _id: status._id,
        type: status.type,
        fileUrl: status.fileUrl,
        text: status.text,
        caption: status.caption,
        backgroundColor: status.backgroundColor,
        textColor: status.textColor,
        viewers: status.viewers,
        createdAt: status.createdAt
      });
    }

    // Convert to array and put user's statuses first
    const result = Object.values(groupedStatuses).sort((a, b) => {
      if (a.username === username) return -1;
      if (b.username === username) return 1;
      return 0;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Error fetching statuses", error: error.message });
  }
});

// View a status (mark as viewed)
app.post('/api/status/:statusId/view', authenticateToken, async (req, res) => {
  try {
    const { statusId } = req.params;
    const username = req.user.username;

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    // Add viewer if not already viewed
    if (!status.viewers.includes(username)) {
      status.viewers.push(username);
      await status.save();
    }

    res.json({ message: "Status marked as viewed", viewers: status.viewers });
  } catch (error) {
    res.status(500).json({ message: "Error viewing status", error: error.message });
  }
});

// Delete a status
app.delete('/api/status/:statusId', authenticateToken, async (req, res) => {
  try {
    const { statusId } = req.params;
    const username = req.user.username;

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    // Only allow deleting own status
    if (status.username !== username) {
      return res.status(403).json({ message: "Not authorized to delete this status" });
    }

    // Delete file if exists
    if (status.fileUrl) {
      try {
        const filename = status.fileUrl.split('/').pop();
        const filePath = path.join(__dirname, 'uploads', filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (fileErr) {
        console.log('Could not delete status file:', fileErr.message);
      }
    }

    await Status.findByIdAndDelete(statusId);

    res.json({ message: "Status deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting status", error: error.message });
  }
});

// Get viewers of a status
app.get('/api/status/:statusId/viewers', authenticateToken, async (req, res) => {
  try {
    const { statusId } = req.params;
    const username = req.user.username;

    const status = await Status.findById(statusId);
    if (!status) {
      return res.status(404).json({ message: "Status not found" });
    }

    // Only allow owner to see viewers
    if (status.username !== username) {
      return res.status(403).json({ message: "Not authorized to view this" });
    }

    // Get viewer details
    const viewers = [];
    for (const viewerUsername of status.viewers) {
      const viewer = await User.findOne({ username: viewerUsername });
      viewers.push({
        username: viewerUsername,
        displayName: viewer?.displayName || viewerUsername,
        profilePicture: viewer?.profilePicture || null
      });
    }

    res.json(viewers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching viewers", error: error.message });
  }
});

// ===== CLEAR CHAT =====
app.delete('/api/clear-chat/:otherUsername', authenticateToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;
    const otherUsername = req.params.otherUsername;

    console.log(`🗑️ Clearing chat between ${currentUsername} and ${otherUsername}`);

    // Mark messages as deleted for this user (soft delete)
    await Message.updateMany(
      {
        $or: [
          { fromUsername: currentUsername, toUsername: otherUsername },
          { fromUsername: otherUsername, toUsername: currentUsername }
        ]
      },
      { $addToSet: { deletedFor: currentUsername } }
    );

    console.log(`✅ Chat cleared successfully`);
    res.json({ success: true, message: "Chat cleared successfully" });
  } catch (error) {
    console.error('❌ Error clearing chat:', error.message);
    res.status(500).json({ message: "Error clearing chat", error: error.message });
  }
});

// ===== UPLOAD WALLPAPER =====
app.post('/api/upload-wallpaper', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    // Update user's wallpaper in database
    await User.findOneAndUpdate(
      { username: req.user.username },
      { wallpaper: fileUrl }
    );

    res.json({ message: "Wallpaper updated successfully", wallpaperUrl: fileUrl });
  } catch (error) {
    res.status(500).json({ message: "Error uploading wallpaper", error: error.message });
  }
});

// ===== GROUP CHAT ROUTES =====

// Create a new group
app.post('/api/groups/create', authenticateToken, async (req, res) => {
  try {
    const { name, description, members, profilePicture } = req.body;
    const createdBy = req.user.username;

    const group = new Group({
      name,
      description: description || '',
      profilePicture: profilePicture || '',
      createdBy,
      admins: [createdBy],
      members: [...new Set([createdBy, ...members])] // Ensure creator is included and no duplicates
    });

    await group.save();
    console.log(`✅ Group created: ${name} by ${createdBy}`);

    // Convert to plain object for response
    const groupObj = group.toObject();

    // Notify all members about the new group via socket
    for (const memberUsername of group.members) {
      const memberSocketId = connectedUsers.get(memberUsername);
      if (memberSocketId) {
        io.to(memberSocketId).emit("group_created", groupObj);
        console.log(`📢 Notified ${memberUsername} about new group: ${name}`);
      }
    }

    res.json({ success: true, group: groupObj });
  } catch (error) {
    console.error('❌ Error creating group:', error.message);
    res.status(500).json({ message: "Error creating group", error: error.message });
  }
});

// Get all groups for current user
app.get('/api/groups', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    console.log(`📋 Fetching groups for user: ${username}`);
    const groups = await Group.find({ members: username });
    console.log(`✅ Found ${groups.length} groups for ${username}:`, groups.map(g => g.name));
    // Convert to plain objects
    const groupsObj = groups.map(g => g.toObject());
    res.json(groupsObj);
  } catch (error) {
    console.error('❌ Error fetching groups:', error.message);
    res.status(500).json({ message: "Error fetching groups", error: error.message });
  }
});

// Get group details
app.get('/api/groups/:groupId', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Get member details
    const members = await User.find({ username: { $in: group.members } })
      .select('username displayName profilePicture about');

    res.json({ ...group.toObject(), memberDetails: members });
  } catch (error) {
    res.status(500).json({ message: "Error fetching group", error: error.message });
  }
});

// Add member to group
app.post('/api/groups/:groupId/add-member', authenticateToken, async (req, res) => {
  try {
    const { username: newMember } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.admins.includes(req.user.username)) {
      return res.status(403).json({ message: "Only admins can add members" });
    }

    if (!group.members.includes(newMember)) {
      group.members.push(newMember);
      await group.save();
    }

    res.json({ success: true, group: group.toObject() });
  } catch (error) {
    res.status(500).json({ message: "Error adding member", error: error.message });
  }
});

// Remove member from group
app.post('/api/groups/:groupId/remove-member', authenticateToken, async (req, res) => {
  try {
    const { username: memberToRemove } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.admins.includes(req.user.username)) {
      return res.status(403).json({ message: "Only admins can remove members" });
    }

    group.members = group.members.filter(m => m !== memberToRemove);
    group.admins = group.admins.filter(a => a !== memberToRemove);
    await group.save();

    res.json({ success: true, group: group.toObject() });
  } catch (error) {
    res.status(500).json({ message: "Error removing member", error: error.message });
  }
});

// Leave group
app.post('/api/groups/:groupId/leave', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    group.members = group.members.filter(m => m !== req.user.username);
    group.admins = group.admins.filter(a => a !== req.user.username);

    // Delete group if no members left
    if (group.members.length === 0) {
      await Group.findByIdAndDelete(req.params.groupId);
      await GroupMessage.deleteMany({ groupId: req.params.groupId });
    } else {
      // If creator left, assign new admin
      if (group.createdBy === req.user.username && group.admins.length === 0) {
        group.admins = [group.members[0]];
      }
      await group.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "Error leaving group", error: error.message });
  }
});

// Update group settings (admin only)
app.put('/api/groups/:groupId/settings', authenticateToken, async (req, res) => {
  try {
    const { name, description, profilePicture, theme } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.admins.includes(req.user.username)) {
      return res.status(403).json({ message: "Only admins can update group settings" });
    }

    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (profilePicture) group.profilePicture = profilePicture;
    if (theme) group.theme = theme;

    await group.save();

    // Convert to plain object
    const groupObj = group.toObject();

    // Notify all members about the update
    for (const memberUsername of group.members) {
      const memberSocketId = connectedUsers.get(memberUsername);
      if (memberSocketId) {
        io.to(memberSocketId).emit("group_updated", groupObj);
      }
    }

    res.json({ success: true, group: groupObj });
  } catch (error) {
    res.status(500).json({ message: "Error updating group", error: error.message });
  }
});

// Save group message
app.post('/api/groups/:groupId/messages', authenticateToken, async (req, res) => {
  try {
    const { text, type, fileUrl, fileName, forwarded } = req.body;
    const group = await Group.findById(req.params.groupId);

    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.members.includes(req.user.username)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const message = new GroupMessage({
      groupId: req.params.groupId,
      fromUsername: req.user.username,
      text,
      type: type || 'text',
      fileUrl,
      fileName,
      forwarded: forwarded || false
    });

    await message.save();
    res.json({ success: true, messageId: message._id, _id: message._id });
  } catch (error) {
    res.status(500).json({ message: "Error saving message", error: error.message });
  }
});

// Get group messages
app.get('/api/groups/:groupId/messages', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });
    if (!group.members.includes(req.user.username)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    const messages = await GroupMessage.find({
      groupId: req.params.groupId,
      deletedForEveryone: false
    }).sort({ timestamp: 1 }).populate('replyTo');

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages", error: error.message });
  }
});

// Delete group message (for everyone)
app.delete('/api/groups/:groupId/messages/:messageId', authenticateToken, async (req, res) => {
  try {
    const { groupId, messageId } = req.params;
    const group = await Group.findById(groupId);

    if (!group) return res.status(404).json({ message: "Group not found" });

    const message = await GroupMessage.findById(messageId);
    if (!message) return res.status(404).json({ message: "Message not found" });

    // Only allow message sender to delete
    if (message.fromUsername !== req.user.username) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    // Mark as deleted for everyone
    message.deletedForEveryone = true;
    await message.save();

    res.json({ success: true, message: "Message deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting message", error: error.message });
  }
});

// Delete group (admin only)
app.delete('/api/groups/:groupId', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) return res.status(404).json({ message: "Group not found" });

    // Only allow admins to delete the group
    if (!group.admins.includes(req.user.username)) {
      return res.status(403).json({ message: "Only admins can delete the group" });
    }

    const groupId = req.params.groupId;
    const groupName = group.name;

    // Notify all members about the group deletion via socket
    for (const memberUsername of group.members) {
      const memberSocketId = connectedUsers.get(memberUsername);
      if (memberSocketId) {
        io.to(memberSocketId).emit("group_deleted", { groupId, groupName });
        console.log(`📢 Notified ${memberUsername} about group deletion: ${groupName}`);
      }
    }

    // Delete all group messages
    await GroupMessage.deleteMany({ groupId: groupId });

    // Delete the group
    await Group.findByIdAndDelete(groupId);

    console.log(`✅ Group deleted: ${groupName} by ${req.user.username}`);
    res.json({ success: true, message: "Group deleted successfully" });
  } catch (error) {
    console.error('❌ Error deleting group:', error.message);
    res.status(500).json({ message: "Error deleting group", error: error.message });
  }
});

// Clear all group messages
app.delete('/api/groups/:groupId/messages', authenticateToken, async (req, res) => {
  try {
    const group = await Group.findById(req.params.groupId);

    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check if user is a member of the group
    if (!group.members.includes(req.user.username)) {
      return res.status(403).json({ message: "You are not a member of this group" });
    }

    // Delete all messages for this group
    await GroupMessage.deleteMany({ groupId: req.params.groupId });

    console.log(`✅ Group messages cleared for group: ${group.name} by ${req.user.username}`);
    res.json({ success: true, message: "Group chat cleared" });
  } catch (error) {
    console.error('❌ Error clearing group chat:', error.message);
    res.status(500).json({ message: "Error clearing group chat", error: error.message });
  }
});

// ===== BROADCAST LISTS =====

// Create broadcast list
app.post('/api/broadcasts/create', authenticateToken, async (req, res) => {
  try {
    const { name, recipients } = req.body;

    const broadcast = new Broadcast({
      name,
      createdBy: req.user.username,
      recipients
    });

    await broadcast.save();
    console.log(`✅ Broadcast list created: ${name} by ${req.user.username}`);
    res.json({ success: true, broadcast });
  } catch (error) {
    console.error('❌ Error creating broadcast:', error.message);
    res.status(500).json({ message: "Error creating broadcast", error: error.message });
  }
});

// Get all broadcast lists for current user
app.get('/api/broadcasts', authenticateToken, async (req, res) => {
  try {
    const broadcasts = await Broadcast.find({ createdBy: req.user.username });
    res.json(broadcasts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching broadcasts", error: error.message });
  }
});

// Delete broadcast list
app.delete('/api/broadcasts/:broadcastId', authenticateToken, async (req, res) => {
  try {
    const broadcast = await Broadcast.findById(req.params.broadcastId);

    if (!broadcast) return res.status(404).json({ message: "Broadcast not found" });
    if (broadcast.createdBy !== req.user.username) {
      return res.status(403).json({ message: "You can only delete your own broadcasts" });
    }

    await Broadcast.findByIdAndDelete(req.params.broadcastId);
    res.json({ success: true, message: "Broadcast deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting broadcast", error: error.message });
  }
});

// Send broadcast message
app.post('/api/broadcasts/:broadcastId/send', authenticateToken, async (req, res) => {
  try {
    const { text, type, fileUrl, fileName } = req.body;
    const broadcast = await Broadcast.findById(req.params.broadcastId);

    if (!broadcast) return res.status(404).json({ message: "Broadcast not found" });
    if (broadcast.createdBy !== req.user.username) {
      return res.status(403).json({ message: "You can only send to your own broadcasts" });
    }

    // Send to all recipients
    for (const recipient of broadcast.recipients) {
      const message = new Message({
        from: req.user.userId,
        fromUsername: req.user.username,
        toUsername: recipient,
        text,
        type: type || 'text',
        fileUrl,
        fileName,
        starredBy: []
      });
      await message.save();

      // Notify via socket
      const recipientSocketId = connectedUsers.get(recipient);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("receive_message", message);
      }
    }

    res.json({ success: true, message: "Broadcast sent" });
  } catch (error) {
    console.error('❌ Error sending broadcast:', error.message);
    res.status(500).json({ message: "Error sending broadcast", error: error.message });
  }
});


// ===== SOCKET.IO REAL-TIME COMMUNICATION =====

const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log('✅ New socket connection:', socket.id);

  socket.emit("me", socket.id);

  socket.on("register_user", async (username) => {
    if (!username) {
      console.error('❌ No username provided for registration');
      return;
    }

    console.log(`📝 Registering user: ${username} with socket: ${socket.id}`);
    console.log(`📋 Current connected users before:`, Array.from(connectedUsers.entries()));

    // Remove old connection for this username (if any)
    if (connectedUsers.has(username)) {
      const oldSocketId = connectedUsers.get(username);
      console.log(`🔄 Removing old connection for ${username}: ${oldSocketId}`);
      connectedUsers.delete(username);
    }

    // Also remove this socket.id if it's mapped to a different user
    for (const [user, sockId] of connectedUsers.entries()) {
      if (sockId === socket.id) {
        console.log(`🔄 Removing old mapping for socket ${socket.id}: ${user}`);
        connectedUsers.delete(user);
      }
    }

    connectedUsers.set(username, socket.id);
    console.log(`📋 Current connected users after:`, Array.from(connectedUsers.entries()));

    // Update user online status in DB
    try {
      await User.findOneAndUpdate(
        { username },
        { isOnline: true, socketId: socket.id, lastSeen: new Date() }
      );
    } catch (err) {
      console.error('Error updating user status:', err.message);
    }

    console.log(`✅ User ${username} registered with socket ${socket.id}`);
    socket.broadcast.emit("user_online", { username });
  });

  socket.on("typing_start", (data) => {
    const targetSocketId = connectedUsers.get(data.toUsername);
    if (targetSocketId) {
      io.to(targetSocketId).emit("user_typing", { from: data.fromUsername, isTyping: true });
    }
  });

  socket.on("typing_stop", (data) => {
    const targetSocketId = connectedUsers.get(data.toUsername);
    if (targetSocketId) {
      io.to(targetSocketId).emit("user_typing", { from: data.fromUsername, isTyping: false });
    }
  });

  // Group typing indicator
  socket.on("group_typing_start", (data) => {
    const { groupId, fromUsername } = data;
    // Get group members and notify them
    Group.findById(groupId).then(group => {
      if (group) {
        group.members.forEach(member => {
          if (member !== fromUsername) {
            const memberSocketId = connectedUsers.get(member);
            if (memberSocketId) {
              io.to(memberSocketId).emit("group_user_typing", { groupId, fromUsername, isTyping: true });
            }
          }
        });
      }
    });
  });

  socket.on("group_typing_stop", (data) => {
    const { groupId, fromUsername } = data;
    Group.findById(groupId).then(group => {
      if (group) {
        group.members.forEach(member => {
          if (member !== fromUsername) {
            const memberSocketId = connectedUsers.get(member);
            if (memberSocketId) {
              io.to(memberSocketId).emit("group_user_typing", { groupId, fromUsername, isTyping: false });
            }
          }
        });
      }
    });
  });

  // Unified group typing handler (combines start/stop with isTyping flag)
  socket.on("group_user_typing", (data) => {
    const { groupId, fromUsername, isTyping } = data;
    Group.findById(groupId).then(group => {
      if (group) {
        group.members.forEach(member => {
          if (member !== fromUsername) {
            const memberSocketId = connectedUsers.get(member);
            if (memberSocketId) {
              io.to(memberSocketId).emit("group_user_typing", { groupId, fromUsername, isTyping });
            }
          }
        });
      }
    });
  });

  socket.on("send_message", async (data) => {
    console.log('📨 Message received:', data.text, 'to:', data.toUsername, 'from:', data.fromUsername);

    // Debug: log all connected users
    console.log('📋 Currently connected users:', Array.from(connectedUsers.keys()));

    const targetSocketId = connectedUsers.get(data.toUsername);
    const senderSocketId = connectedUsers.get(data.fromUsername);
    console.log('🎯 Target socket ID for', data.toUsername + ':', targetSocketId);

    let message;
    try {
      message = new Message({
        from: data.from,
        to: data.toUsername,
        fromUsername: data.fromUsername,
        toUsername: data.toUsername,
        text: data.text,
        type: data.type || 'text',
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        replyTo: data.replyTo ? data.replyTo : null,
        starredBy: []
      });
      await message.save();
    } catch (err) {
      console.error('Error saving message:', err.message);
      if (senderSocketId) {
        io.to(senderSocketId).emit("message_error", { error: "Failed to save message" });
      }
      return;
    }

    const populatedMessage = await Message.findById(message._id).populate('replyTo');

    // Send acknowledgment to sender with saved message data (including _id)
    if (senderSocketId) {
      io.to(senderSocketId).emit("message_saved", {
        clientId: data.clientId,
        _id: populatedMessage._id,
        timestamp: populatedMessage.timestamp,
        toUsername: data.toUsername,
        replyTo: populatedMessage.replyTo
      });
    }

    if (targetSocketId) {
      io.to(targetSocketId).emit("receive_message", populatedMessage);
      console.log('✅ Message sent to', data.toUsername);

      // Send delivery confirmation back to sender (double tick)
      if (senderSocketId) {
        io.to(senderSocketId).emit("message_delivered", {
          toUsername: data.toUsername,
          messageId: data.timestamp
        });
      }
    } else {
      // Target offline, broadcast to all other users? (original behavior)
      socket.broadcast.emit("receive_message", populatedMessage);
      console.log('📢 Message broadcast to all (target not found)');
    }

    // ====== SEND PUSH NOTIFICATION ======
    try {
      const recipientUser = await User.findOne({ username: data.toUsername });
      if (
        recipientUser &&
        recipientUser.pushSubscription &&
        recipientUser.notificationSettings &&
        recipientUser.notificationSettings.pushEnabled &&
        !recipientUser.notificationSettings.muteAll
      ) {
        // Only send push if they are offline OR always send push based on preference
        // For now: send if offline or if we want to ensure delivery
        if (!targetSocketId) {
          const payload = JSON.stringify({
            title: `New message from ${data.fromUsername}`,
            body: data.text || 'Sent an attachment',
            icon: '/whatsapp-icon.png',
            url: '/'
          });
          await webpush.sendNotification(recipientUser.pushSubscription, payload);
          console.log(`🔔 Push notification sent to ${data.toUsername}`);
        }
      }
    } catch (pushErr) {
      console.error('❌ Failed to send push notification:', pushErr.message);
      // If subscription is invalid/expired, we could remove it here
      if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
        await User.findOneAndUpdate({ username: data.toUsername }, { pushSubscription: null });
      }
    }
    // ====================================

  });

  // Handle message read receipts
  socket.on("message_read", async (data) => {
    try {
      // Mark all messages from this sender as read in the database
      await Message.updateMany(
        { fromUsername: data.fromUsername, toUsername: data.toUsername, read: false },
        { $set: { read: true } }
      );
      console.log(`✅ Marked messages as read from ${data.fromUsername} to ${data.toUsername}`);
    } catch (err) {
      console.error('Error marking messages as read:', err.message);
    }

    // Check read receipt privacy setting of the recipient (the user who read the message)
    const recipient = await User.findOne({ username: data.toUsername }).select('privacySettings');
    let shouldSendReceipt = false;
    if (recipient && recipient.privacySettings && recipient.privacySettings.readReceipts) {
      const setting = recipient.privacySettings.readReceipts;
      if (setting === 'everyone') {
        shouldSendReceipt = true;
      } else if (setting === 'contacts') {
        // Check if sender and recipient are contacts (have exchanged messages)
        const count = await Message.countDocuments({
          $or: [
            { fromUsername: data.fromUsername, toUsername: data.toUsername },
            { fromUsername: data.toUsername, toUsername: data.fromUsername }
          ]
        });
        if (count > 0) shouldSendReceipt = true;
      }
      // 'nobody' => false
    }

    if (shouldSendReceipt) {
      const senderSocketId = connectedUsers.get(data.fromUsername);
      if (senderSocketId) {
        io.to(senderSocketId).emit("message_read_receipt", {
          toUsername: data.toUsername,
          messageId: data.messageId
        });
      }
    }
  });

  socket.on("delete_message", (data) => {
    const targetSocketId = connectedUsers.get(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("message_deleted", data);
    }
  });

  // Handle group message deletion
  socket.on("delete_group_message", async (data) => {
    try {
      const { groupId, messageId } = data;

      // Update message in database
      await GroupMessage.findByIdAndUpdate(messageId, { deletedForEveryone: true });

      // Get group members and notify them
      const group = await Group.findById(groupId);
      if (group && group.members) {
        for (const memberUsername of group.members) {
          const memberSocketId = connectedUsers.get(memberUsername);
          if (memberSocketId) {
            io.to(memberSocketId).emit("group_message_deleted", { groupId, messageId });
          }
        }
      }
    } catch (err) {
      console.error('Error deleting group message:', err.message);
    }
  });

  socket.on("callUser", (data) => {
    const targetSocketId = connectedUsers.get(data.userToCall);
    if (targetSocketId) {
      io.to(targetSocketId).emit("incomingCall", {
        signal: data.signalData,
        from: data.from,
        callType: data.callType
      });
      console.log(`📞 Call from ${data.from} to ${data.userToCall}`);
    }
  });

  socket.on("answerCall", (data) => {
    const targetSocketId = connectedUsers.get(data.to);
    if (targetSocketId) {
      io.to(targetSocketId).emit("callAccepted", data.signal);
      console.log(`✅ Call accepted`);
    }
  });

  socket.on("callEnded", () => {
    socket.broadcast.emit("callEnded");
    console.log(`📞 Call ended`);
  });

  // Handle group messages
  socket.on("send_group_message", async (data) => {
    console.log('📨 Group message received:', data.text, 'in group:', data.groupId, 'from:', data.fromUsername);

    try {
      // Save message to database
      const groupMessage = new GroupMessage({
        groupId: data.groupId,
        fromUsername: data.fromUsername,
        text: data.text,
        type: data.type || 'text',
        fileUrl: data.fileUrl,
        fileName: data.fileName,
        replyTo: data.replyTo ? data.replyTo : null
      });
      await groupMessage.save();

      const populatedMessage = await GroupMessage.findById(groupMessage._id).populate('replyTo');

      // Send acknowledgment to sender with saved message data
      const senderSocketId = connectedUsers.get(data.fromUsername);
      if (senderSocketId) {
        io.to(senderSocketId).emit("group_message_saved", {
          clientId: data.clientId,
          _id: populatedMessage._id,
          timestamp: populatedMessage.timestamp,
          groupId: data.groupId,
          replyTo: populatedMessage.replyTo
        });
      }

      // Get group members to broadcast to
      const group = await Group.findById(data.groupId);
      if (group && group.members) {
        // Broadcast to all group members
        for (const memberUsername of group.members) {
          const memberSocketId = connectedUsers.get(memberUsername);
          if (memberSocketId) { // Send to sender as well to update UI
            io.to(memberSocketId).emit("receive_group_message", populatedMessage);
          } else {
            // ====== SEND PUSH NOTIFICATION FOR GROUP MESSAGE ======
            try {
              const recipientUser = await User.findOne({ username: memberUsername });
              if (
                recipientUser &&
                recipientUser.pushSubscription &&
                recipientUser.notificationSettings &&
                recipientUser.notificationSettings.pushEnabled &&
                !recipientUser.notificationSettings.muteAll &&
                memberUsername !== data.fromUsername
              ) {
                const payload = JSON.stringify({
                  title: `${group.name}`,
                  body: `${data.fromUsername}: ${data.text || 'Sent an attachment'}`,
                  icon: '/whatsapp-icon.png',
                  url: '/'
                });
                await webpush.sendNotification(recipientUser.pushSubscription, payload);
                console.log(`🔔 Group push sent to ${memberUsername}`);
              }
            } catch (pushErr) {
              console.error(`❌ Failed to send group push to ${memberUsername}:`, pushErr.message);
              if (pushErr.statusCode === 410 || pushErr.statusCode === 404) {
                await User.findOneAndUpdate({ username: memberUsername }, { pushSubscription: null });
              }
            }
            // ====================================
          }
        }
        console.log(`✅ Group message saved and broadcast to ${group.members.length} members`);
      }
    } catch (err) {
      console.error('Error saving group message:', err.message);
    }
  });

  socket.on("disconnect", async () => {
    console.log(`🔌 Socket disconnecting: ${socket.id}`);
    console.log(`📋 Connected users before disconnect:`, Array.from(connectedUsers.entries()));

    for (const [username, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(username);

        // Update user offline status in DB
        try {
          await User.findOneAndUpdate(
            { username },
            { isOnline: false, socketId: null, lastSeen: new Date() }
          );
        } catch (err) {
          console.error('Error updating user status:', err.message);
        }

        console.log(`👋 User ${username} disconnected`);
        socket.broadcast.emit("user_offline", { username, lastSeen: new Date() });
        break;
      }
    }

    console.log(`📋 Connected users after disconnect:`, Array.from(connectedUsers.entries()));
  });
});

// ===== NEW FEATURES API ENDPOINTS =====

// 1. MESSAGE REACTIONS
// Add reaction to a message
app.post('/api/message/:messageId/reaction', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const username = req.user.username;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      r => r.username === username && r.emoji === emoji
    );

    if (existingReaction) {
      // Remove reaction
      message.reactions = message.reactions.filter(
        r => !(r.username === username && r.emoji === emoji)
      );
    } else {
      // Remove any previous reaction from this user
      message.reactions = message.reactions.filter(r => r.username !== username);
      // Add new reaction
      message.reactions.push({ emoji, username, timestamp: new Date() });
    }

    await message.save();

    // Emit socket event to both parties
    const recipient = message.fromUsername === username ? message.toUsername : message.fromUsername;
    const recipientSocketId = connectedUsers.get(recipient);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('message_reaction', {
        messageId,
        reactions: message.reactions,
        fromUsername: username
      });
    }

    res.json({ message: 'Reaction updated', reactions: message.reactions });
  } catch (err) {
    res.status(500).json({ message: 'Error updating reaction', error: err.message });
  }
});

// Add reaction to group message
app.post('/api/group-message/:messageId/reaction', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const username = req.user.username;

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const existingReaction = message.reactions.find(
      r => r.username === username && r.emoji === emoji
    );

    if (existingReaction) {
      message.reactions = message.reactions.filter(
        r => !(r.username === username && r.emoji === emoji)
      );
    } else {
      message.reactions = message.reactions.filter(r => r.username !== username);
      message.reactions.push({ emoji, username, timestamp: new Date() });
    }

    await message.save();

    // Emit to all group members
    const group = await Group.findById(message.groupId);
    if (group) {
      group.members.forEach(member => {
        const memberSocketId = connectedUsers.get(member);
        if (memberSocketId) {
          io.to(memberSocketId).emit('group_message_reaction', {
            messageId,
            groupId: message.groupId,
            reactions: message.reactions,
            fromUsername: username
          });
        }
      });
    }

    res.json({ message: 'Reaction updated', reactions: message.reactions });
  } catch (err) {
    res.status(500).json({ message: 'Error updating reaction', error: err.message });
  }
});

// 2. MESSAGE EDITING
// Edit a message
app.put('/api/message/:messageId/edit', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const username = req.user.username;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Only allow editing own messages
    if (message.fromUsername !== username) {
      return res.status(403).json({ message: 'Can only edit your own messages' });
    }

    // Check if within 15 minutes
    const messageAge = Date.now() - new Date(message.timestamp).getTime();
    if (messageAge > 15 * 60 * 1000) {
      return res.status(400).json({ message: 'Can only edit messages within 15 minutes' });
    }

    // Store edit history
    if (!message.editHistory) message.editHistory = [];
    message.editHistory.push({ text: message.text, editedAt: new Date() });

    message.text = text;
    message.edited = true;
    message.editedAt = new Date();

    await message.save();

    // Emit socket event
    const recipientSocketId = connectedUsers.get(message.toUsername);
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('message_edited', {
        messageId,
        text,
        edited: true,
        editedAt: message.editedAt
      });
    }

    res.json({ message: 'Message edited', data: message });
  } catch (err) {
    res.status(500).json({ message: 'Error editing message', error: err.message });
  }
});

// Edit group message
app.put('/api/group-message/:messageId/edit', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const username = req.user.username;

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (message.fromUsername !== username) {
      return res.status(403).json({ message: 'Can only edit your own messages' });
    }

    const messageAge = Date.now() - new Date(message.timestamp).getTime();
    if (messageAge > 15 * 60 * 1000) {
      return res.status(400).json({ message: 'Can only edit messages within 15 minutes' });
    }

    if (!message.editHistory) message.editHistory = [];
    message.editHistory.push({ text: message.text, editedAt: new Date() });

    message.text = text;
    message.edited = true;
    message.editedAt = new Date();

    await message.save();

    // Emit to all group members
    const group = await Group.findById(message.groupId);
    if (group) {
      group.members.forEach(member => {
        const memberSocketId = connectedUsers.get(member);
        if (memberSocketId) {
          io.to(memberSocketId).emit('group_message_edited', {
            messageId,
            groupId: message.groupId,
            text,
            edited: true,
            editedAt: message.editedAt
          });
        }
      });
    }

    res.json({ message: 'Message edited', data: message });
  } catch (err) {
    res.status(500).json({ message: 'Error editing message', error: err.message });
  }
});

// 3. MESSAGE PINNING
// Pin/unpin a message
app.post('/api/message/:messageId/pin', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const username = req.user.username;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is part of this conversation
    if (message.fromUsername !== username && message.toUsername !== username) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.pinned = !message.pinned;
    message.pinnedAt = message.pinned ? new Date() : null;
    message.pinnedBy = message.pinned ? username : null;

    await message.save();

    // Emit socket event
    const otherUser = message.fromUsername === username ? message.toUsername : message.fromUsername;
    const otherSocketId = connectedUsers.get(otherUser);
    if (otherSocketId) {
      io.to(otherSocketId).emit('message_pinned', {
        messageId,
        pinned: message.pinned,
        pinnedBy: message.pinnedBy
      });
    }

    res.json({ message: message.pinned ? 'Message pinned' : 'Message unpinned', data: message });
  } catch (err) {
    res.status(500).json({ message: 'Error pinning message', error: err.message });
  }
});

// Get pinned messages for a chat
app.get('/api/messages/pinned/:chatWith', authenticateToken, async (req, res) => {
  try {
    const { chatWith } = req.params;
    const username = req.user.username;

    const pinnedMessages = await Message.find({
      $or: [
        { fromUsername: username, toUsername: chatWith },
        { fromUsername: chatWith, toUsername: username }
      ],
      pinned: true,
      deletedForEveryone: false
    }).sort({ pinnedAt: -1 });

    res.json(pinnedMessages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching pinned messages', error: err.message });
  }
});

// Pin/unpin a group message
app.post('/api/group-message/:messageId/pin', authenticateToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const username = req.user.username;

    const message = await GroupMessage.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is a member of the group
    const group = await Group.findById(message.groupId);
    if (!group || !group.members.includes(username)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    message.pinned = !message.pinned;
    message.pinnedAt = message.pinned ? new Date() : null;
    message.pinnedBy = message.pinned ? username : null;

    await message.save();

    // Emit socket event to group members
    group.members.forEach(member => {
      if (member !== username) {
        const memberSocketId = connectedUsers.get(member);
        if (memberSocketId) {
          io.to(memberSocketId).emit('group_message_pinned', {
            messageId,
            groupId: message.groupId,
            pinned: message.pinned,
            pinnedBy: message.pinnedBy
          });
        }
      }
    });

    res.json({ message: message.pinned ? 'Message pinned' : 'Message unpinned', data: message });
  } catch (err) {
    res.status(500).json({ message: 'Error pinning group message', error: err.message });
  }
});

// 4. DISAPPEARING MESSAGES
// Set disappearing messages for a chat
app.post('/api/chat/disappearing', authenticateToken, async (req, res) => {
  try {
    const { chatWith, duration } = req.body; // duration in hours: 24, 168 (7 days), or 2160 (90 days)
    const username = req.user.username;

    // Update all future messages in this chat to disappear
    // Store setting in user document
    await User.updateOne(
      { username },
      { $set: { [`disappearingChats.${chatWith}`]: duration } }
    );

    res.json({ message: 'Disappearing messages setting updated' });
  } catch (err) {
    res.status(500).json({ message: 'Error setting disappearing messages', error: err.message });
  }
});

// 5. CHAT THEMES
// Set chat theme
app.post('/api/chat/theme', authenticateToken, async (req, res) => {
  try {
    const { chatWith, wallpaper, bubbleColor, isGroup } = req.body;
    const username = req.user.username;

    let theme = await ChatTheme.findOne({ username, chatWith, isGroup });

    if (theme) {
      theme.wallpaper = wallpaper || theme.wallpaper;
      theme.bubbleColor = bubbleColor || theme.bubbleColor;
    } else {
      theme = new ChatTheme({ username, chatWith, wallpaper, bubbleColor, isGroup });
    }

    await theme.save();
    res.json({ message: 'Theme updated', theme });
  } catch (err) {
    res.status(500).json({ message: 'Error setting theme', error: err.message });
  }
});

// Get chat theme
app.get('/api/chat/theme/:chatWith', authenticateToken, async (req, res) => {
  try {
    const { chatWith } = req.params;
    const { isGroup } = req.query;
    const username = req.user.username;

    const theme = await ChatTheme.findOne({ username, chatWith, isGroup: isGroup === 'true' });
    res.json(theme || { wallpaper: 'default', bubbleColor: '#005c4b' });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching theme', error: err.message });
  }
});

// 6. MESSAGE SCHEDULING
// Schedule a message
app.post('/api/message/schedule', authenticateToken, async (req, res) => {
  try {
    const { toUsername, text, scheduledFor, type, fileUrl, fileName } = req.body;
    const username = req.user.username;

    const scheduledMessage = new ScheduledMessage({
      fromUsername: username,
      toUsername,
      text,
      type: type || 'text',
      fileUrl,
      fileName,
      scheduledFor: new Date(scheduledFor),
      status: 'pending'
    });

    await scheduledMessage.save();
    res.json({ message: 'Message scheduled', data: scheduledMessage });
  } catch (err) {
    res.status(500).json({ message: 'Error scheduling message', error: err.message });
  }
});

// Get scheduled messages
app.get('/api/messages/scheduled', authenticateToken, async (req, res) => {
  try {
    const username = req.user.username;
    const scheduledMessages = await ScheduledMessage.find({
      fromUsername: username,
      status: 'pending'
    }).sort({ scheduledFor: 1 });

    res.json(scheduledMessages);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching scheduled messages', error: err.message });
  }
});

// Cancel scheduled message
app.delete('/api/message/scheduled/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.user.username;

    const message = await ScheduledMessage.findOneAndDelete({
      _id: id,
      fromUsername: username,
      status: 'pending'
    });

    if (!message) {
      return res.status(404).json({ message: 'Scheduled message not found' });
    }

    res.json({ message: 'Scheduled message cancelled' });
  } catch (err) {
    res.status(500).json({ message: 'Error cancelling scheduled message', error: err.message });
  }
});

// 7. VOICE MESSAGE UPLOAD
app.post('/api/upload-audio', authenticateToken, upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No audio file uploaded' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({
    fileUrl,
    fileName: req.file.originalname,
    fileType: 'audio'
  });
});

// Cron job for scheduled messages (runs every minute)
setInterval(async () => {
  try {
    const now = new Date();
    const dueMessages = await ScheduledMessage.find({
      status: 'pending',
      scheduledFor: { $lte: now }
    });

    for (const msg of dueMessages) {
      // Create the actual message
      const message = new Message({
        fromUsername: msg.fromUsername,
        toUsername: msg.toUsername,
        text: msg.text,
        type: msg.type,
        fileUrl: msg.fileUrl,
        fileName: msg.fileName,
        starredBy: []
      });

      await message.save();

      // Emit to recipient
      const recipientSocketId = connectedUsers.get(msg.toUsername);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit('receive_message', message);
      }

      // Mark as sent
      msg.status = 'sent';
      await msg.save();

      console.log(`📤 Sent scheduled message from ${msg.fromUsername} to ${msg.toUsername}`);
    }
  } catch (err) {
    console.error('Error processing scheduled messages:', err.message);
  }
}, 60000);

// Cron job for disappearing messages (runs every hour)
setInterval(async () => {
  try {
    const now = new Date();
    const result = await Message.deleteMany({
      disappearing: true,
      disappearsAt: { $lte: now }
    });

    if (result.deletedCount > 0) {
      console.log(`🗑️ Deleted ${result.deletedCount} disappearing messages`);
    }
  } catch (err) {
    console.error('Error deleting disappearing messages:', err.message);
  }
}, 3600000);

server.listen(5000, async () => {
  console.log("");
  console.log("╔════════════════════════════════════════╗");
  console.log("║  ✅ WhatsApp Lite Server Running      ║");
  console.log("║  📍 http://localhost:5000             ║");
  console.log("║  📊 Database: MongoDB Atlas           ║");
  console.log("║  💾 All data persisted                ��");
  console.log("║  📱 Ready for testing!                ║");
  console.log("╚════════════════════════════════════════╝");
  console.log("");

  // Clean up duplicate groups on startup
  try {
    const allGroups = await Group.find({});
    const seenNames = new Map();
    let deletedCount = 0;

    for (const group of allGroups) {
      const key = `${group.name}_${group.createdBy}`;
      if (seenNames.has(key)) {
        await Group.deleteOne({ _id: group._id });
        deletedCount++;
        console.log(`Deleted duplicate group: ${group.name}`);
      } else {
        seenNames.set(key, group._id);
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} duplicate groups`);
    }
  } catch (err) {
    console.error('Error cleaning up duplicates:', err.message);
  }
});
