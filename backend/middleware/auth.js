const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');

/**
 * Middleware pentru autentificare JWT
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database with roles
    const db = getDatabase();
    const user = db.prepare(`
      SELECT u.id, u.username, u.full_name, u.email, u.phone, u.avatar_path, u.is_active
      FROM users u
      WHERE u.id = ? AND u.is_active = 1
    `).get(decoded.userId);

    if (!user) {
      return res.status(403).json({ error: 'User not found or inactive' });
    }

    // Get user roles
    const roles = db.prepare(`
      SELECT r.name, r.display_name, r.category
      FROM roles r
      JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `).all(user.id);

    user.roles = roles.map(r => r.name);
    user.roleDetails = roles;

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Middleware pentru verificare rol specific
 */
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // admin_global are acces la tot
    if (req.user.roles.includes('admin_global')) {
      return next();
    }

    const hasRole = allowedRoles.some(role => req.user.roles.includes(role));
    
    if (!hasRole) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.roles
      });
    }

    next();
  };
}

/**
 * Check dacă user poate edita un serviciu
 */
function canEditService(user, service) {
  // Admin global poate tot
  if (user.roles.includes('admin_global')) {
    return true;
  }

  // Admin de departament poate edita serviciile proprii
  if (service.service_type === 'biserica_duminica' && user.roles.includes('admin_trupa')) {
    return true;
  }

  if (service.service_type === 'tineret_luni' && user.roles.includes('admin_tineret')) {
    return true;
  }

  if (service.service_type === 'special' && user.roles.includes('admin_special')) {
    return true;
  }

  // Check dacă user e creator
  if (service.created_by === user.id) {
    return true;
  }

  return false;
}

/**
 * Check dacă user poate vedea voturile pentru un serviciu
 */
function canViewVotes(user, service) {
  if (user.roles.includes('admin_global')) {
    return true;
  }

  if (service.service_type === 'biserica_duminica' && user.roles.includes('admin_trupa')) {
    return true;
  }

  if (service.service_type === 'tineret_luni' && user.roles.includes('admin_tineret')) {
    return true;
  }

  if (service.service_type === 'special' && user.roles.includes('admin_special')) {
    return true;
  }

  return false;
}

/**
 * Check dacă user poate crea assignments
 */
function canAssignVolunteers(user, roleType) {
  if (user.roles.includes('admin_global')) {
    return true;
  }

  // Admin de departament poate atribui doar în departamentul lui
  const adminRoleName = `admin_${roleType}`;
  if (user.roles.includes(adminRoleName)) {
    return true;
  }

  return false;
}

module.exports = {
  authenticateToken,
  requireRole,
  canEditService,
  canViewVotes,
  canAssignVolunteers
};

