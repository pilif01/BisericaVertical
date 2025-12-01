const { getDatabase } = require('../config/database');
const path = require('path');
const fs = require('fs').promises;
const { 
  extractTextFromPDF, 
  detectChordType, 
  generateAllTranspositions,
  createTransposedPDF
} = require('../utils/pdfProcessor');
const { 
  getAudioMetadata, 
  generateAllAudioTranspositions,
  calculateSemitones,
  transposeAudio
} = require('../utils/audioProcessor');

/**
 * Upload PDF for a specific song key
 */
exports.uploadPDF = async (req, res) => {
  try {
    const { songId, keySignature } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ error: 'File must be a PDF' });
    }
    
    const db = getDatabase();
    
    // Get song details
    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(songId);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    
    // Get or create song_key
    let songKey = db.prepare('SELECT * FROM song_keys WHERE song_id = ? AND key_signature = ?')
      .get(songId, keySignature);
    
    if (!songKey) {
      // Create new key
      const insertKey = db.prepare(`
        INSERT INTO song_keys (song_id, key_signature, is_original, created_by)
        VALUES (?, ?, 0, ?)
      `);
      const result = insertKey.run(songId, keySignature, req.user.id);
      songKey = { id: result.lastInsertRowid, song_id: songId, key_signature: keySignature };
    }
    
    // Create folder structure: uploads/songs/song_{id}_{name}/{key}/
    const songFolderName = `song_${song.id}_${song.title.replace(/[^a-z0-9]/gi, '_')}`;
    const keyFolder = path.join(__dirname, '..', 'uploads', 'songs', songFolderName, keySignature);
    await fs.mkdir(keyFolder, { recursive: true });
    
    // Save PDF
    const pdfFileName = `${song.title.replace(/[^a-z0-9]/gi, '_')}_${keySignature}.pdf`;
    const pdfPath = path.join(keyFolder, pdfFileName);
    await fs.rename(req.file.path, pdfPath);
    
    // Extract text and detect chord type
    let chordInfo = null;
    try {
      const pdfText = await extractTextFromPDF(pdfPath);
      chordInfo = detectChordType(pdfText);
    } catch (error) {
      console.error('Error analyzing PDF:', error);
    }
    
    // Save file record
    const insertFile = db.prepare(`
      INSERT INTO song_key_files (song_key_id, file_type, filename, file_path, file_size, mime_type, uploaded_by)
      VALUES (?, 'pdf', ?, ?, ?, 'application/pdf', ?)
    `);
    
    const stats = await fs.stat(pdfPath);
    insertFile.run(
      songKey.id,
      pdfFileName,
      pdfPath,
      stats.size,
      req.user.id
    );
    
    res.json({
      message: 'PDF uploaded successfully',
      file: {
        filename: pdfFileName,
        path: pdfPath,
        size: stats.size,
        chordType: chordInfo?.type || 'unknown',
        chordCount: chordInfo?.count || 0
      }
    });
  } catch (error) {
    console.error('Error uploading PDF:', error);
    res.status(500).json({ error: 'Failed to upload PDF', details: error.message });
  }
};

/**
 * Upload audio for a specific song key
 */
