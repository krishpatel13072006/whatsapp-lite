/**
 * Routes Index
 * Exports all route modules
 */

const authRoutes = require('./auth');
const userRoutes = require('./users');

module.exports = {
  authRoutes,
  userRoutes
};