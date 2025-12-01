const { getDatabase } = require('../config/database');

/**
 * Get all songs with filters
 */
exports.getAllSongs = (req, res) => {
  const { search, key, tags, artist, limit = 50 } = req.query;
  const db = getDatabase();

  let query = `
    SELECT s.*, u.full_name as created_by_name,
           (SELECT COUNT(*) FROM song_files WHERE song_id = s.id) as files_count
    FROM songs s
    LEFT JOIN users u ON s.created_by = u.id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (s.title LIKE ? OR s.artist LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (key) {
    query += ` AND s.key_signature = ?`;
    params.push(key);
  }

  if (artist) {
    query += ` AND s.artist LIKE ?`;
    params.push(`%${artist}%`);
  }

  if (tags) {
    query += ` AND s.tags LIKE ?`;
    params.push(`%${tags}%`);
  }

  query += ` ORDER BY s.times_used DESC, s.title ASC LIMIT ?`;
  params.push(parseInt(limit));

  const songs = db.prepare(query).all(...params);

  // Add available_keys for each song
  for (const song of songs) {
    const keys = db.prepare(`
      SELECT sk.id, sk.key_signature, sk.is_original,
             (SELECT COUNT(*) FROM song_key_files WHERE song_key_id = sk.id) as files_count
      FROM song_keys sk
      WHERE sk.song_id = ?
      ORDER BY sk.is_original DESC, sk.key_signature ASC
    `).all(song.id);
    song.available_keys = keys;
  }

  res.json({ songs });
};

/**
 * Get song by ID
 */
exports.getSongById = (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  const song = db.prepare(`
    SELECT s.*, u.full_name as created_by_name
    FROM songs s
    LEFT JOIN users u ON s.created_by = u.id
    WHERE s.id = ?
  `).get(id);

  if (!song) {
    return res.status(404).json({ error: 'Song not found' });
  }

  // Get files
  const files = db.prepare(`
    SELECT f.*, u.full_name as uploaded_by_name
    FROM song_files f
    LEFT JOIN users u ON f.uploaded_by = u.id
    WHERE f.song_id = ?
    ORDER BY f.uploaded_at DESC
  `).all(id);

  song.files = files;

  // Get available keys with file counts
  const keys = db.prepare(`
    SELECT sk.*,
           u.full_name as created_by_name,
           (SELECT COUNT(*) FROM song_key_files WHERE song_key_id = sk.id) as files_count
    FROM song_keys sk
    LEFT JOIN users u ON sk.created_by = u.id
    WHERE sk.song_id = ?
    ORDER BY sk.is_original DESC, sk.key_signature ASC
  `).all(id);

  song.available_keys = keys;

  res.json({ song });
};

/**
 * Create song
 */
exports.createSong = (req, res) => {
  const {
    title, artist, album, key_signature, tempo, time_signature,
    lyrics, chords, structure, youtube_url, spotify_url,
    tags, language, ccli_number
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  const db = getDatabase();

  const result = db.prepare(`
    INSERT INTO songs (
      title, artist, album, key_signature, tempo, time_signature,
      lyrics, chords, structure, youtube_url, spotify_url,
      tags, language, ccli_number, lyrics_with_chords, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    title, artist || null, album || null, key_signature || null,
    tempo || null, time_signature || '4/4', lyrics || null, chords || null,
    structure || null, youtube_url || null, spotify_url || null,
    tags || null, language || 'ro', ccli_number || null, null, req.user.id
  );

  const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(result.lastInsertRowid);

  res.status(201).json({ song, message: 'Song created successfully' });
};

/**
 * Update song
 */