exports.uploadAudio = async (req, res) => {
  try {
    const { songId, keySignature } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const allowedMimeTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a'];
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ error: 'File must be audio (MP3, WAV, M4A)' });
    }
    
    const db = getDatabase();
    
    // Get song details
    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(songId);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    
    // Get or create song_key
    let songKey = db.prepare('SELECT * FROM song_keys WHERE song_id = ? AND key_signature = ?')
      .get(songId, keySignature);
    
    if (!songKey) {
      const insertKey = db.prepare(`
        INSERT INTO song_keys (song_id, key_signature, is_original, created_by)
        VALUES (?, ?, 0, ?)
      `);
      const result = insertKey.run(songId, keySignature, req.user.id);
      songKey = { id: result.lastInsertRowid, song_id: songId, key_signature: keySignature };
    }
    
    // Create folder structure
    const songFolderName = `song_${song.id}_${song.title.replace(/[^a-z0-9]/gi, '_')}`;
    const keyFolder = path.join(__dirname, '..', 'uploads', 'songs', songFolderName, keySignature);
    await fs.mkdir(keyFolder, { recursive: true });
    
    // Save audio file
    const ext = path.extname(req.file.originalname);
    const audioFileName = `${song.title.replace(/[^a-z0-9]/gi, '_')}_${keySignature}${ext}`;
    const audioPath = path.join(keyFolder, audioFileName);
    await fs.rename(req.file.path, audioPath);
    
    // Extract metadata
    let metadata = null;
    try {
      metadata = await getAudioMetadata(audioPath);
    } catch (error) {
      console.error('Error extracting audio metadata:', error);
    }
    
    // Save file record
    const insertFile = db.prepare(`
      INSERT INTO song_key_files (song_key_id, file_type, filename, file_path, file_size, mime_type, uploaded_by)
      VALUES (?, 'audio', ?, ?, ?, ?, ?)
    `);
    
    const stats = await fs.stat(audioPath);
    insertFile.run(
      songKey.id,
      audioFileName,
      audioPath,
      stats.size,
      req.file.mimetype,
      req.user.id
    );
    
    res.json({
      message: 'Audio uploaded successfully',
      file: {
        filename: audioFileName,
        path: audioPath,
        size: stats.size,
        metadata: metadata
      }
    });
  } catch (error) {
    console.error('Error uploading audio:', error);
    res.status(500).json({ error: 'Failed to upload audio', details: error.message });
  }
};

/**
 * Generate transposed PDFs for all keys
 */
