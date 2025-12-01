/**
 * Database Initialization Script
 * Creates all 13 tables for Planning Center
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.db');

console.log('🚀 Initializing database...');
console.log('📁 Database path:', DB_PATH);

const db = new Database(DB_PATH);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// ============================================
// 1. USERS
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    avatar_path TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log('✅ Table created: users');

// ============================================
// 2. ROLES
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS roles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log('✅ Table created: roles');

// ============================================
// 3. USER_ROLES (many-to-many)
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS user_roles (
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role_id INTEGER REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
  );

  CREATE INDEX IF NOT EXISTS idx_user_roles_user ON user_roles(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_roles_role ON user_roles(role_id);
`);
console.log('✅ Table created: user_roles');

// ============================================
// 4. SERVICES
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    service_type TEXT NOT NULL,
    date DATE NOT NULL,
    time TEXT NOT NULL,
    end_time TEXT,
    location TEXT,
    status TEXT DEFAULT 'draft',
    voting_open BOOLEAN DEFAULT 0,
    voting_deadline DATETIME,
    description TEXT,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_services_date ON services(date);
  CREATE INDEX IF NOT EXISTS idx_services_type ON services(service_type);
  CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
`);
console.log('✅ Table created: services');

// ============================================
// 5. SERVICE_ITEMS (ordine liturgică)
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS service_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    order_position INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    duration INTEGER,
    notes TEXT,
    song_id INTEGER REFERENCES songs(id),
    key_signature TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_service_items_service ON service_items(service_id);
`);
console.log('✅ Table created: service_items');

// ============================================
// 6. SONGS
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS songs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    artist TEXT,
    album TEXT,
    key_signature TEXT,
    tempo INTEGER,
    time_signature TEXT DEFAULT '4/4',
    lyrics TEXT,
    chords TEXT,
    lyrics_with_chords TEXT,
    structure TEXT,
    youtube_url TEXT,
    spotify_url TEXT,
    tags TEXT,
    language TEXT DEFAULT 'ro',
    ccli_number TEXT,
    times_used INTEGER DEFAULT 0,
    last_used_date DATE,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_songs_title ON songs(title);
  CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist);
`);
console.log('✅ Table created: songs');

// ============================================
// 7. SONG_FILES (general files for songs)
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS song_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
    file_type TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log('✅ Table created: song_files');

// ============================================
// 7B. SONG_KEYS (tonalități și fișiere)
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS song_keys (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_id INTEGER REFERENCES songs(id) ON DELETE CASCADE,
    key_signature TEXT NOT NULL,
    is_original BOOLEAN DEFAULT 0,
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(song_id, key_signature)
  );

  CREATE INDEX IF NOT EXISTS idx_song_keys_song ON song_keys(song_id);
`);
console.log('✅ Table created: song_keys');

// ============================================
// 7C. SONG_KEY_FILES (fișiere pentru tonalități)
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS song_key_files (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    song_key_id INTEGER REFERENCES song_keys(id) ON DELETE CASCADE,
    file_type TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by INTEGER REFERENCES users(id),
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_song_key_files_key ON song_key_files(song_key_id);
`);
console.log('✅ Table created: song_key_files');

// ============================================
// 8. AVAILABILITY_POLLS
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS availability_polls (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    role_type TEXT NOT NULL,
    required_count INTEGER DEFAULT 1,
    deadline DATETIME NOT NULL,
    is_closed BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_polls_service ON availability_polls(service_id);
`);
console.log('✅ Table created: availability_polls');

// ============================================
// 9. AVAILABILITY_VOTES
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS availability_votes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    poll_id INTEGER REFERENCES availability_polls(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    vote TEXT NOT NULL CHECK(vote IN ('available', 'maybe', 'unavailable')),
    notes TEXT,
    voted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_id, user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_votes_poll ON availability_votes(poll_id);
  CREATE INDEX IF NOT EXISTS idx_votes_user ON availability_votes(user_id);
`);
console.log('✅ Table created: availability_votes');

// ============================================
// 10. ASSIGNMENTS
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id),
    role_type TEXT NOT NULL,
    role_detail TEXT,
    status TEXT DEFAULT 'pending',
    notes TEXT,
    decline_reason TEXT,
    assigned_by INTEGER REFERENCES users(id),
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    confirmed_at DATETIME,
    reminder_sent BOOLEAN DEFAULT 0,
    reminder_sent_at DATETIME
  );

  CREATE INDEX IF NOT EXISTS idx_assignments_service ON assignments(service_id);
  CREATE INDEX IF NOT EXISTS idx_assignments_user ON assignments(user_id);
  CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);
`);
console.log('✅ Table created: assignments');

// ============================================
// 11. NOTIFICATIONS
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    action_url TEXT,
    action_label TEXT,
    is_read BOOLEAN DEFAULT 0,
    read_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
`);
console.log('✅ Table created: notifications');

// ============================================
// 12. SERVICE_TEMPLATES
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS service_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    service_type TEXT NOT NULL,
    description TEXT,
    items_json TEXT,
    roles_json TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log('✅ Table created: service_templates');

// ============================================
// 13. AUDIT_LOG
// ============================================
db.exec(`
  CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER,
    details TEXT,
    ip_address TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_log(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
`);
console.log('✅ Table created: audit_log');

db.close();

console.log('');
console.log('🎉 Database initialized successfully!');
console.log('📊 Total tables created: 13');
console.log('');
console.log('Next step: Run seed script to populate initial data');
console.log('Command: npm run db:seed');
