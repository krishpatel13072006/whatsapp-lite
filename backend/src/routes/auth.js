const express = require('express');
const bcrypt = require('bcryptjs');
const { User, ResetCode } = require('../models');
const { authenticateToken, generateToken } = require('../middleware/auth');
const { sendVerificationEmail } = require('../services/emailService');

const router = express.Router();

/**
 * Generate random 6-digit reset code
 */
const generateResetCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * @route   POST /api/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', async (req, res) => {
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

/**
 * @route   POST /api/login
 * @desc    Authenticate user and return token
 * @access  Public
 */
router.post('/login', async (req, res) => {
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
    
    const token = generateToken(user);
    console.log(`✅ Login successful: ${username}`);
    res.json({ token, username: user.username });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: "Error logging in", error: error.message });
  }
});

/**
 * @route   POST /api/request-password-reset
 * @desc    Request password reset code
 * @access  Public
 */
router.post('/request-password-reset', async (req, res) => {
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

/**
 * @route   POST /api/verify-reset-code
 * @desc    Verify password reset code
 * @access  Public
 */
router.post('/verify-reset-code', async (req, res) => {
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

/**
 * @route   POST /api/reset-password
 * @desc    Reset password with verified code
 * @access  Public
 */
router.post('/reset-password', async (req, res) => {
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

module.exports = router;