exports.generateTransposedPDFs = async (req, res) => {
  try {
    const { songId, originalKey } = req.body;
    
    const db = getDatabase();
    
    // Get song
    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(songId);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    
    // Get all keys for this song
    const keys = db.prepare('SELECT key_signature FROM song_keys WHERE song_id = ?').all(songId);
    const targetKeys = keys.map(k => k.key_signature);
    
    // Find original PDF
    const originalKeyRecord = db.prepare('SELECT id FROM song_keys WHERE song_id = ? AND key_signature = ?')
      .get(songId, originalKey);
    
    if (!originalKeyRecord) {
      return res.status(404).json({ error: 'Original key not found' });
    }
    
    const originalPdfRecord = db.prepare(`
      SELECT file_path FROM song_key_files 
      WHERE song_key_id = ? AND file_type = 'pdf'
      ORDER BY uploaded_at DESC LIMIT 1
    `).get(originalKeyRecord.id);
    
    if (!originalPdfRecord) {
      return res.status(404).json({ error: 'Original PDF not found' });
    }
    
    // Generate transpositions
    const songFolderName = `song_${song.id}_${song.title.replace(/[^a-z0-9]/gi, '_')}`;
    const baseOutputDir = path.join(__dirname, '..', 'uploads', 'songs', songFolderName);
    
    const results = await generateAllTranspositions(
      originalPdfRecord.file_path,
      originalKey,
      targetKeys,
      baseOutputDir
    );
    
    // Save generated files to database
    for (const result of results) {
      if (result.success) {
        const keyRecord = db.prepare('SELECT id FROM song_keys WHERE song_id = ? AND key_signature = ?')
          .get(songId, result.key);
        
        if (keyRecord) {
          const insertFile = db.prepare(`
            INSERT INTO song_key_files (song_key_id, file_type, filename, file_path, file_size, mime_type, uploaded_by)
            VALUES (?, 'pdf', ?, ?, 0, 'application/pdf', ?)
          `);
          
          insertFile.run(
            keyRecord.id,
            path.basename(result.path),
            result.path,
            req.user.id
          );
        }
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    res.json({
      message: `Generated ${successCount} transposed PDFs`,
      success: successCount,
      failed: failCount,
      results: results
    });
  } catch (error) {
    console.error('Error generating transposed PDFs:', error);
    res.status(500).json({ error: 'Failed to generate transposed PDFs', details: error.message });
  }
};

/**
 * Generate transposed audio files for all keys
 */
exports.generateTransposedAudio = async (req, res) => {
  try {
    const { songId, originalKey } = req.body;
    
    const db = getDatabase();
    
    // Get song
    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(songId);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }
    
    // Get all keys for this song
    const keys = db.prepare('SELECT key_signature FROM song_keys WHERE song_id = ?').all(songId);
    const targetKeys = keys.map(k => k.key_signature);
    
    // Find original audio
    const originalKeyRecord = db.prepare('SELECT id FROM song_keys WHERE song_id = ? AND key_signature = ?')
      .get(songId, originalKey);
    
    if (!originalKeyRecord) {
      return res.status(404).json({ error: 'Original key not found' });
    }
    
    const originalAudioRecord = db.prepare(`
      SELECT file_path FROM song_key_files 
      WHERE song_key_id = ? AND file_type = 'audio'
      ORDER BY uploaded_at DESC LIMIT 1
    `).get(originalKeyRecord.id);
    
    if (!originalAudioRecord) {
      return res.status(404).json({ error: 'Original audio not found' });
    }
    
    // Generate transpositions
    const songFolderName = `song_${song.id}_${song.title.replace(/[^a-z0-9]/gi, '_')}`;
    const baseOutputDir = path.join(__dirname, '..', 'uploads', 'songs', songFolderName);
    
    const results = await generateAllAudioTranspositions(
      originalAudioRecord.file_path,
      originalKey,
      targetKeys,
      baseOutputDir
    );
    
    // Save generated files to database
    for (const result of results) {
      if (result.success) {
        const keyRecord = db.prepare('SELECT id FROM song_keys WHERE song_id = ? AND key_signature = ?')
          .get(songId, result.key);
        
        if (keyRecord) {
          const insertFile = db.prepare(`
            INSERT INTO song_key_files (song_key_id, file_type, filename, file_path, file_size, mime_type, uploaded_by)
            VALUES (?, 'audio', ?, ?, 0, 'audio/mpeg', ?)
          `);
          
          insertFile.run(
            keyRecord.id,
            path.basename(result.path),
            result.path,
            req.user.id
          );
        }
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;
    
    res.json({
      message: `Generated ${successCount} transposed audio files`,
      success: successCount,
      failed: failCount,
      results: results
    });
  } catch (error) {
    console.error('Error generating transposed audio:', error);
    res.status(500).json({ error: 'Failed to generate transposed audio', details: error.message });
  }
};

/**
 * Get all files for a song
 */
exports.getSongFiles = async (req, res) => {
  try {
    const { songId } = req.params;
    
    const db = getDatabase();
    
    const files = db.prepare(`
      SELECT 
        skf.*,
        sk.key_signature,
        sk.is_original
      FROM song_key_files skf
      JOIN song_keys sk ON skf.song_key_id = sk.id
      WHERE sk.song_id = ?
      ORDER BY sk.key_signature, skf.file_type, skf.uploaded_at DESC
    `).all(songId);
    
    // Group by key
    const filesByKey = {};
    files.forEach(file => {
      if (!filesByKey[file.key_signature]) {
        filesByKey[file.key_signature] = {
          key: file.key_signature,
          is_original: file.is_original === 1,
          pdf: [],
          audio: []
        };
      }
      
      if (file.file_type === 'pdf') {
        filesByKey[file.key_signature].pdf.push(file);
      } else if (file.file_type === 'audio') {
        filesByKey[file.key_signature].audio.push(file);
      }
    });
    
    res.json({
      songId: parseInt(songId),
      files: Object.values(filesByKey)
    });
  } catch (error) {
    console.error('Error getting song files:', error);
    res.status(500).json({ error: 'Failed to get song files' });
  }
};

/**
 * Delete a file
 */
exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    
    const db = getDatabase();
    
    const file = db.prepare('SELECT * FROM song_key_files WHERE id = ?').get(fileId);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Delete physical file
    try {
      await fs.unlink(file.file_path);
    } catch (error) {
      console.error('Error deleting physical file:', error);
    }
    
    // Delete database record
    db.prepare('DELETE FROM song_key_files WHERE id = ?').run(fileId);
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
};

/**
 * Transpose a PDF chord sheet to a new key
 */
exports.transposePdfFile = async (req, res) => {
  try {
    const { filePath, originalKey, targetKey } = req.body;

    if (!filePath || !originalKey || !targetKey) {
      return res.status(400).json({ error: 'filePath, originalKey și targetKey sunt obligatorii' });
    }

    if (originalKey === targetKey) {
      return res.status(400).json({ error: 'Tonalitatea țintă trebuie să fie diferită' });
    }

    const resolvedPaths = resolveUploadsPath(filePath);
    const ext = path.extname(resolvedPaths.absolute).toLowerCase();
    if (ext !== '.pdf') {
      return res.status(400).json({ error: 'Fișierul selectat nu este PDF' });
    }

    await fs.stat(resolvedPaths.absolute);

    const baseName = path.basename(resolvedPaths.absolute, ext);
    const outputFileName = `${baseName}_${targetKey}.pdf`;
    const outputAbsolute = path.join(path.dirname(resolvedPaths.absolute), outputFileName);

    await createTransposedPDF(resolvedPaths.absolute, originalKey, targetKey, outputAbsolute);

    res.json({
      message: 'PDF-ul a fost transpus',
      file: {
        filename: outputFileName,
        path: toRelativeUploadsPath(outputAbsolute)
      }
    });
  } catch (error) {
    console.error('Error transposing PDF:', error);
    res.status(500).json({ error: 'Nu am putut transpune PDF-ul', details: error.message });
  }
};

/**
 * Transpose an audio file using FFmpeg pitch shift
 */
exports.transposeAudioFile = async (req, res) => {
  try {
    const { filePath, originalKey, targetKey } = req.body;

    if (!filePath || !originalKey || !targetKey) {
      return res.status(400).json({ error: 'filePath, originalKey și targetKey sunt obligatorii' });
    }

    if (originalKey === targetKey) {
      return res.status(400).json({ error: 'Tonalitatea țintă trebuie să fie diferită' });
    }

    const resolvedPaths = resolveUploadsPath(filePath);
    const ext = path.extname(resolvedPaths.absolute).toLowerCase();
    const allowed = ['.mp3', '.wav', '.m4a'];
    if (!allowed.includes(ext)) {
      return res.status(400).json({ error: 'Fișierul selectat nu este audio suportat (MP3, WAV, M4A)' });
    }

    await fs.stat(resolvedPaths.absolute);

    const semitones = calculateSemitones(originalKey, targetKey);
    const baseName = path.basename(resolvedPaths.absolute, ext);
    const outputFileName = `${baseName}_${targetKey}${ext}`;
    const outputAbsolute = path.join(path.dirname(resolvedPaths.absolute), outputFileName);

    await transposeAudio(resolvedPaths.absolute, outputAbsolute, semitones);

    res.json({
      message: 'Fișierul audio a fost transpus',
      file: {
        filename: outputFileName,
        path: toRelativeUploadsPath(outputAbsolute)
      }
    });
  } catch (error) {
    console.error('Error transposing audio:', error);
    const status = /ffmpeg/i.test(error.message) ? 400 : 500;
    res.status(status).json({ error: 'Nu am putut transpune fișierul audio', details: error.message });
  }
};

function resolveUploadsPath(requestedPath) {
  if (!requestedPath || !requestedPath.startsWith('/uploads/')) {
    throw new Error('Invalid file path');
  }
  const uploadsRoot = path.join(__dirname, '..', 'uploads');
  const relativeFromRoot = requestedPath.replace(/^\/+/, '').replace(/\\/g, '/');
  const absolute = path.join(__dirname, '..', relativeFromRoot);
  if (!absolute.startsWith(uploadsRoot)) {
    throw new Error('Path outside uploads directory');
  }
  return { absolute, relative: '/' + relativeFromRoot };
}

function toRelativeUploadsPath(absolutePath) {
  const root = path.join(__dirname, '..');
  const relative = path.relative(root, absolutePath).replace(/\\/g, '/');
  return relative.startsWith('/') ? `/${relative.replace(/^\/+/, '')}` : `/${relative}`;
}

module.exports = exports;
