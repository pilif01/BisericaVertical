const { getDatabase } = require('../config/database');

/**
 * Get notifications for current user
 */
exports.getNotifications = (req, res) => {
  const { limit = 20, unread } = req.query;
  const db = getDatabase();

  let query = `
    SELECT *
    FROM notifications
    WHERE user_id = ?
  `;
  const params = [req.user.id];

  if (unread === 'true') {
    query += ` AND is_read = 0`;
  }

  query += ` ORDER BY created_at DESC LIMIT ?`;
  params.push(parseInt(limit));

  const notifications = db.prepare(query).all(...params);

  res.json({ notifications });
};

/**
 * Get unread count
 */
exports.getUnreadCount = (req, res) => {
  const db = getDatabase();

  const result = db.prepare(`
    SELECT COUNT(*) as count
    FROM notifications
    WHERE user_id = ? AND is_read = 0
  `).get(req.user.id);

  res.json({ count: result.count });
};

/**
 * Mark notification as read
 */
exports.markAsRead = (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);

  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  if (notification.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your notification' });
  }

  db.prepare(`
    UPDATE notifications
    SET is_read = 1, read_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);

  res.json({ message: 'Notification marked as read' });
};

/**
 * Mark all as read
 */
exports.markAllAsRead = (req, res) => {
  const db = getDatabase();

  db.prepare(`
    UPDATE notifications
    SET is_read = 1, read_at = CURRENT_TIMESTAMP
    WHERE user_id = ? AND is_read = 0
  `).run(req.user.id);

  res.json({ message: 'All notifications marked as read' });
};

/**
 * Delete notification
 */
exports.deleteNotification = (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  const notification = db.prepare('SELECT * FROM notifications WHERE id = ?').get(id);

  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  if (notification.user_id !== req.user.id) {
    return res.status(403).json({ error: 'Not your notification' });
  }

  db.prepare('DELETE FROM notifications WHERE id = ?').run(id);

  res.json({ message: 'Notification deleted' });
};

