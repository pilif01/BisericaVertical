const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all users (admin_global only)
router.get('/', requireRole(['admin_global']), usersController.getAllUsers);
router.get('/:id', usersController.getUserById);

// Create user (admin_global only)
router.post('/', requireRole(['admin_global']), usersController.createUser);

// Update user (admin_global only)
router.put('/:id', requireRole(['admin_global']), usersController.updateUser);

// Assign roles (admin_global only)
router.post('/:id/roles', requireRole(['admin_global']), usersController.assignRoles);

// Get all roles
router.get('/roles/all', usersController.getAllRoles);

module.exports = router;