exports.updateSong = (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(id);

  if (!song) {
    return res.status(404).json({ error: 'Song not found' });
  }

  const {
    title, artist, album, key_signature, tempo, time_signature,
    lyrics, chords, structure, youtube_url, spotify_url,
    tags, language, ccli_number, lyrics_with_chords
  } = req.body;

  db.prepare(`
    UPDATE songs
    SET title = COALESCE(?, title),
        artist = ?,
        album = ?,
        key_signature = ?,
        tempo = ?,
        time_signature = COALESCE(?, time_signature),
        lyrics = ?,
        chords = ?,
        structure = ?,
        youtube_url = ?,
        spotify_url = ?,
        tags = ?,
        language = COALESCE(?, language),
        ccli_number = ?,
        lyrics_with_chords = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(
    title, artist, album, key_signature, tempo, time_signature,
    lyrics, chords, structure, youtube_url, spotify_url,
    tags, language, ccli_number, lyrics_with_chords, id
  );

  const updated = db.prepare('SELECT * FROM songs WHERE id = ?').get(id);

  res.json({ song: updated, message: 'Song updated successfully' });
};

/**
 * Delete song
 */
exports.deleteSong = (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(id);

  if (!song) {
    return res.status(404).json({ error: 'Song not found' });
  }

  db.prepare('DELETE FROM songs WHERE id = ?').run(id);

  res.json({ message: 'Song deleted successfully' });
};

/**
 * Get recently used songs
 */
exports.getRecentlyUsed = (req, res) => {
  const db = getDatabase();

  const songs = db.prepare(`
    SELECT *
    FROM songs
    WHERE times_used > 0
    ORDER BY last_used_date DESC, times_used DESC
    LIMIT 20
  `).all();

  res.json({ songs });
};

// ============================================
// SONG KEYS FUNCTIONS
// ============================================

/**
 * Get all keys for a song
 */
exports.getSongKeys = (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  // Check if song exists
  const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(id);
  if (!song) {
    return res.status(404).json({ error: 'Song not found' });
  }

  // Get all keys with file counts
  const keys = db.prepare(`
    SELECT sk.*,
           u.full_name as created_by_name,
           (SELECT COUNT(*) FROM song_key_files WHERE song_key_id = sk.id) as files_count
    FROM song_keys sk
    LEFT JOIN users u ON sk.created_by = u.id
    WHERE sk.song_id = ?
    ORDER BY sk.is_original DESC, sk.key_signature ASC
  `).all(id);

  // Get files for each key
  for (const key of keys) {
    key.files = db.prepare(`
      SELECT skf.*, u.full_name as uploaded_by_name
      FROM song_key_files skf
      LEFT JOIN users u ON skf.uploaded_by = u.id
      WHERE skf.song_key_id = ?
      ORDER BY skf.uploaded_at DESC
    `).all(key.id);
  }

  res.json({ keys });
};

/**
 * Add a key to a song
 */
exports.addSongKey = (req, res) => {
  const { id } = req.params;
  const { key_signature, is_original = false, notes = null } = req.body;

  if (!key_signature) {
    return res.status(400).json({ error: 'Key signature is required' });
  }

  const db = getDatabase();

  // Check if song exists
  const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(id);
  if (!song) {
    return res.status(404).json({ error: 'Song not found' });
  }

  // Check if key already exists
  const existingKey = db.prepare('SELECT * FROM song_keys WHERE song_id = ? AND key_signature = ?').get(id, key_signature);
  if (existingKey) {
    return res.status(409).json({ error: 'This key already exists for this song' });
  }

  try {
    const result = db.prepare(`
      INSERT INTO song_keys (song_id, key_signature, is_original, notes, created_by)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, key_signature, is_original ? 1 : 0, notes, req.user.id);

    const newKey = db.prepare('SELECT * FROM song_keys WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({ key: newKey, message: 'Key added successfully' });
  } catch (error) {
    console.error('Error adding key:', error);
    res.status(500).json({ error: 'Failed to add key' });
  }
};

/**
 * Update a key
 */
