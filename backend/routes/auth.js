const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Security: Rate Limiting pentru login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute
  max: 5, // Maximum 5 încercări per IP
  message: {
    error: 'Prea multe încercări de autentificare. Încearcă din nou în 15 minute.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip pentru successful logins
  skipSuccessfulRequests: true,
});

// Security: Rate Limiting pentru change password
const passwordChangeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 oră
  max: 3, // Maximum 3 schimbări de parolă per oră
  message: {
    error: 'Prea multe schimbări de parolă. Încearcă din nou în 1 oră.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/login', loginLimiter, authController.login);
router.post('/logout', authController.logout);

// Protected routes
router.get('/me', authenticateToken, authController.me);
router.post('/change-password', authenticateToken, passwordChangeLimiter, authController.changePassword);
router.post('/first-time-password-change', authenticateToken, authController.firstTimePasswordChange);

module.exports = router;

