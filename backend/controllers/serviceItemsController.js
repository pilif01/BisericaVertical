const { getDatabase } = require('../config/database');

/**
 * Get all items for a service
 */
exports.getServiceItems = (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  const items = db.prepare(`
    SELECT si.*, s.title as song_title, s.artist, 
           COALESCE(si.key_signature, s.key_signature) as key_signature
    FROM service_items si
    LEFT JOIN songs s ON si.song_id = s.id
    WHERE si.service_id = ?
    ORDER BY si.order_position ASC
  `).all(id);

  res.json({ items });
};

/**
 * Add item to service
 */
exports.addServiceItem = (req, res) => {
  const { id } = req.params;
  const { type, title, duration, notes, song_id, key_signature } = req.body;

  if (!type || !title) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = getDatabase();

  // Get max order position within the same type
  const maxOrder = db.prepare(
    'SELECT MAX(order_position) as max_pos FROM service_items WHERE service_id = ? AND type = ?'
  ).get(id, type);

  const newPosition = (maxOrder.max_pos || 0) + 1;

  // Check if key_signature column exists
  const columns = db.prepare('PRAGMA table_info(service_items)').all();
  const hasKeySignature = columns.some(col => col.name === 'key_signature');

  let result;
  if (hasKeySignature) {
    result = db.prepare(`
      INSERT INTO service_items (service_id, order_position, type, title, duration, notes, song_id, key_signature)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, newPosition, type, title, duration || null, notes || null, song_id || null, key_signature || null);
  } else {
    result = db.prepare(`
      INSERT INTO service_items (service_id, order_position, type, title, duration, notes, song_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, newPosition, type, title, duration || null, notes || null, song_id || null);
  }

  const item = db.prepare('SELECT * FROM service_items WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({ item, message: 'Item added successfully' });
};

/**
 * Update service item
 */
exports.updateServiceItem = (req, res) => {
  const { id, itemId } = req.params;
  const { title, duration, notes, song_id, key_signature, order_position } = req.body;

  const db = getDatabase();

  // Check if key_signature column exists
  const columns = db.prepare('PRAGMA table_info(service_items)').all();
  const hasKeySignature = columns.some(col => col.name === 'key_signature');

  if (hasKeySignature) {
    db.prepare(`
      UPDATE service_items
      SET title = COALESCE(?, title),
          duration = COALESCE(?, duration),
          notes = COALESCE(?, notes),
          song_id = COALESCE(?, song_id),
          key_signature = COALESCE(?, key_signature),
          order_position = COALESCE(?, order_position)
      WHERE id = ? AND service_id = ?
    `).run(title, duration, notes, song_id, key_signature, order_position, itemId, id);
  } else {
    db.prepare(`
      UPDATE service_items
      SET title = COALESCE(?, title),
          duration = COALESCE(?, duration),
          notes = COALESCE(?, notes),
          song_id = COALESCE(?, song_id),
          order_position = COALESCE(?, order_position)
      WHERE id = ? AND service_id = ?
    `).run(title, duration, notes, song_id, order_position, itemId, id);
  }

  const updated = db.prepare('SELECT * FROM service_items WHERE id = ?').get(itemId);

  res.json({ item: updated, message: 'Item updated successfully' });
};

/**
 * Delete service item
 */
exports.deleteServiceItem = (req, res) => {
  const { id, itemId } = req.params;
  const db = getDatabase();

  db.prepare('DELETE FROM service_items WHERE id = ? AND service_id = ?').run(itemId, id);

  res.json({ message: 'Item deleted successfully' });
};

/**
 * Reorder items
 */
exports.reorderItems = (req, res) => {
  const { id } = req.params;
  const { itemIds } = req.body; // Array de IDs în ordinea nouă

  if (!Array.isArray(itemIds)) {
    return res.status(400).json({ error: 'itemIds must be an array' });
  }

  const db = getDatabase();

  const update = db.prepare(
    'UPDATE service_items SET order_position = ? WHERE id = ? AND service_id = ?'
  );

  const updateMany = db.transaction((ids) => {
    ids.forEach((itemId, index) => {
      update.run(index + 1, itemId, id);
    });
  });

  updateMany(itemIds);

  res.json({ message: 'Items reordered successfully' });
};

