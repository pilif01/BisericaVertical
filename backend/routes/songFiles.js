const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const songFilesController = require('../controllers/songFilesController');
const { authenticateToken } = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads', 'temp'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// All routes require authentication
router.use(authenticateToken);

/**
 * @route   POST /api/songs/:songId/upload-pdf
 * @desc    Upload PDF for a song key
 * @access  Authenticated
 */
router.post('/:songId/upload-pdf', upload.single('pdf'), songFilesController.uploadPDF);

/**
 * @route   POST /api/songs/:songId/upload-audio
 * @desc    Upload audio for a song key
 * @access  Authenticated
 */
router.post('/:songId/upload-audio', upload.single('audio'), songFilesController.uploadAudio);

/**
 * @route   POST /api/songs/:songId/generate-pdf-transpositions
 * @desc    Generate transposed PDFs for all keys
 * @access  Authenticated (Admin)
 */
router.post('/:songId/generate-pdf-transpositions', songFilesController.generateTransposedPDFs);

/**
 * @route   POST /api/songs/:songId/generate-audio-transpositions
 * @desc    Generate transposed audio for all keys
 * @access  Authenticated (Admin)
 */
router.post('/:songId/generate-audio-transpositions', songFilesController.generateTransposedAudio);

/**
 * @route   GET /api/songs/:songId/files
 * @desc    Get all files for a song
 * @access  Authenticated
 */
router.get('/:songId/files', songFilesController.getSongFiles);

/**
 * @route   DELETE /api/songs/files/:fileId
 * @desc    Delete a file
 * @access  Authenticated (Admin)
 */
router.delete('/files/:fileId', songFilesController.deleteFile);

/**
 * @route   POST /api/songs/:songId/transpose-pdf
 * @desc    Transpose a PDF chord sheet to another key
 */
router.post('/:songId/transpose-pdf', songFilesController.transposePdfFile);

/**
 * @route   POST /api/songs/:songId/transpose-audio
 * @desc    Transpose an audio reference to another key
 */
router.post('/:songId/transpose-audio', songFilesController.transposeAudioFile);

module.exports = router;
