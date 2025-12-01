/**
 * Fix Filip Roles - Make him superadmin + add trupa member role
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.db');

console.log('🔧 Fixing Filip roles...');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

const filip = db.prepare('SELECT id FROM users WHERE username = ?').get('Filip');

if (!filip) {
  console.error('❌ Filip not found!');
  process.exit(1);
}

// Get roles
const adminGlobal = db.prepare('SELECT id FROM roles WHERE name = ?').get('admin_global');
const trupaRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('trupa');
const adminTrupaRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('admin_trupa');

// Clear existing roles
db.prepare('DELETE FROM user_roles WHERE user_id = ?').run(filip.id);

// Add roles
const insertRole = db.prepare(`
  INSERT INTO user_roles (user_id, role_id, assigned_at)
  VALUES (?, ?, CURRENT_TIMESTAMP)
`);

// Admin Global (Superadmin) - DOAR ASTA
if (adminGlobal) {
  insertRole.run(filip.id, adminGlobal.id);
  console.log('✅ Added: admin_global (Superadmin)');
}

// Verify
const roles = db.prepare(`
  SELECT r.name, r.display_name
  FROM roles r
  JOIN user_roles ur ON r.id = ur.role_id
  WHERE ur.user_id = ?
`).all(filip.id);

console.log('\n✅ Roluri Filip:');
roles.forEach(r => console.log(`   - ${r.name} (${r.display_name})`));

db.close();

console.log('\n🎉 Done! Filip is now superadmin + admin trupă + membru trupă');

