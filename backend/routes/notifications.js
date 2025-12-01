const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notificationsController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

router.get('/', notificationsController.getNotifications);
router.get('/unread-count', notificationsController.getUnreadCount);
router.put('/:id/read', notificationsController.markAsRead);
router.put('/mark-all-read', notificationsController.markAllAsRead);
router.delete('/:id', notificationsController.deleteNotification);

module.exports = router;

