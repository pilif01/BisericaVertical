const { getDatabase } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');

    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['.pdf', '.mp3', '.mp4', '.jpg', '.jpeg', '.png'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: PDF, MP3, MP4, JPG, PNG'));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB max
  }
});

/**
 * Upload file for a song
 */
exports.uploadSongFile = [
  upload.single('file'),
  (req, res) => {
    const { songId } = req.params;
    const { category } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const db = getDatabase();

    // Check if song exists
    const song = db.prepare('SELECT id FROM songs WHERE id = ?').get(songId);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    // Determine file_type and file_category from extension
    const ext = path.extname(req.file.originalname).toLowerCase();
    let file_type = 'other';
    let file_category = category || 'pdf';

    if (['.pdf', '.doc', '.docx'].includes(ext)) {
      file_type = 'sheet';
      file_category = 'pdf';
    } else if (['.mp3', '.wav', '.m4a'].includes(ext)) {
      file_type = 'audio';
      file_category = 'audio';
    } else if (['.mp4', '.mov', '.avi'].includes(ext)) {
      file_type = 'video';
      file_category = 'video';
    }

    // Insert file record
    const result = db.prepare(`
      INSERT INTO song_files (song_id, file_type, filename, original_name, file_path, file_category, file_size, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      songId,
      file_type,
      req.file.filename,
      req.file.originalname,
      '/uploads/' + req.file.filename,
      file_category,
      req.file.size,
      req.user.id
    );

    const fileRecord = db.prepare('SELECT * FROM song_files WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      file: fileRecord,
      message: 'File uploaded successfully'
    });
  }
];

/**
 * Delete song file
 */
exports.deleteSongFile = (req, res) => {
  const { songId, fileId } = req.params;
  const db = getDatabase();

  const file = db.prepare(
    'SELECT * FROM song_files WHERE id = ? AND song_id = ?'
  ).get(fileId, songId);

  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Delete from filesystem
  const filePath = path.join(__dirname, '..', file.file_path);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  // Delete from database
  db.prepare('DELETE FROM song_files WHERE id = ?').run(fileId);

  res.json({ message: 'File deleted successfully' });
};

module.exports = exports;

