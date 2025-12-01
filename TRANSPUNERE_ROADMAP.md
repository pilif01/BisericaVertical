# 🎼 Roadmap Transpunere PDF și Audio

## ✅ Ce am implementat până acum

### 1. Database și Storage
- ✅ 100 melodii adăugate cu toate tonalitățile
- ✅ 52 servicii generate (Duminici + Luni pentru 6 luni)
- ✅ Folder per melodie: `uploads/songs/song_[ID]_[Nume]/`
- ✅ Tabelă `song_keys` pentru multiple tonalități
- ✅ Tabelă `song_key_files` pentru fișiere per tonalitate

### 2. Structura Storage
```
uploads/songs/
  ├── song_209_Risen_Domnul_Traie_te/
  │   ├── E/                    # Folder per tonalitate
  │   │   ├── risen_e.pdf       # PDF în E
  │   │   ├── risen_e.mp3       # Audio în E
  │   │   └── metadata.json     # Info despre fișiere
  │   ├── F/
  │   │   ├── risen_f.pdf
  │   │   └── risen_f.mp3
  │   └── original/
  │       ├── risen_original.pdf
  │       └── risen_original.mp3
  ├── song_210_Adonai/
  └── ...
```

---

## 🎯 Funcționalități de Implementat

### ETAPA 1: Upload și Management Fișiere ✅ (GATA)
- [x] Folder per melodie
- [x] Subfoldere per tonalitate
- [ ] Upload PDF-uri
- [ ] Upload Audio (MP3, WAV)
- [ ] Preview fișiere
- [ ] Ștergere fișiere

### ETAPA 2: Detectare și Parsing PDF 🚧 (ÎN CURS)

#### 2.1 Librării necesare
```bash
npm install pdf-parse pdf-lib chord-transposer
```

#### 2.2 Funcționalități
- [ ] **Extragere text din PDF**
- [ ] **Detectare tip**: Trepte (I, II, bIII) vs Acorduri (C, Dm, G7)
- [ ] **Regex pentru acorduri**: `/(C|D|E|F|G|A|B)(#|b)?(m|maj|min|sus|add|dim|aug)?[0-9]?/g`
- [ ] **Regex pentru trepte**: `/\b(I|II|III|IV|V|VI|VII|i|ii|iii|iv|v|vi|vii)(b|#)?\b/g`

#### 2.3 Algoritm Detectare
```javascript
function detectChordType(text) {
  const chordPattern = /(C|D|E|F|G|A|B)(#|b)?(m|maj|sus|add)?/g;
  const numericPattern = /\b(I|II|III|IV|V|VI|VII)\b/g;
  
  const chordMatches = text.match(chordPattern) || [];
  const numericMatches = text.match(numericPattern) || [];
  
  if (chordMatches.length > numericMatches.length * 2) {
    return 'chords'; // Acorduri (C, Dm, G)
  } else {
    return 'numerals'; // Trepte (I, II, III)
  }
}
```

### ETAPA 3: Transpunere Acorduri în PDF 🔄

#### 3.1 Librării
```bash
npm install chord-transposer tonal
```

#### 3.2 Funcționalități
- [ ] **Transpune acorduri**: C → D, Dm → Em
- [ ] **Păstrează layout PDF**
- [ ] **Replace text în PDF**
- [ ] **Generează PDF nou pentru fiecare tonalitate**

#### 3.3 Exemplu Cod
```javascript
const ChordTransposer = require('chord-transposer');

function transposeChord(chord, fromKey, toKey) {
  return ChordTransposer.transpose(chord).fromKey(fromKey).toKey(toKey).toString();
}

// Exemplu: C → D
transposeChord('C', 'C', 'D');    // 'D'
transposeChord('Am', 'C', 'D');   // 'Bm'
transposeChord('F', 'C', 'D');    // 'G'
```

### ETAPA 4: Detectare Tonalitate Audio 🎵

#### 4.1 Librării necesare
```bash
# Backend - Python pentru procesare audio
pip install aubio librosa essentia

# Node.js wrapper
npm install @tonaljs/key music-key-detector
```

#### 4.2 Funcționalități
- [ ] **Upload audio** (MP3, WAV, M4A)
- [ ] **Analiză pitch detection**
- [ ] **Detectare tonalitate** (C, D, Em, etc.)
- [ ] **Salvare metadata**: BPM, key, duration

#### 4.3 API Python pentru Detectare
```python
# backend/audio_analysis.py
import librosa
import numpy as np

def detect_key(audio_file):
    y, sr = librosa.load(audio_file)
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    
    # Tonal analysis
    key = librosa.core.estimate_tuning(y=y, sr=sr)
    
    return {
        'key': key,
        'bpm': librosa.beat.tempo(y=y, sr=sr)[0],
        'duration': librosa.get_duration(y=y, sr=sr)
    }
```

