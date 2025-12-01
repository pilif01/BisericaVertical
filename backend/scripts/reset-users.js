/**
 * Reset Users Script
 * Șterge utilizatorii curenti și adaugă noile conturi pentru Vertical
 */

const Database = require('better-sqlite3');
const bcrypt = require('bcrypt');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.db');

console.log('🔄 Resetting users in database...');
console.log('📁 Database path:', DB_PATH);

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// ============================================
// 1. DELETE ALL EXISTING USERS
// ============================================
console.log('\n🗑️  Deleting all existing users and related data...');

// Delete in order to respect foreign key constraints
db.prepare('DELETE FROM audit_log').run();
db.prepare('DELETE FROM notifications').run();
db.prepare('DELETE FROM availability_votes').run();
db.prepare('DELETE FROM assignments').run();
db.prepare('DELETE FROM availability_polls').run();
db.prepare('DELETE FROM service_items').run();
db.prepare('DELETE FROM services').run();
db.prepare('DELETE FROM song_key_files').run();
db.prepare('DELETE FROM song_keys').run();
db.prepare('DELETE FROM song_files').run();
db.prepare('DELETE FROM songs').run();
db.prepare('DELETE FROM user_roles').run();
db.prepare('DELETE FROM users').run();

console.log('✅ All users and related data deleted');

// ============================================
// 2. CREATE NEW USERS
// ============================================
console.log('\n👥 Creating new Vertical accounts...');

const newUsers = [
  { username: 'Amedeea', email: 'amedeeahnatiuc@yahoo.com', password: 'amedeeah' },
  { username: 'Amelia', email: 'amelia.sophia1@icloud.com', password: 'ameliac' },
  { username: 'Ana', email: 'anagubernu129@gmail.com', password: 'anach' },
  { username: 'Bianca', email: 'biancaivascu007@gmail.com', password: 'biaiv' },
  { username: 'Bogdan', email: 'bogdan08ivascu@gmail.com', password: 'bogdiiv' },
  { username: 'Calin', email: 'czatic97@gmail.com', password: 'calinz' },
  { username: 'Criss', email: 'criss.neagu1000@yahoo.com', password: 'crissn' },
  { username: 'Daniel', email: 'chevron_dany@yahoo.com', password: 'danih' },
  { username: 'Eduard', email: 'maghetedu@gmail.com', password: 'edema' },
  { username: 'Filip', email: 'bulcfilip641@gmail.com', password: 'filipb' },
  { username: 'Georgiana', email: 'filipgeorgiana@yahoo.com', password: 'georgic' },
  { username: 'Iosua', email: 'iosuatiprigan@gmail.com', password: 'iosuati' },
  { username: 'Laurențiu', email: 'laumoa@gmail.com', password: 'lauma' },
  { username: 'Lois', email: 'bulclois@gmail.com', password: 'lois' },
  { username: 'Mălina', email: 'malina_basaraba@yahoo.com', password: 'malih' },
  { username: 'Marinusha', email: 'sinca_marinusha@yahoo.com', password: 'maris' },
  { username: 'Mathias', email: 'sincamathias@gmail.com', password: 'maths' },
  { username: 'Nicole', email: 'nicole_irimia@yahoo.com', password: 'nice' },
  { username: 'Robert', email: 'perjurobert@gmail.com', password: 'robertper' },
  { username: 'Vlad', email: 'vladchindea94@gmail.com', password: 'vlchd' },
  { username: 'Albert', email: 'feheralbert@yahoo.ro', password: 'feheralbert@yahoo.ro' },
  { username: 'Alin', email: 'alin.stanete@gmail.com', password: 'alinstan' },
  { username: 'Andreas', email: 'andreasmaghet@gmail.com', password: 'andreasmgh' },
  { username: 'ClaudiuH', email: 'hegedus.claudiu@gmail.com', password: 'claudiuheg' },
  { username: 'ClaudiuC', email: 'claudiuclauxiu95@gmail.com', password: 'claudiuclau' },
  { username: 'David', email: 'david.bilauca@gmail.com', password: 'davidB' },
  { username: 'Emanuel', email: 'emanuel.cocora@gmail.com', password: 'emco' },
  { username: 'MariusCristian', email: 'ignatoaiemariuscristian@yahoo.com', password: 'MariusCristian' },
  { username: 'Rebeca', email: 'rebeca.teban@gmail.com', password: 'Rebeca' }
];

const insertUser = db.prepare(`
  INSERT INTO users (username, password_hash, full_name, email, is_active, force_password_change)
  VALUES (?, ?, ?, ?, 1, 1)
`);

for (const user of newUsers) {
  const passwordHash = bcrypt.hashSync(user.password, 10);
  insertUser.run(user.username, passwordHash, user.username, user.email);
  console.log(`✅ Created user: ${user.username} (${user.email})`);
}

console.log(`\n✅ Created ${newUsers.length} users (all with force_password_change = 1)`);

// ============================================
// 3. MAKE FILIP SUPERADMIN
// ============================================
console.log('\n👑 Making Filip superadmin...');

const filipUser = db.prepare('SELECT id FROM users WHERE username = ?').get('Filip');
const adminGlobalRole = db.prepare('SELECT id FROM roles WHERE name = ?').get('admin_global');

if (filipUser && adminGlobalRole) {
  const insertUserRole = db.prepare(`
    INSERT INTO user_roles (user_id, role_id, assigned_at)
    VALUES (?, ?, ?)
  `);
  insertUserRole.run(filipUser.id, adminGlobalRole.id, new Date().toISOString());
  console.log('✅ Filip is now superadmin (admin_global)');
} else {
  console.log('❌ Could not assign superadmin role to Filip');
}

db.close();

console.log('\n🎉 Users reset successfully!');
console.log('\n📊 Summary:');
console.log(`   - All old users deleted`);
console.log(`   - ${newUsers.length} new users created`);
console.log(`   - All users must change password on first login`);
console.log(`   - Filip has superadmin access`);
console.log('\n✅ Ready to start server!');
console.log('   Command: npm start');

