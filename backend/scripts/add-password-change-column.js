/**
 * Migration Script: Add force_password_change column to users table
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.db');

console.log('🔄 Adding force_password_change column to users table...');
console.log('📁 Database path:', DB_PATH);

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

try {
  // Check if column already exists
  const tableInfo = db.prepare('PRAGMA table_info(users)').all();
  const columnExists = tableInfo.some(col => col.name === 'force_password_change');

  if (columnExists) {
    console.log('✅ Column force_password_change already exists');
  } else {
    db.exec(`
      ALTER TABLE users ADD COLUMN force_password_change BOOLEAN DEFAULT 0
    `);
    console.log('✅ Column force_password_change added successfully');
  }
} catch (error) {
  console.error('❌ Error:', error.message);
} finally {
  db.close();
}

console.log('\n✅ Migration complete!');

