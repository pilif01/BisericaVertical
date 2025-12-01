const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'database.db');

let db = null;

function getDatabase() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL'); // Better performance
  }
  return db;
}

function closeDatabase() {
  if (db) {
    db.close();
    db = null;
  }
}

module.exports = {
  getDatabase,
  closeDatabase
};

