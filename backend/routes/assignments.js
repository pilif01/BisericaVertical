const express = require('express');
const router = express.Router();
const assignmentsController = require('../controllers/assignmentsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get assignments for service
router.get('/services/:id/assignments', assignmentsController.getServiceAssignments);

// Create assignment (admin only)
router.post('/', requireRole([
  'admin_global', 'admin_trupa', 'admin_tineret', 'admin_special', 
  'admin_media', 'admin_sound', 'admin_cafea', 'admin_grupa_copii',
  'admin_bun_venit', 'admin_bun_venit_tineret', 'admin_trupa_tabara'
]), assignmentsController.createAssignment);

// Update assignment (admin only)
router.put('/:id', requireRole([
  'admin_global', 'admin_trupa', 'admin_tineret', 'admin_special',
  'admin_media', 'admin_sound', 'admin_cafea', 'admin_grupa_copii',
  'admin_bun_venit', 'admin_bun_venit_tineret', 'admin_trupa_tabara'
]), assignmentsController.updateAssignment);

// Delete assignment (admin only)
router.delete('/:id', requireRole([
  'admin_global', 'admin_trupa', 'admin_tineret', 'admin_special',
  'admin_media', 'admin_sound', 'admin_cafea', 'admin_grupa_copii',
  'admin_bun_venit', 'admin_bun_venit_tineret', 'admin_trupa_tabara'
]), assignmentsController.deleteAssignment);

// User actions
router.put('/:id/confirm', assignmentsController.confirmAssignment);
router.put('/:id/decline', assignmentsController.declineAssignment);

// Get my assignments
router.get('/my-assignments', assignmentsController.getMyAssignments);

module.exports = router;

