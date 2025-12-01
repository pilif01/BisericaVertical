const { getDatabase } = require('../config/database');
const { canEditService } = require('../middleware/auth');

/**
 * Get all services (filtered by permissions)
 */
exports.getAllServices = (req, res) => {
  const db = getDatabase();
  const { from, to, type, status } = req.query;

  let query = `
    SELECT s.*, u.full_name as created_by_name
    FROM services s
    LEFT JOIN users u ON s.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (from) {
    query += ` AND s.date >= ?`;
    params.push(from);
  }

  if (to) {
    query += ` AND s.date <= ?`;
    params.push(to);
  }

  if (type) {
    query += ` AND s.service_type = ?`;
    params.push(type);
  }

  if (status) {
    query += ` AND s.status = ?`;
    params.push(status);
  }

  query += ` ORDER BY s.date ASC, s.time ASC`;

  const services = db.prepare(query).all(...params);
  res.json({ services });
};

/**
 * Get service by ID
 */
exports.getServiceById = (req, res) => {
  const db = getDatabase();
  const { id } = req.params;

  const service = db.prepare(`
    SELECT s.*, u.full_name as created_by_name
    FROM services s
    LEFT JOIN users u ON s.created_by = u.id
    WHERE s.id = ?
  `).get(id);

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  // Get service items
  const items = db.prepare(`
    SELECT si.*, s.title as song_title
    FROM service_items si
    LEFT JOIN songs s ON si.song_id = s.id
    WHERE si.service_id = ?
    ORDER BY si.order_position ASC
  `).all(id);

  service.items = items;

  res.json({ service });
};

/**
 * Create service
 */
exports.createService = (req, res) => {
  const { title, service_type, date, time, end_time, location, description, notes } = req.body;

  if (!title || !service_type || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = getDatabase();
  
  const result = db.prepare(`
    INSERT INTO services (title, service_type, date, time, end_time, location, description, notes, created_by)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(title, service_type, date, time, end_time || null, location || 'Biserica Vertical', description || null, notes || null, req.user.id);

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({ service, message: 'Service created successfully' });
};

/**
 * Update service
 */
exports.updateService = (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  if (!canEditService(req.user, service)) {
    return res.status(403).json({ error: 'No permission to edit this service' });
  }

  const { title, date, time, end_time, location, description, notes, status, preacher, leader, sermon_title } = req.body;

  db.prepare(`
    UPDATE services
    SET title = COALESCE(?, title),
        date = COALESCE(?, date),
        time = COALESCE(?, time),
        end_time = ?,
        location = COALESCE(?, location),
        description = ?,
        notes = ?,
        status = COALESCE(?, status),
        preacher = COALESCE(?, preacher),
        leader = COALESCE(?, leader),
        sermon_title = COALESCE(?, sermon_title),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(title, date, time, end_time, location, description, notes, status, preacher, leader, sermon_title, id);

  const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(id);

  res.json({ service: updated, message: 'Service updated successfully' });
};

/**
 * Delete service
 */
exports.deleteService = (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  if (!canEditService(req.user, service)) {
    return res.status(403).json({ error: 'No permission to delete this service' });
  }

  db.prepare('DELETE FROM services WHERE id = ?').run(id);

  res.json({ message: 'Service deleted successfully' });
};

/**
 * Get upcoming services for current user
 */
exports.getUpcomingServices = (req, res) => {
  const db = getDatabase();

  const services = db.prepare(`
    SELECT DISTINCT s.*, u.full_name as created_by_name
    FROM services s
    LEFT JOIN users u ON s.created_by = u.id
    LEFT JOIN assignments a ON s.id = a.service_id AND a.user_id = ?
    WHERE s.date >= date('now')
    AND (a.user_id = ? OR s.voting_open = 1)
    ORDER BY s.date ASC, s.time ASC
    LIMIT 5
  `).all(req.user.id, req.user.id);

  res.json({ services });
};

/**
 * Get calendar view
 */
exports.getCalendar = (req, res) => {
  const { month, year } = req.query;
  const db = getDatabase();

  let query = `
    SELECT s.id, s.title, s.service_type, s.date, s.time, s.status
    FROM services s
    WHERE 1=1
  `;
  const params = [];

  if (month && year) {
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate = `${year}-${String(month).padStart(2, '0')}-31`;
    query += ` AND s.date BETWEEN ? AND ?`;
    params.push(startDate, endDate);
  }

  query += ` ORDER BY s.date ASC, s.time ASC`;

  const services = db.prepare(query).all(...params);

  res.json({ services });
};

/**
 * Duplicate service
 */
exports.duplicateService = (req, res) => {
  const { id } = req.params;
  const { newDate, newTime } = req.body;

  if (!newDate) {
    return res.status(400).json({ error: 'New date required' });
  }

  const db = getDatabase();

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  // Create duplicate
  const result = db.prepare(`
    INSERT INTO services (title, service_type, date, time, end_time, location, description, notes, created_by, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
  `).run(
    service.title,
    service.service_type,
    newDate,
    newTime || service.time,
    service.end_time,
    service.location,
    service.description,
    service.notes,
    req.user.id
  );

  const newServiceId = result.lastInsertRowid;

  // Copy service items
  const items = db.prepare('SELECT * FROM service_items WHERE service_id = ? ORDER BY order_position').all(id);
  
  const insertItem = db.prepare(`
    INSERT INTO service_items (service_id, order_position, type, title, duration, notes, song_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  for (const item of items) {
    insertItem.run(newServiceId, item.order_position, item.type, item.title, item.duration, item.notes, item.song_id);
  }

  const newService = db.prepare('SELECT * FROM services WHERE id = ?').get(newServiceId);

  res.status(201).json({ service: newService, message: 'Service duplicated successfully' });
};

