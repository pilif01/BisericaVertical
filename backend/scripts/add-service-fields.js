/**
 * Add new fields to services table: preacher, leader, sermon_title
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.db');

console.log('🔄 Adding new fields to services table...');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

try {
  // Add preacher column
  db.exec(`ALTER TABLE services ADD COLUMN preacher TEXT`);
  console.log('✅ Added column: preacher');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('⏭️  Column preacher already exists');
  } else {
    console.error('❌ Error adding preacher:', error.message);
  }
}

try {
  // Add leader column
  db.exec(`ALTER TABLE services ADD COLUMN leader TEXT`);
  console.log('✅ Added column: leader');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('⏭️  Column leader already exists');
  } else {
    console.error('❌ Error adding leader:', error.message);
  }
}

try {
  // Add sermon_title column
  db.exec(`ALTER TABLE services ADD COLUMN sermon_title TEXT`);
  console.log('✅ Added column: sermon_title');
} catch (error) {
  if (error.message.includes('duplicate column name')) {
    console.log('⏭️  Column sermon_title already exists');
  } else {
    console.error('❌ Error adding sermon_title:', error.message);
  }
}

db.close();

console.log('\n✅ Migration complete!');

