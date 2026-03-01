const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { getContactSet, filterUserObject, formatPublicProfile, formatUserListItem } = require('../utils/privacy');

const router = express.Router();

// Multer configuration for file uploads - use memory storage for Base64 conversion
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

/**
 * @route   GET /api/user-settings
 * @desc    Get current user settings
 * @access  Private
 */
router.get('/user-settings', authenticateToken, async (req, res) => {
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

/**
 * @route   POST /api/update-profile
 * @desc    Update user profile
 * @access  Private
 */
router.post('/update-profile', authenticateToken, async (req, res) => {
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

/**
 * @route   POST /api/update-wallpaper
 * @desc    Update user wallpaper preference
 * @access  Private
 */
router.post('/update-wallpaper', authenticateToken, async (req, res) => {
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

/**
 * @route   POST /api/upload-profile-picture
 * @desc    Upload profile picture
 * @access  Private
 */
router.post('/upload-profile-picture', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Convert file buffer to base64 Data URI
    const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const user = await User.findOneAndUpdate(
      { username: req.user.username },
      { profilePicture: base64Image },
      { new: true }
    );

    // Also update contacts list to reflect new profile picture
    const updatedUser = user.toObject();
    updatedUser.profilePicture = base64Image;

    res.json({ message: "Profile picture updated successfully", profilePicture: base64Image, user: updatedUser });
  } catch (error) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: "File is too large. Maximum size is 5MB." });
    }
    res.status(500).json({ message: "Error uploading profile picture", error: error.message });
  }
});

/**
 * @route   GET /api/privacy-settings
 * @desc    Get user privacy settings
 * @access  Private
 */
router.get('/privacy-settings', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username });
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.privacySettings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching privacy settings", error: error.message });
  }
});

/**
 * @route   POST /api/privacy-settings
 * @desc    Update user privacy settings
 * @access  Private
 */
router.post('/privacy-settings', authenticateToken, async (req, res) => {
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

/**
 * @route   GET /api/blocked-contacts
 * @desc    Get blocked contacts
 * @access  Private
 */
router.get('/blocked-contacts', authenticateToken, async (req, res) => {
  try {
    const user = await User.findOne({ username: req.user.username })
      .populate('blockedContacts', 'username displayName profilePicture about');

    res.json(user.blockedContacts || []);
  } catch (error) {
    res.status(500).json({ message: "Error fetching blocked contacts", error: error.message });
  }
});

/**
 * @route   POST /api/block-contact
 * @desc    Block a contact
 * @access  Private
 */
router.post('/block-contact', authenticateToken, async (req, res) => {
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

/**
 * @route   POST /api/unblock-contact
 * @desc    Unblock a contact
 * @access  Private
 */
router.post('/unblock-contact', authenticateToken, async (req, res) => {
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

/**
 * @route   GET /api/user-public-profile/:username
 * @desc    Get public profile of a user
 * @access  Private
 */
router.get('/user-public-profile/:username', authenticateToken, async (req, res) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username });
    if (!targetUser) return res.status(404).json({ message: "User not found" });

    // Get contact set for the requester
    const contactSet = await getContactSet(req.user.username);

    // Apply privacy filters
    const filteredUser = filterUserObject(req.user.username, targetUser, contactSet);
    const publicProfile = formatPublicProfile(filteredUser);

    res.json(publicProfile);
  } catch (error) {
    res.status(500).json({ message: "Error fetching public profile", error: error.message });
  }
});

/**
 * @route   GET /api/users
 * @desc    Get all users (excluding current user)
 * @access  Private
 */
router.get('/users', authenticateToken, async (req, res) => {
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
      return formatUserListItem(filtered);
    });

    res.json(filteredUsers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
});

/**
 * @route   GET /api/all-users
 * @desc    Get all users with search capability
 * @access  Private
 */
router.get('/all-users', authenticateToken, async (req, res) => {
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
      return formatUserListItem(filtered);
    });

    res.json(filteredUsers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
});

/**
 * @route   GET /api/recent-chats
 * @desc    Get recent chat contacts
 * @access  Private
 */
router.get('/recent-chats', authenticateToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;
    console.log(`📋 Fetching recent chats for ${currentUsername}`);

    const { Message } = require('../models');

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
      return formatUserListItem(filtered);
    });

    console.log(`✅ Returning ${filteredUsers.length} recent chats`);
    res.json(filteredUsers);
  } catch (error) {
    console.error('❌ Error fetching recent chats:', error.message);
    res.status(500).json({ message: "Error fetching recent chats", error: error.message });
  }
});

/**
 * @route   GET /api/unread-counts
 * @desc    Get unread message counts per sender
 * @access  Private
 */
router.get('/unread-counts', authenticateToken, async (req, res) => {
  try {
    const currentUsername = req.user.username;
    const { Message } = require('../models');

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

module.exports = router;