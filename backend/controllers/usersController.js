const bcrypt = require('bcrypt');
const { getDatabase } = require('../config/database');

/**
 * Get all users (admin_global only)
 */
exports.getAllUsers = (req, res) => {
  const db = getDatabase();

  const users = db.prepare(`
    SELECT u.id, u.username, u.full_name, u.email, u.phone, u.avatar_path, u.is_active, u.created_at
    FROM users u
    ORDER BY u.full_name ASC
  `).all();

  // Get roles for each user
  users.forEach(user => {
    const roles = db.prepare(`
      SELECT r.name, r.display_name, r.category
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `).all(user.id);

    user.roles = roles;
  });

  res.json({ users });
};

/**
 * Get user by ID
 */
exports.getUserById = (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  const user = db.prepare(`
    SELECT id, username, full_name, email, phone, avatar_path, is_active, created_at
    FROM users
    WHERE id = ?
  `).get(id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  // Get roles
  const roles = db.prepare(`
    SELECT r.id, r.name, r.display_name, r.category
    FROM roles r
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = ?
  `).all(id);

  user.roles = roles;

  res.json({ user });
};

/**
 * Create user (admin_global only)
 */
exports.createUser = (req, res) => {
  const { username, password, full_name, email, phone } = req.body;

  if (!username || !password || !full_name) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  const db = getDatabase();

  // Check if username exists
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) {
    return res.status(400).json({ error: 'Username already exists' });
  }

  // Hash password
  const passwordHash = bcrypt.hashSync(password, 10);

  // Insert user
  const result = db.prepare(`
    INSERT INTO users (username, password_hash, full_name, email, phone)
    VALUES (?, ?, ?, ?, ?)
  `).run(username, passwordHash, full_name, email || null, phone || null);

  const user = db.prepare('SELECT id, username, full_name, email, phone FROM users WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({ user, message: 'User created successfully' });
};

/**
 * Update user
 */
exports.updateUser = (req, res) => {
  const { id } = req.params;
  const { full_name, email, phone, is_active } = req.body;

  const db = getDatabase();

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  db.prepare(`
    UPDATE users
    SET full_name = COALESCE(?, full_name),
        email = ?,
        phone = ?,
        is_active = COALESCE(?, is_active),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(full_name, email, phone, is_active, id);

  const updated = db.prepare('SELECT id, username, full_name, email, phone, is_active FROM users WHERE id = ?').get(id);

  res.json({ user: updated, message: 'User updated successfully' });
};

/**
 * Assign roles to user
 */
exports.assignRoles = (req, res) => {
  const { id } = req.params;
  const { roleIds } = req.body;

  if (!Array.isArray(roleIds)) {
    return res.status(400).json({ error: 'roleIds must be an array' });
  }

  const db = getDatabase();

  // Delete existing roles
  db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(id);

  // Insert new roles
  const insert = db.prepare('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)');
  const insertMany = db.transaction((ids) => {
    for (const roleId of ids) {
      insert.run(id, roleId);
    }
  });

  insertMany(roleIds);

  // Get updated roles
  const roles = db.prepare(`
    SELECT r.id, r.name, r.display_name, r.category
    FROM roles r
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = ?
  `).all(id);

  res.json({ roles, message: 'Roles assigned successfully' });
};

/**
 * Get all roles
 */
exports.getAllRoles = (req, res) => {
  const db = getDatabase();

  const roles = db.prepare('SELECT * FROM roles ORDER BY category, display_name').all();

  // Group by category
  const grouped = {
    department: roles.filter(r => r.category === 'department'),
    admin: roles.filter(r => r.category === 'admin')
  };

  res.json({ roles, grouped });
};

