const { Message } = require('../models');

/**
 * Get the set of usernames that a user has chatted with
 * @param {String} username - The username to get contacts for
 * @returns {Promise<Set>} Set of usernames
 */
async function getContactSet(username) {
  const from = await Message.distinct('toUsername', { fromUsername: username });
  const to = await Message.distinct('fromUsername', { toUsername: username });
  return new Set([...from, ...to]);
}

/**
 * Apply privacy filters to a user object based on requester's perspective
 * @param {String} requesterUsername - Username of the person requesting data
 * @param {Object} user - User object to filter
 * @param {Set} contactSet - Set of usernames the requester has chatted with
 * @returns {Object} Filtered user object
 */
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

/**
 * Format user for public profile response
 * @param {Object} user - User object (already filtered)
 * @returns {Object} Public profile object
 */
function formatPublicProfile(user) {
  return {
    _id: user._id?.toString() || user._id,
    username: user.username,
    displayName: user.displayName || user.username,
    profilePicture: user.profilePicture,
    about: user.about,
    isOnline: user.isOnline || false,
    lastSeen: user.lastSeen,
    phoneNumber: user.phoneNumber,
    email: user.email
  };
}

/**
 * Format user for list response
 * @param {Object} user - User object (already filtered)
 * @returns {Object} User list item object
 */
function formatUserListItem(user) {
  return {
    _id: user._id,
    username: user.username,
    displayName: user.displayName || user.username,
    profilePicture: user.profilePicture,
    about: user.about,
    isOnline: user.isOnline,
    lastSeen: user.lastSeen
  };
}

module.exports = {
  getContactSet,
  filterUserObject,
  formatPublicProfile,
  formatUserListItem
};