const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');
const { authenticateToken } = require('../middleware/auth');

// All email routes require authentication
router.use(authenticateToken);

/**
 * @route   GET /api/email/users
 * @desc    Get all users for email selection (superadmin only)
 * @access  Superadmin
 */
router.get('/users', emailController.getUsersForEmail);

/**
 * @route   POST /api/email/send-credentials
 * @desc    Send credentials to selected users
 * @access  Superadmin
 */
router.post('/send-credentials', emailController.sendCredentials);

/**
 * @route   POST /api/email/send-vote-reminder
 * @desc    Send vote reminder to selected users
 * @access  Superadmin
 */
router.post('/send-vote-reminder', emailController.sendVoteReminder);

module.exports = router;

