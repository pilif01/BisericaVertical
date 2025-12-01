const express = require('express');
const router = express.Router();
const songsController = require('../controllers/songsController');
const songFilesViewController = require('../controllers/songFilesViewController');
const songFilesController = require('../controllers/songFilesController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get songs (all users can view)
router.get('/', songsController.getAllSongs);
router.get('/recently-used', songsController.getRecentlyUsed);
router.get('/:id/files-view', songFilesViewController.getSongFilesView);
router.get('/:id', songsController.getSongById);

// Transpose endpoints (authenticated users)
router.post('/:id/transpose-pdf', songFilesController.transposePdfFile);
router.post('/:id/transpose-audio', songFilesController.transposeAudioFile);

// Create song (admin_trupa or admin_global only)
router.post('/', requireRole(['admin_global', 'admin_trupa']), songsController.createSong);

// Update song (admin_trupa or admin_global only)
router.put('/:id', requireRole(['admin_global', 'admin_trupa']), songsController.updateSong);

// Delete song (admin_trupa or admin_global only)
router.delete('/:id', requireRole(['admin_global', 'admin_trupa']), songsController.deleteSong);

// ============================================
// SONG KEYS (Tonalități)
// ============================================

// Get all keys for a song
router.get('/:id/keys', songsController.getSongKeys);

// Add a key to a song
router.post('/:id/keys', requireRole(['admin_global', 'admin_trupa']), songsController.addSongKey);

// Update a key
router.put('/:id/keys/:keyId', requireRole(['admin_global', 'admin_trupa']), songsController.updateSongKey);

// Delete a key
router.delete('/:id/keys/:keyId', requireRole(['admin_global', 'admin_trupa']), songsController.deleteSongKey);

// ============================================
// SONG KEY FILES (Fișiere pentru tonalități)
// ============================================

// Get files for a specific key
router.get('/:id/keys/:keyId/files', songsController.getKeyFiles);

// Upload file for a key (handled by controller with multer)
router.post('/:id/keys/:keyId/files', requireRole(['admin_global', 'admin_trupa']), songsController.uploadKeyFile);

// Delete a file from a key
router.delete('/:id/keys/:keyId/files/:fileId', requireRole(['admin_global', 'admin_trupa']), songsController.deleteKeyFile);

module.exports = router;
