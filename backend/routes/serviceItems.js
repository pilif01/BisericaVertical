const express = require('express');
const router = express.Router();
const serviceItemsController = require('../controllers/serviceItemsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get items for service
router.get('/services/:id/items', serviceItemsController.getServiceItems);

// Add item (admin only)
router.post('/services/:id/items', requireRole([
  'admin_global', 'admin_trupa', 'admin_tineret', 'admin_special'
]), serviceItemsController.addServiceItem);

// Update item (admin only)
router.put('/services/:id/items/:itemId', requireRole([
  'admin_global', 'admin_trupa', 'admin_tineret', 'admin_special'
]), serviceItemsController.updateServiceItem);

// Delete item (admin only)
router.delete('/services/:id/items/:itemId', requireRole([
  'admin_global', 'admin_trupa', 'admin_tineret', 'admin_special'
]), serviceItemsController.deleteServiceItem);

// Reorder items (admin only)
router.put('/services/:id/items/reorder', requireRole([
  'admin_global', 'admin_trupa', 'admin_tineret', 'admin_special'
]), serviceItemsController.reorderItems);

module.exports = router;

