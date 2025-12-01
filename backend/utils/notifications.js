/**
 * Utility pentru crearea notificărilor
 */

function createNotification(db, { userId, type, title, message, actionUrl, actionLabel }) {
  const result = db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, action_url, action_label)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, type, title, message, actionUrl || null, actionLabel || null);

  return result.lastInsertRowid;
}

function createBulkNotifications(db, userIds, { type, title, message, actionUrl, actionLabel }) {
  const insert = db.prepare(`
    INSERT INTO notifications (user_id, type, title, message, action_url, action_label)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((ids) => {
    for (const userId of ids) {
      insert.run(userId, type, title, message, actionUrl || null, actionLabel || null);
    }
  });

  insertMany(userIds);
}

module.exports = {
  createNotification,
  createBulkNotifications
};

