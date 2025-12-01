/**
 * Add 2 new songs: Worthy and Zideste In Mine
 */

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '..', 'database.db');
const UPLOADS_PATH = path.join(__dirname, '..', 'uploads', 'songs');

console.log('🎵 Adding 2 new songs...');

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// Get Filip (admin) ID
const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('Filip');
if (!admin) {
  console.error('❌ Filip user not found!');
  process.exit(1);
}

const songs = [
  { 
    title: 'Worthy (Vrednic Ești Doar Tu)', 
    bpm: 67, 
    keys: ['C', 'D'], 
    artist: 'Elevation Worship' 
  },
  { 
    title: 'Zideste In Mine', 
    bpm: 70, 
    keys: ['E', 'F'], 
    artist: 'Vertical Worship' 
  }
];

console.log('');

for (const song of songs) {
  // Insert song
  const insertSong = db.prepare(`
    INSERT INTO songs (title, artist, tempo, language, created_by, created_at, updated_at)
    VALUES (?, ?, ?, 'ro', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);
  
  const result = insertSong.run(song.title, song.artist, song.bpm, admin.id);
  const songId = result.lastInsertRowid;
  
  // Create folder for this song
  const songFolder = path.join(UPLOADS_PATH, `song_${songId}_${song.title.replace(/[^a-z0-9]/gi, '_')}`);
  if (!fs.existsSync(songFolder)) {
    fs.mkdirSync(songFolder, { recursive: true });
  }
  
  // Insert keys for this song
  const insertKey = db.prepare(`
    INSERT INTO song_keys (song_id, key_signature, is_original, created_by, created_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  
  song.keys.forEach((key, index) => {
    insertKey.run(songId, key, index === 0 ? 1 : 0, admin.id);
    
    // Create subfolder for each key
    const keyFolder = path.join(songFolder, key);
    if (!fs.existsSync(keyFolder)) {
      fs.mkdirSync(keyFolder, { recursive: true });
    }
  });
  
  console.log(`✅ Added: ${song.title}`);
  console.log(`   BPM: ${song.bpm}`);
  console.log(`   Keys: ${song.keys.join(', ')}`);
  console.log(`   Folder: ${songFolder}`);
  console.log('');
}

db.close();

console.log('🎉 Done! 2 melodii adăugate cu succes!');
console.log('');
console.log('Total melodii în DB acum: 102');