### ETAPA 5: Transpunere Audio (Pitch Shifting) 🎚️

#### 5.1 Opțiuni de Implementare

**Opțiunea A: FFmpeg (recomandat)**
```bash
# Instalare
brew install ffmpeg  # Mac
apt-get install ffmpeg  # Linux

# Transpunere +2 semitone
ffmpeg -i input.mp3 -af "asetrate=44100*1.122,aresample=44100" output_up2.mp3
```

**Opțiunea B: Librosa (Python)**
```python
import librosa
import soundfile as sf

def pitch_shift_audio(input_file, output_file, semitones):
    y, sr = librosa.load(input_file)
    y_shifted = librosa.effects.pitch_shift(y, sr=sr, n_steps=semitones)
    sf.write(output_file, y_shifted, sr)
```

**Opțiunea C: Online API (Moises.ai, Spleeter)**
- API pentru separare vocale + transpunere
- Cost: ~$0.01 per minut

#### 5.2 Funcționalități
- [ ] **Upload audio original**
- [ ] **Pitch shift automat** pentru toate tonalitățile
- [ ] **Preview audio transpus**
- [ ] **Download audio transpus**

#### 5.3 Calcul Semitone
```javascript
// C → D = +2 semitone
// C → E = +4 semitone
// C → Bb = -2 semitone

const semitoneMap = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

function calculateSemitones(fromKey, toKey) {
  const from = semitoneMap[fromKey];
  const to = semitoneMap[toKey];
  let diff = to - from;
  
  // Normalizare între -6 și +6
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  
  return diff;
}

// Exemplu
calculateSemitones('C', 'D');  // +2
calculateSemitones('G', 'C');  // -7 → +5
```

---

## 🛠️ Implementare Practică

### Faza 1: Upload Simplu (1-2 ore)
1. Endpoint pentru upload PDF + audio
2. Salvare în folderul melodiei
3. Asociere cu tonalitatea

### Faza 2: Detectare și Transpunere PDF (4-6 ore)
1. Parse PDF → extrage text
2. Detectare trepte vs acorduri
3. Transpunere acorduri cu `chord-transposer`
4. Generare PDF nou pentru fiecare tonalitate

### Faza 3: Audio Detection (2-3 ore)
1. Integrare FFmpeg sau Librosa
2. Detectare tonalitate automată
3. Salvare metadata în DB

### Faza 4: Audio Transpunere (3-4 ore)
1. Calcul semitone pentru transpunere
2. FFmpeg pitch shift
3. Generare audio pentru toate tonalitățile
4. Optimizare (cache, background jobs)

---

## 📊 Prioritizare

### Prioritate 1 (Urgent - 1 săptămână)
- ✅ Storage organizat cu foldere
- 🔄 Upload PDF și audio manual
- 🔄 View/preview fișiere
- 🔄 Download fișiere

### Prioritate 2 (Important - 2 săptămâni)
- Detectare trepte vs acorduri în PDF
- Transpunere acorduri în PDF
- Generare PDF-uri transpuse automat

### Prioritate 3 (Nice to have - 3-4 săptămâni)
- Detectare tonalitate audio
- Transpunere audio automat
- Preview audio în browser

---

## 💡 Observații Importante

### Limitări Tehnice
1. **PDF Transpunere**:
   - Funcționează doar pentru text-based PDF
   - PDF-uri scanate (imagini) necesită OCR
   - Layout-ul poate fi afectat

2. **Audio Transpunere**:
   - Calitatea scade la transpuneri > ±4 semitone
   - Procesare intensivă (30-60s per fișier)
   - Necesită server cu FFmpeg instalat

3. **Detectare Automată**:
   - Acuratețe ~85-90% pentru acorduri
   - Trepte pot fi confundate cu text normal
   - Necesită validare manuală

### Costuri
- **Storage**: ~50MB per melodie cu toate tonalitățile
- **Procesare**: CPU intensiv pentru audio
- **Alternative cloud**: API-uri externe ($$)

---

## 🚀 Quick Start

### Pentru a testa funcționalitățile:

1. **Upload manual** un PDF și audio pentru o melodie
2. **Rulează script** de detectare acorduri
3. **Generează** PDF-uri transpuse
4. **Test** audio pitch shift cu FFmpeg

Apoi extindem automat pentru toate melodiile!

---

**Next Steps**: Încep cu implementarea uploadului și apoi transpunerea PDF-urilor? 🎯

