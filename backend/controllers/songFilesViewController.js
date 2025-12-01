const { getDatabase } = require('../config/database');
const path = require('path');
const fs = require('fs').promises;

/**
 * Detect key from filename
 * Examples: "Song - Am.pdf", "Song in C.mp3", "Song [DE ASCULTAT] in F#.mp3"
 */
function detectKeyFromFilename(filename) {
  // Remove extension
  const nameWithoutExt = filename.replace(/\.(pdf|mp3|wav|m4a)$/i, '');
  
  // Try to find key patterns
  // Pattern 1: " - KEY" or " - KEY."
  const dashPattern = / - ([A-G](#|b)?m?)\s*$/i;
  const dashMatch = nameWithoutExt.match(dashPattern);
  if (dashMatch) return dashMatch[1];
  
  // Pattern 2: " in KEY" or " in KEY "
  const inPattern = /\s+in\s+([A-G](#|b)?m?)\s*$/i;
  const inMatch = nameWithoutExt.match(inPattern);
  if (inMatch) return inMatch[1];
  
  // Pattern 3: Look for standalone key at end
  const keyPattern = /\b([A-G](#|b)?m?)\s*$/i;
  const keyMatch = nameWithoutExt.match(keyPattern);
  if (keyMatch) return keyMatch[1];
  
  return null;
}

/**
 * Get all files for a song grouped by key
 */
exports.getSongFilesView = async (req, res) => {
  try {
    const songId = req.params.id || req.params.songId;
    const db = getDatabase();
    
    console.log('[DEBUG] getSongFilesView called for songId:', songId);
    
    // Get song info
    const song = db.prepare('SELECT * FROM songs WHERE id = ?').get(songId);
    if (!song) {
      console.log('[DEBUG] Song not found:', songId);
      return res.status(404).json({ error: 'Song not found' });
    }
    
    console.log('[DEBUG] Song:', song.title);
    
    // Get all keys for this song
    const keys = db.prepare(`
      SELECT id, key_signature, is_original
      FROM song_keys
      WHERE song_id = ?
      ORDER BY is_original DESC, key_signature ASC
    `).all(songId);
    
    console.log('[DEBUG] Keys in DB:', keys.length);
    
    // For each key, scan the actual folder for files
    const songFolderName = `song_${song.id}_${song.title.replace(/[^a-z0-9]/gi, '_')}`;
    const basePath = path.join(__dirname, '..', 'uploads', 'songs', songFolderName);
    
    console.log('[DEBUG] Scanning path:', basePath);
    const folderExists = await fs.access(basePath).then(() => true).catch(() => false);
    console.log('[DEBUG] Path exists?', folderExists);
    
    // Scan folder and get ALL files
    const allFiles = [];
    
    if (folderExists) {
      try {
        const filesList = await fs.readdir(basePath);
        
        for (const filename of filesList) {
          const filePath = path.join(basePath, filename);
          
          try {
            const stats = await fs.stat(filePath);
            
            if (stats.isFile()) {
              const ext = path.extname(filename).toLowerCase();
              
              // Detect key from filename (ex: "Song - Am.pdf" or "Song in C.mp3")
              const detectedKey = detectKeyFromFilename(filename);
              
              const fileInfo = {
                filename,
                path: `/uploads/songs/${songFolderName}/${filename}`,
                size: stats.size,
                type: ext === '.pdf' ? 'pdf' : ['.mp3', '.wav', '.m4a'].includes(ext) ? 'audio' : 'other',
                detectedKey
              };
              
              if (fileInfo.type !== 'other') {
                allFiles.push(fileInfo);
              }
            }
          } catch (err) {
            // Skip invalid files but log once
            console.warn(`[WARN] Failed to read file ${filePath}:`, err.message);
          }
        }
      } catch (error) {
        console.error(`Error reading folder ${basePath}:`, error);
      }
    } else {
      console.log('[DEBUG] Song folder missing, returning empty file list');
    }
    
    console.log('[DEBUG] Total files found:', allFiles.length);
    console.log('[DEBUG] PDF files:', allFiles.filter(f => f.type === 'pdf').length);
    console.log('[DEBUG] Audio files:', allFiles.filter(f => f.type === 'audio').length);
    
    res.json({
      song,
      files: allFiles
    });
  } catch (error) {
    console.error('[ERROR] getSongFilesView:', error);
    res.status(500).json({ error: 'Failed to get song files', details: error.message });
  }
};

module.exports = {
  getSongFilesView: exports.getSongFilesView
};
