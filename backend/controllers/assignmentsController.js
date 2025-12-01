const { getDatabase } = require('../config/database');
const { canAssignVolunteers } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'blueprintstudioworks@gmail.com',
    pass: 'syue jmqe kuqn qmwb'
  }
});

/**
 * Get assignments for a service
 */
exports.getServiceAssignments = (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  const assignments = db.prepare(`
    SELECT a.*, u.full_name, u.email, u.phone, u.avatar_path,
           ab.full_name as assigned_by_name
    FROM assignments a
    JOIN users u ON a.user_id = u.id
    LEFT JOIN users ab ON a.assigned_by = ab.id
    WHERE a.service_id = ?
    ORDER BY a.role_type, a.role_detail
  `).all(id);

  res.json({ assignments });
};

/**
 * Create assignment
 */
exports.createAssignment = (req, res) => {
  const { serviceId, userId, roleType, roleDetail, notes } = req.body;

  if (!serviceId || !userId || !roleType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!canAssignVolunteers(req.user, roleType)) {
    return res.status(403).json({ error: 'No permission to assign this role' });
  }

  const db = getDatabase();

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);
  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Create assignment
  const result = db.prepare(`
    INSERT INTO assignments (service_id, user_id, role_type, role_detail, notes, assigned_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(serviceId, userId, roleType, roleDetail || null, notes || null, req.user.id);

  // Send notification
  createNotification(db, {
    userId: userId,
    type: 'assignment',
    title: `Programare nouă: ${service.title}`,
    message: `Ai fost programat ca ${roleDetail || roleType} pentru ${service.title} (${service.date} ${service.time}). Te rugăm confirmă sau refuză.`,
    actionUrl: `/planner/service/${serviceId}`,
    actionLabel: 'Vezi serviciu'
  });

  // Send email notification
  if (user.email) {
    const serviceDate = new Date(service.date + 'T12:00:00');
    const dateStr = serviceDate.toLocaleDateString('ro-RO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const mailOptions = {
      from: '"Biserica Vertical" <blueprintstudioworks@gmail.com>',
      to: user.email,
      subject: `🎵 Programare nouă - ${service.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Biserica Vertical - Planning Center</h2>
          <p>Bună <strong>${user.full_name}</strong>,</p>
          <p>Ai fost programat pentru următorul serviciu:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 12px 0; color: #000;">${service.title}</h3>
            <p style="margin: 5px 0;"><strong>📅 Data:</strong> ${dateStr}</p>
            <p style="margin: 5px 0;"><strong>🕐 Ora:</strong> ${service.time}</p>
            <p style="margin: 5px 0;"><strong>📍 Locație:</strong> ${service.location || 'Biserica Vertical'}</p>
            <p style="margin: 5px 0;"><strong>🎭 Rol:</strong> ${roleDetail || roleType}</p>
          </div>

          <p><strong>Te rugăm confirmă participarea cât mai curând!</strong></p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/planner/schedule" style="display: inline-block; padding: 12px 24px; background: #4CAF50; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Vezi Programările Tale</a></p>
          
          <p>Mulțumim pentru implicare!</p>
          
          <br>
          <p style="color: #666; font-size: 12px;">
            Acest email a fost trimis automat de Planning Center - Biserica Vertical
          </p>
        </div>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('[EMAIL] Failed to send assignment email:', error);
      } else {
        console.log(`[EMAIL] Assignment email sent to ${user.email}`);
      }
    });
  }

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({ assignment, message: 'Assignment created successfully' });
};

/**
 * Update assignment
 */
exports.updateAssignment = (req, res) => {
  const { id } = req.params;
  const { roleDetail, notes } = req.body;

  const db = getDatabase();

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);

  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  db.prepare(`
    UPDATE assignments
    SET role_detail = COALESCE(?, role_detail),
        notes = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(roleDetail, notes, id);

  const updated = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);

  res.json({ assignment: updated, message: 'Assignment updated successfully' });
};

/**
 * Delete assignment
 */
exports.deleteAssignment = (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);

  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  if (!canAssignVolunteers(req.user, assignment.role_type)) {
    return res.status(403).json({ error: 'No permission to delete this assignment' });
  }

  db.prepare('DELETE FROM assignments WHERE id = ?').run(id);

  res.json({ message: 'Assignment deleted successfully' });
};

/**
 * Confirm assignment (user confirms they'll be there)
 */
exports.confirmAssignment = (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);

  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  if (assignment.user_id !== req.user.id) {
    return res.status(403).json({ error: 'This is not your assignment' });
  }

  db.prepare(`
    UPDATE assignments
    SET status = 'confirmed', confirmed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(id);

  res.json({ message: 'Assignment confirmed successfully' });
};

/**
 * Decline assignment
 */
exports.declineAssignment = (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const db = getDatabase();

  const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);

  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  if (assignment.user_id !== req.user.id) {
    return res.status(403).json({ error: 'This is not your assignment' });
  }

  db.prepare(`
    UPDATE assignments
    SET status = 'declined', decline_reason = ?
    WHERE id = ?
  `).run(reason || 'No reason provided', id);

  // Notify admin
  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(assignment.service_id);
  
  createNotification(db, {
    userId: service.created_by,
    type: 'assignment_change',
    title: `Assignment declined: ${service.title}`,
    message: `${req.user.full_name} a refuzat programarea ca ${assignment.role_type}. Motiv: ${reason || 'Niciun motiv'}`,
    actionUrl: `/planner/service/${service.id}`,
    actionLabel: 'Vezi serviciu'
  });

  res.json({ message: 'Assignment declined' });
};

/**
 * Get my assignments
 */
exports.getMyAssignments = (req, res) => {
  const { status, upcoming } = req.query;
  const db = getDatabase();

  let query = `
    SELECT a.*, s.title, s.service_type, s.date, s.time, s.location
    FROM assignments a
    JOIN services s ON a.service_id = s.id
    WHERE a.user_id = ?
  `;
  const params = [req.user.id];

  if (status) {
    query += ` AND a.status = ?`;
    params.push(status);
  }

  if (upcoming === 'true') {
    query += ` AND s.date >= date('now')`;
  }

  query += ` ORDER BY s.date ASC, s.time ASC`;

  const assignments = db.prepare(query).all(...params);

  res.json({ assignments });
};

