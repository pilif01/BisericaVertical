const express = require('express');
const router = express.Router();
const votingController = require('../controllers/votingController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Open voting (admin only)
router.post('/services/:id/open-voting', requireRole([
  'admin_global', 'admin_trupa', 'admin_tineret', 'admin_special'
]), votingController.openVoting);

// Get polls for service
router.get('/services/:id/polls', votingController.getPolls);

// Get vote results (admin only)
router.get('/services/:id/votes', votingController.getVoteResults);

// Submit vote
router.post('/votes', votingController.submitVote);

// Get pending votes
router.get('/votes/pending', votingController.getPendingVotes);

// Get my votes
router.get('/votes/my-votes', votingController.getMyVotes);

// Monthly voting
router.get('/votes/monthly', votingController.getMonthlyVotes);
router.post('/votes/monthly', votingController.saveMonthlyVotes);

module.exports = router;

