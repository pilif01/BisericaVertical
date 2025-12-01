const ffmpeg = require('fluent-ffmpeg');
const musicMetadata = require('music-metadata');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Check if FFmpeg is installed
 */
async function checkFFmpeg() {
  try {
    await execPromise('ffmpeg -version');
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Extract metadata from audio file
 */
async function getAudioMetadata(audioPath) {
  try {
    const metadata = await musicMetadata.parseFile(audioPath);
    
    return {
      duration: metadata.format.duration,
      bitrate: metadata.format.bitrate,
      sampleRate: metadata.format.sampleRate,
      codec: metadata.format.codec,
      title: metadata.common.title,
      artist: metadata.common.artist,
      album: metadata.common.album
    };
  } catch (error) {
    console.error('Error extracting audio metadata:', error);
    throw error;
  }
}

/**
 * Calculate semitone difference between two keys
 */
function calculateSemitones(fromKey, toKey) {
  const semitoneMap = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
    'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
    'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
    
    // Minor keys
    'Cm': 0, 'C#m': 1, 'Dm': 2, 'D#m': 3, 'Em': 4, 'Fm': 5,
    'F#m': 6, 'Gm': 7, 'G#m': 8, 'Am': 9, 'A#m': 10, 'Bm': 11
  };
  
  const from = semitoneMap[fromKey];
  const to = semitoneMap[toKey];
  
  if (from === undefined || to === undefined) {
    throw new Error(`Invalid key: ${fromKey} or ${toKey}`);
  }
  
  let diff = to - from;
  
  // Normalize to range [-6, 6] for better audio quality
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  
  return diff;
}

/**
 * Transpose audio file using FFmpeg
 */
async function transposeAudio(inputPath, outputPath, semitones) {
  return new Promise((resolve, reject) => {
    // Check if FFmpeg is available
    checkFFmpeg().then(isAvailable => {
      if (!isAvailable) {
        return reject(new Error('FFmpeg is not installed. Please install FFmpeg to use audio transposition.'));
      }
      
      // Calculate pitch shift factor
      // Formula: 2^(semitones/12)
      const pitchFactor = Math.pow(2, semitones / 12);
      const asetrate = Math.round(44100 * pitchFactor);
      
      ffmpeg(inputPath)
        .audioFilters([
          `asetrate=${asetrate}`,
          'aresample=44100'
        ])
        .audioCodec('libmp3lame')
        .audioBitrate('192k')
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          console.log(`Processing: ${progress.percent}% done`);
        })
        .on('end', () => {
          console.log(`✅ Audio transposed successfully: ${outputPath}`);
          resolve({ success: true, outputPath });
        })
        .on('error', (err) => {
          console.error('❌ FFmpeg error:', err.message);
          reject(err);
        })
        .save(outputPath);
    }).catch(reject);
  });
}

/**
 * Generate all transposed audio versions
 */
async function generateAllAudioTranspositions(originalAudioPath, originalKey, targetKeys, baseOutputDir) {
  const results = [];
  const ext = path.extname(originalAudioPath);
  const baseName = path.basename(originalAudioPath, ext);
  
  // Check FFmpeg availability first
  const ffmpegAvailable = await checkFFmpeg();
  if (!ffmpegAvailable) {
    console.error('⚠️  FFmpeg not installed. Audio transposition skipped.');
    return [{
      error: 'FFmpeg not installed',
      message: 'Please install FFmpeg: brew install ffmpeg (Mac) or apt-get install ffmpeg (Linux)'
    }];
  }
  
  for (const targetKey of targetKeys) {
    if (targetKey === originalKey) {
      // Skip original key
      continue;
    }
    
    try {
      // Calculate semitones
      const semitones = calculateSemitones(originalKey, targetKey);
      
      // Create output path
      const outputFileName = `${baseName}_${targetKey}${ext}`;
      const outputPath = path.join(baseOutputDir, targetKey, outputFileName);
      
      // Create directory if it doesn't exist
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      // Transpose audio
      const result = await transposeAudio(originalAudioPath, outputPath, semitones);
      
      results.push({
        key: targetKey,
        success: true,
        semitones: semitones,
        path: outputPath
      });
      
      console.log(`✅ Generated audio for key ${targetKey} (${semitones > 0 ? '+' : ''}${semitones} semitones)`);
    } catch (error) {
      console.error(`❌ Failed to generate audio for key ${targetKey}:`, error.message);
      results.push({
        key: targetKey,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

/**
 * Detect key of audio file (basic implementation)
 * Note: This is a placeholder. For accurate key detection, use external services like Essentia.js or API
 */
async function detectAudioKey(audioPath) {
  // This is a placeholder - real key detection requires complex signal processing
  // Options:
  // 1. Use Essentia.js (Web Audio API based)
  // 2. Use external API (e.g., AcousticBrainz, Spotify API)
  // 3. Use Python script with librosa
  
  console.log('⚠️  Automatic key detection not fully implemented yet.');
  console.log('   Please specify the key manually or use external tools.');
  
  return {
    key: null,
    confidence: 0,
    message: 'Automatic key detection requires additional setup. Please specify key manually.'
  };
}

module.exports = {
  checkFFmpeg,
  getAudioMetadata,
  calculateSemitones,
  transposeAudio,
  generateAllAudioTranspositions,
  detectAudioKey
};

