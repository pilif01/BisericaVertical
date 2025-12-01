const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const { Note } = require('@tonaljs/tonal');

const DIACRITIC_MAP = {
  'ă': 'a',
  'Ă': 'A',
  'â': 'a',
  'Â': 'A',
  'î': 'i',
  'Î': 'I',
  'ș': 's',
  'Ș': 'S',
  'ş': 's',
  'Ş': 'S',
  'ţ': 't',
  'Ţ': 'T',
  'ț': 't',
  'Ț': 'T'
};

function sanitizeText(input) {
  return input.normalize('NFKD').replace(/[ăĂâÂîÎșȘşŞţŢțȚ]/g, (char) => DIACRITIC_MAP[char] || char).replace(/[\u0300-\u036f]/g, '');
}

function formatPrintableLine(line) {
  if (!line) return '';
  const sanitized = sanitizeText(line);
  if (!sanitized.trim()) return '';
  return sanitized
    .replace(/^\.+/, '')
    .replace(/\.{2,}/g, ' ')
    .replace(/(?<=\w)\.(?=\w)/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function normalizeKeySignature(signature) {
  if (!signature) return null;
  const match = signature.trim().match(/^([A-G](#|b)?)(m)?$/i);
  if (!match) return null;
  let base = match[1];
  const isMinor = !!match[3];
  const enharmonicMap = { Db: 'C#', Eb: 'D#', Gb: 'F#', Ab: 'G#', Bb: 'A#' };
  const normalizedBase = enharmonicMap[base] || enharmonicMap[base?.toUpperCase()] || base.toUpperCase();
  return { base: normalizedBase, isMinor };
}

function semitoneDifference(fromKey, toKey) {
  const from = normalizeKeySignature(fromKey);
  const to = normalizeKeySignature(toKey);
  if (!from || !to) return null;
  const fromMidi = Note.midi(from.base + (from.isMinor ? 'm' : ''));
  const toMidi = Note.midi(to.base + (to.isMinor ? 'm' : ''));
  if (fromMidi === null || toMidi === null) return null;
  return toMidi - fromMidi;
}

/**
 * Extract text from PDF
 */
async function extractTextFromPDF(pdfPath) {
  try {
    const pdfModule = await import('pdf-parse');
    const dataBuffer = await fs.readFile(pdfPath);
    const ParserClass = pdfModule.PDFParse || pdfModule.default;
    if (!ParserClass) {
      throw new Error('pdf-parse module missing PDFParse export');
    }
    const parser = new ParserClass({ data: dataBuffer });
    const textResult = await parser.getText();
    await parser.destroy();
    return textResult.text;
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    throw error;
  }
}

/**
 * Detect if PDF contains chord numerals (I, II, III) or letter chords (C, Dm, G)
 */
function detectChordType(text) {
  // Regex for letter chords: C, Dm, F#, Bb, etc.
  const letterChordPattern = /\b([CDEFGAB](#|b)?)(m|maj|min|sus|add|dim|aug|°|ø)?([0-9]|sus[0-9]|add[0-9])?\b/g;
  
  // Regex for numeral chords: I, II, III, IV, V, VI, VII, i, ii, iii, etc.
  const numeralPattern = /\b(b)?(I{1,3}|IV|V|VI{0,2}|i{1,3}|iv|v|vi{0,2})(#|b)?(m|maj|dim|aug|sus|add|°|ø)?([0-9])?\b/g;
  
  const letterMatches = text.match(letterChordPattern) || [];
  const numeralMatches = text.match(numeralPattern) || [];
  
  // Filter out common false positives
  const filteredLetterChords = letterMatches.filter(chord => {
    // Exclude single letters that might be list markers
    if (chord.length === 1 && /[ABCDEF]/.test(chord)) return false;
    return true;
  });
  
  const filteredNumerals = numeralMatches.filter(numeral => {
    // Exclude common Roman numeral uses (dates, chapters)
    const commonWords = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
    if (commonWords.includes(numeral) && text.includes(numeral + '.')) return false;
    return true;
  });
  
  console.log(`Detected ${filteredLetterChords.length} letter chords and ${filteredNumerals.length} numeral chords`);
  
  if (filteredLetterChords.length > 0) {
    return {
      type: 'chords',
      chords: filteredLetterChords,
      count: filteredLetterChords.length
    };
  } else if (filteredNumerals.length > 0) {
    return {
      type: 'numerals',
      chords: filteredNumerals,
      count: filteredNumerals.length
    };
  } else {
    return {
      type: 'none',
      chords: [],
      count: 0
    };
  }
}

/**
 * Transpose a single chord from one key to another
 */
function transposeChordSymbol(chord, semitoneShift) {
  const match = chord.match(/^([A-G](#|b)?)(.*)$/i);
  if (!match) return chord;
  const root = match[1];
  const suffix = match[3] || '';
  const midi = Note.midi(root);
  if (midi === null) return chord;
  let newMidi = midi + semitoneShift;
  if (newMidi < 0) newMidi += 12;
  const normalizedMidi = ((newMidi % 12) + 12) % 12;
  const notesByIndex = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const newRoot = notesByIndex[normalizedMidi];
  return `${newRoot}${suffix}`;
}

function transposeChord(chord, fromKey, toKey) {
  try {
    const diff = semitoneDifference(fromKey, toKey);
    if (diff === null) return chord;
    return transposeChordSymbol(chord, diff);
  } catch (error) {
    console.error(`Error transposing chord ${chord} from ${fromKey} to ${toKey}:`, error);
    return chord;
  }
}

/**
 * Transpose all chords in text
 */
function transposeText(text, detection, fromKey, toKey) {
  if (detection.type !== 'chords') {
    return {
      text: text,
      error: 'Numeral chords cannot be transposed automatically.'
    };
  }
  
  console.log(`[DEBUG] Transposing from ${fromKey} to ${toKey}`);
  console.log(`[DEBUG] Format:`, detection.format);
  
  // Pattern based on detected format
  const chordPattern = detection.format === 'brackets'
    ? /\[([CDEFGAB](#|b)?(m|maj|min|sus|add|dim|aug|°|ø)?([0-9]|sus[0-9]|add[0-9])?(\/[CDEFGAB](#|b)?)?)\]/g
    : /\b([CDEFGAB](#|b)?)(m|maj|min|sus|add|dim|aug|°|ø)?([0-9]|sus[0-9]|add[0-9])?(\/[CDEFGAB](#|b)?)?\b/g;
  
  let transposedText = text;
  const replacements = [];
  
  // Find all matches
  let match;
  while ((match = chordPattern.exec(text)) !== null) {
    const fullMatch = match[0];
    const chordOnly = detection.format === 'brackets' ? match[1] : match[0];
    
    console.log(`[DEBUG] Found chord: ${fullMatch} -> ${chordOnly}`);
    
    const transposedChord = transposeChord(chordOnly, fromKey, toKey);
    const transposedFull = detection.format === 'brackets' 
      ? `[${transposedChord}]`
      : transposedChord;
    
    if (fullMatch !== transposedFull) {
      replacements.push({
        original: fullMatch,
        transposed: transposedFull,
        index: match.index
      });
      
      console.log(`[DEBUG] ${fullMatch} -> ${transposedFull}`);
    }
  }
  
  console.log(`[DEBUG] Total replacements: ${replacements.length}`);
  
  // Replace from end to start
  replacements.reverse().forEach(rep => {
    transposedText = transposedText.substring(0, rep.index) + 
                     rep.transposed + 
                     transposedText.substring(rep.index + rep.original.length);
  });
  
  return {
    text: transposedText,
    replacements: replacements.length,
    chordMap: replacements
  };
}

/**
 * Create a new PDF with transposed chords
 */
async function createTransposedPDF(originalPdfPath, fromKey, toKey, outputPath) {
  try {
    // Extract text
    const text = await extractTextFromPDF(originalPdfPath);
    
    // Detect chord type
    const detection = detectChordType(text);
    
    if (detection.type === 'none') {
      throw new Error('No chords detected in PDF');
    }
    
    if (detection.type === 'numerals') {
      throw new Error('PDF contains numeral chords. Automatic transposition not supported.');
    }
    
    // Transpose text (pass full detection object)
    const transposed = transposeText(text, detection, fromKey, toKey);
    
    if (transposed.error) {
      throw new Error(transposed.error);
    }
    
    // Create new PDF with transposed text
    const pdfDoc = await PDFDocument.create();
    let currentPage = pdfDoc.addPage([595, 842]); // A4 size
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10;
    
    // Split text into lines and add to PDF
    const lines = transposed.text.split('\n');
    let y = 800;
    
    for (const line of lines) {
      const printableLine = formatPrintableLine(line);
      if (!printableLine) {
        y -= fontSize + 4;
        continue;
      }
      if (y < 50) {
        currentPage = pdfDoc.addPage([595, 842]);
        y = 800;
      }
      currentPage.drawText(printableLine, {
        x: 50,
        y: y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      });
      y -= fontSize + 2;
    }
    
    // Save PDF
    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(outputPath, pdfBytes);
    
    return {
      success: true,
      outputPath: outputPath,
      replacements: transposed.replacements,
      chordMap: transposed.chordMap
    };
  } catch (error) {
    console.error('Error creating transposed PDF:', error);
    throw error;
  }
}

/**
 * Generate all transposed versions of a PDF
 */
async function generateAllTranspositions(originalPdfPath, originalKey, targetKeys, baseOutputDir) {
  const results = [];
  
  for (const targetKey of targetKeys) {
    if (targetKey === originalKey) {
      // Skip original key
      continue;
    }
    
    try {
      const outputFileName = `${path.basename(originalPdfPath, '.pdf')}_${targetKey}.pdf`;
      const outputPath = path.join(baseOutputDir, targetKey, outputFileName);
      
      // Create directory if it doesn't exist
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      
      const result = await createTransposedPDF(originalPdfPath, originalKey, targetKey, outputPath);
      
      results.push({
        key: targetKey,
        success: true,
        path: outputPath,
        ...result
      });
      
      console.log(`✅ Generated PDF for key ${targetKey}`);
    } catch (error) {
      console.error(`❌ Failed to generate PDF for key ${targetKey}:`, error.message);
      results.push({
        key: targetKey,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

module.exports = {
  extractTextFromPDF,
  detectChordType,
  transposeChord,
  transposeText,
  createTransposedPDF,
  generateAllTranspositions
};
