const express = require('express');
const router = express.Router();
const fileUploadController = require('../controllers/fileUploadController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Upload file for song (admin_trupa or admin_global only)
router.post('/songs/:songId/files', 
  requireRole(['admin_global', 'admin_trupa']),
  fileUploadController.uploadSongFile
);

// Delete file (admin_trupa or admin_global only)
router.delete('/songs/:songId/files/:fileId',
  requireRole(['admin_global', 'admin_trupa']),
  fileUploadController.deleteSongFile
);

module.exports = router;

