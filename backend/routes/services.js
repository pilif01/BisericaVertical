const express = require('express');
const router = express.Router();
const servicesController = require('../controllers/servicesController');
const assignmentsController = require('../controllers/assignmentsController');
const votingController = require('../controllers/votingController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get services
router.get('/', servicesController.getAllServices);
router.get('/upcoming', servicesController.getUpcomingServices);
router.get('/calendar', servicesController.getCalendar);
router.get('/:id', servicesController.getServiceById);

// Get service assignments
router.get('/:id/assignments', assignmentsController.getServiceAssignments);

// Get vote results (returns volunteers who voted) - FROM MONTHLY AVAILABILITY
router.get('/:id/vote-results', requireRole([
  'admin_global', 'admin_trupa', 'admin_tineret', 'admin_special', 'admin_sound', 'admin_media'
]), votingController.getVoteResults);

// Assign person to service (admin only)
router.post('/:id/assign', requireRole([
  'admin_global', 'admin_trupa', 'admin_tineret', 'admin_special', 'admin_sound', 'admin_media'
]), (req, res) => {
  // Convertește parametrii pentru a fi compatibili cu createAssignment
  req.body.serviceId = req.params.id;
  req.body.userId = req.body.user_id;
  req.body.roleType = req.body.role_type;
  req.body.roleDetail = req.body.role_detail;
  assignmentsController.createAssignment(req, res);
});

// Open voting for service
router.post('/:id/open-voting', requireRole([
  'admin_global', 'admin_trupa', 'admin_tineret', 'admin_special'
]), votingController.openVoting);

// Create service (admin only)
router.post('/', requireRole([
  'admin_global', 'admin_trupa', 'admin_tineret', 'admin_special'
]), servicesController.createService);

// Update service
router.put('/:id', servicesController.updateService);

// Delete service (admin only)
router.delete('/:id', requireRole([
  'admin_global', 'admin_trupa', 'admin_tineret', 'admin_special'
]), servicesController.deleteService);

// Duplicate service
router.post('/:id/duplicate', servicesController.duplicateService);

module.exports = router;