exports.updateSongKey = (req, res) => {
  const { id, keyId } = req.params;
  const { key_signature, is_original, notes } = req.body;

  const db = getDatabase();

  // Check if key exists
  const key = db.prepare('SELECT * FROM song_keys WHERE id = ? AND song_id = ?').get(keyId, id);
  if (!key) {
    return res.status(404).json({ error: 'Key not found' });
  }

  try {
    db.prepare(`
      UPDATE song_keys
      SET key_signature = COALESCE(?, key_signature),
          is_original = COALESCE(?, is_original),
          notes = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(key_signature, is_original, notes, keyId);

    const updated = db.prepare('SELECT * FROM song_keys WHERE id = ?').get(keyId);

    res.json({ key: updated, message: 'Key updated successfully' });
  } catch (error) {
    console.error('Error updating key:', error);
    res.status(500).json({ error: 'Failed to update key' });
  }
};

/**
 * Delete a key
 */
exports.deleteSongKey = (req, res) => {
  const { id, keyId } = req.params;
  const db = getDatabase();

  // Check if key exists
  const key = db.prepare('SELECT * FROM song_keys WHERE id = ? AND song_id = ?').get(keyId, id);
  if (!key) {
    return res.status(404).json({ error: 'Key not found' });
  }

  try {
    // Delete will cascade to song_key_files
    db.prepare('DELETE FROM song_keys WHERE id = ?').run(keyId);

    res.json({ message: 'Key deleted successfully' });
  } catch (error) {
    console.error('Error deleting key:', error);
    res.status(500).json({ error: 'Failed to delete key' });
  }
};

// ============================================
// SONG KEY FILES FUNCTIONS
// ============================================

/**
 * Get files for a specific key
 */
exports.getKeyFiles = (req, res) => {
  const { id, keyId } = req.params;
  const db = getDatabase();

  // Check if key exists
  const key = db.prepare('SELECT * FROM song_keys WHERE id = ? AND song_id = ?').get(keyId, id);
  if (!key) {
    return res.status(404).json({ error: 'Key not found' });
  }

  const files = db.prepare(`
    SELECT skf.*, u.full_name as uploaded_by_name
    FROM song_key_files skf
    LEFT JOIN users u ON skf.uploaded_by = u.id
    WHERE skf.song_key_id = ?
    ORDER BY skf.uploaded_at DESC
  `).all(keyId);

  res.json({ files });
};

/**
 * Upload file for a key
 */
exports.uploadKeyFile = (req, res) => {
  const multer = require('multer');
  const path = require('path');
  const fs = require('fs');

  // Configure multer for file upload
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(__dirname, '..', 'uploads', 'song-keys');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `song-${req.params.id}-key-${req.params.keyId}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });

  const upload = multer({
    storage: storage,
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB max
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /pdf|docx|doc|txt|jpeg|jpg|png|mp3|wav|midi/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Invalid file type. Allowed: PDF, DOCX, TXT, images, audio files'));
      }
    }
  }).single('file');

  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { id, keyId } = req.params;
    const { file_type } = req.body;

    const db = getDatabase();

    // Check if key exists
    const key = db.prepare('SELECT * FROM song_keys WHERE id = ? AND song_id = ?').get(keyId, id);
    if (!key) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: 'Key not found' });
    }

    try {
      const result = db.prepare(`
        INSERT INTO song_key_files (song_key_id, file_type, filename, file_path, file_size, mime_type, uploaded_by)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        keyId,
        file_type || 'other',
        req.file.originalname,
        req.file.path,
        req.file.size,
        req.file.mimetype,
        req.user.id
      );

      const newFile = db.prepare('SELECT * FROM song_key_files WHERE id = ?').get(result.lastInsertRowid);

      res.status(201).json({ file: newFile, message: 'File uploaded successfully' });
    } catch (error) {
      // Delete uploaded file on error
      fs.unlinkSync(req.file.path);
      console.error('Error saving file info:', error);
      res.status(500).json({ error: 'Failed to save file' });
    }
  });
};

/**
 * Delete a file from a key
 */
exports.deleteKeyFile = (req, res) => {
  const { id, keyId, fileId } = req.params;
  const fs = require('fs');
  const db = getDatabase();

  // Check if file exists
  const file = db.prepare(`
    SELECT skf.*
    FROM song_key_files skf
    JOIN song_keys sk ON skf.song_key_id = sk.id
    WHERE skf.id = ? AND sk.id = ? AND sk.song_id = ?
  `).get(fileId, keyId, id);

  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  try {
    // Delete file from filesystem
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }

    // Delete from database
    db.prepare('DELETE FROM song_key_files WHERE id = ?').run(fileId);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};

