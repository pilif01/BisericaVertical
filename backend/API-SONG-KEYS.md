# API Documentation: Song Keys & Files

Documentație completă pentru gestionarea tonalităților melodiilor și fișierelor asociate.

## Cuprins
- [Overview](#overview)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Exemple de utilizare](#exemple-de-utilizare)
- [Frontend Integration](#frontend-integration)

---

## Overview

Această funcționalitate permite:
- ✅ Adăugarea de tonalități multiple pentru fiecare melodie
- ✅ Upload de fișiere (PDF, DOCX, imagini, audio) pentru fiecare tonalitate
- ✅ Marcarea tonalității originale
- ✅ Vizualizarea tonalităților disponibile în preview
- ✅ Gestionare completă CRUD pentru tonalități și fișiere

---

## Database Schema

### Tabelul `song_keys`

Stochează toate tonalitățile disponibile pentru o melodie.

| Coloană | Tip | Descriere |
|---------|-----|-----------|
| `id` | INTEGER | Primary key |
| `song_id` | INTEGER | FK către `songs(id)` |
| `key_signature` | TEXT | Tonalitatea (ex: "D", "Em", "F#") |
| `is_original` | BOOLEAN | 1 dacă este tonalitatea originală |
| `notes` | TEXT | Note/observații despre această tonalitate |
| `created_by` | INTEGER | FK către `users(id)` |
| `created_at` | DATETIME | Data creării |
| `updated_at` | DATETIME | Data ultimei modificări |

**Constraint:** `UNIQUE(song_id, key_signature)` - o melodie nu poate avea același key de două ori

### Tabelul `song_key_files`

Stochează fișierele asociate fiecărei tonalități.

| Coloană | Tip | Descriere |
|---------|-----|-----------|
| `id` | INTEGER | Primary key |
| `song_key_id` | INTEGER | FK către `song_keys(id)` |
| `file_type` | TEXT | Tipul fișierului (pdf, sheet, audio, etc) |
| `filename` | TEXT | Numele original al fișierului |
| `file_path` | TEXT | Calea pe server |
| `file_size` | INTEGER | Mărimea în bytes |
| `mime_type` | TEXT | MIME type (application/pdf, etc) |
| `uploaded_by` | INTEGER | FK către `users(id)` |
| `uploaded_at` | DATETIME | Data upload-ului |

**Cascade Delete:** Când ștergi un `song_key`, toate fișierele sale sunt șterse automat.

---

## API Endpoints

### 1. Get all keys for a song

**GET** `/api/songs/:id/keys`

Returnează toate tonalitățile disponibile pentru o melodie, cu fișierele asociate.

**Response:**
```json
{
  "keys": [
    {
      "id": 1,
      "song_id": 12,
      "key_signature": "D",
      "is_original": 1,
      "notes": "Tonalitatea originală",
      "created_by": 1,
      "created_by_name": "Administrator",
      "files_count": 3,
      "created_at": "2025-10-20T...",
      "updated_at": "2025-10-20T...",
      "files": [
        {
          "id": 1,
          "song_key_id": 1,
          "file_type": "pdf",
          "filename": "Bunătatea Ta - D.pdf",
          "file_path": "/uploads/song-keys/...",
          "file_size": 245678,
          "mime_type": "application/pdf",
          "uploaded_by": 1,
          "uploaded_by_name": "Administrator",
          "uploaded_at": "2025-10-20T..."
        }
      ]
    },
    {
      "id": 2,
      "song_id": 12,
      "key_signature": "E",
      "is_original": 0,
      "notes": "Pentru voci mai înalte",
      "files_count": 2,
      "files": [...]
    }
  ]
}
```

---

### 2. Add a key to a song

**POST** `/api/songs/:id/keys`

Adaugă o tonalitate nouă pentru o melodie.

**Requires:** `admin_global` SAU `admin_trupa`

**Body:**
```json
{
  "key_signature": "E",
  "is_original": false,
  "notes": "Pentru voci mai înalte"
}
```

**Response:**
```json
{
  "key": {
    "id": 2,
    "song_id": 12,
    "key_signature": "E",
    "is_original": 0,
    "notes": "Pentru voci mai înalte",
    "created_by": 1,
    "created_at": "2025-10-20T...",
    "updated_at": "2025-10-20T..."
  },
  "message": "Key added successfully"
}
```

**Errors:**
- `400` - Key signature is required
- `404` - Song not found
- `409` - This key already exists for this song

---

### 3. Update a key

**PUT** `/api/songs/:id/keys/:keyId`

Actualizează o tonalitate existentă.

**Requires:** `admin_global` SAU `admin_trupa`

**Body:**
```json
{
  "key_signature": "F",
  "is_original": false,
  "notes": "Actualizat pentru bărbați"
}
```

**Response:**
```json
{
  "key": {
    "id": 2,
    "song_id": 12,
    "key_signature": "F",
    "is_original": 0,
    "notes": "Actualizat pentru bărbați",
    "updated_at": "2025-10-20T..."
  },
  "message": "Key updated successfully"
}
```

---

### 4. Delete a key

**DELETE** `/api/songs/:id/keys/:keyId`

Șterge o tonalitate (și toate fișierele asociate).

**Requires:** `admin_global` SAU `admin_trupa`

**Response:**
```json
{
  "message": "Key deleted successfully"
}
```

**Note:** Această operație șterge și toate fișierele asociate din database și filesystem!

---

### 5. Get files for a key

**GET** `/api/songs/:id/keys/:keyId/files`

Returnează toate fișierele pentru o tonalitate specifică.

**Response:**
```json
{
  "files": [
    {
      "id": 1,
      "song_key_id": 1,
      "file_type": "pdf",
      "filename": "Bunătatea Ta - D.pdf",
      "file_path": "/uploads/song-keys/song-12-key-1-1234567890.pdf",
      "file_size": 245678,
      "mime_type": "application/pdf",
      "uploaded_by": 1,
      "uploaded_by_name": "Administrator",
      "uploaded_at": "2025-10-20T..."
    }
  ]
}
```

---

### 6. Upload file for a key

**POST** `/api/songs/:id/keys/:keyId/files`

Upload fișier pentru o tonalitate.

**Requires:** `admin_global` SAU `admin_trupa`

**Content-Type:** `multipart/form-data`

**Form Data:**
- `file` (File) - Fișierul de upload (max 10MB)
- `file_type` (String) - Tipul: `pdf`, `sheet`, `audio`, `chord`, `lyrics`, `other`

**Allowed file types:**
- PDF (`.pdf`)
- Word (`.docx`, `.doc`)
- Text (`.txt`)
- Images (`.jpeg`, `.jpg`, `.png`)
- Audio (`.mp3`, `.wav`, `.midi`)

**Example (JavaScript):**
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('file_type', 'pdf');

fetch(`/api/songs/12/keys/1/files`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
})
```

**Response:**
```json
{
  "file": {
    "id": 3,
    "song_key_id": 1,
    "file_type": "pdf",
    "filename": "Bunătatea Ta - D.pdf",
    "file_path": "/uploads/song-keys/song-12-key-1-1729455000-123456789.pdf",
    "file_size": 245678,
    "mime_type": "application/pdf",
    "uploaded_by": 1,
    "uploaded_at": "2025-10-20T..."
  },
  "message": "File uploaded successfully"
}
```

**Errors:**
- `400` - No file uploaded / Invalid file type
- `404` - Key not found

---

### 7. Delete a file

**DELETE** `/api/songs/:id/keys/:keyId/files/:fileId`

Șterge un fișier de la o tonalitate.

**Requires:** `admin_global` SAU `admin_trupa`

**Response:**
```json
{
  "message": "File deleted successfully"
}
```

**Note:** Șterge fișierul din filesystem și database!

---

## Exemple de utilizare

### Scenario 1: Adăugare tonalitate + fișiere pentru "Bunătatea Ta"

```javascript
// 1. Adaugă tonalitatea "D" (originală)
POST /api/songs/12/keys
{
  "key_signature": "D",
  "is_original": true,
  "notes": "Tonalitatea originală Bethel Music"
}
// Response: { key: { id: 1, ... } }

// 2. Upload PDF cu acorduri în D
POST /api/songs/12/keys/1/files
FormData: { file: "Bunătatea Ta - D.pdf", file_type: "pdf" }

// 3. Upload audio backing track în D
POST /api/songs/12/keys/1/files
FormData: { file: "Bunătatea Ta - D.mp3", file_type: "audio" }

// 4. Adaugă tonalitate alternativă "E"
POST /api/songs/12/keys
{
  "key_signature": "E",
  "is_original": false,
  "notes": "Pentru voci feminine mai înalte"
}
// Response: { key: { id: 2, ... } }

// 5. Upload PDF acorduri în E
POST /api/songs/12/keys/2/files
FormData: { file: "Bunătatea Ta - E.pdf", file_type: "pdf" }
```

### Scenario 2: Vizualizare tonalități disponibile

```javascript
// Get song details cu tonalități
GET /api/songs/12

// Response include:
{
  "song": {
    "id": 12,
    "title": "Bunătatea Ta (Goodness of God)",
    "key_signature": "D", // tonalitatea principală
    "available_keys": [
      {
        "id": 1,
        "key_signature": "D",
        "is_original": 1,
        "files_count": 2
      },
      {
        "id": 2,
        "key_signature": "E",
        "is_original": 0,
        "files_count": 1
      },
      {
        "id": 3,
        "key_signature": "C",
        "is_original": 0,
        "files_count": 3
      }
    ]
  }
}
```

---

## Frontend Integration

### React Hook pentru Song Keys

```javascript
// useSongKeys.js
import { useState, useEffect } from 'react';
import api from './api';

export function useSongKeys(songId) {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadKeys();
  }, [songId]);

  const loadKeys = async () => {
    try {
      const { data } = await api.get(`/songs/${songId}/keys`);
      setKeys(data.keys);
    } catch (error) {
      console.error('Error loading keys:', error);
    } finally {
      setLoading(false);
    }
  };

  const addKey = async (keyData) => {
    const { data } = await api.post(`/songs/${songId}/keys`, keyData);
    setKeys([...keys, data.key]);
    return data.key;
  };

  const deleteKey = async (keyId) => {
    await api.delete(`/songs/${songId}/keys/${keyId}`);
    setKeys(keys.filter(k => k.id !== keyId));
  };

  const uploadFile = async (keyId, file, fileType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('file_type', fileType);

    const { data } = await api.post(
      `/songs/${songId}/keys/${keyId}/files`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    loadKeys(); // Reload pentru a actualiza files_count
    return data.file;
  };

  return { keys, loading, addKey, deleteKey, uploadFile, reload: loadKeys };
}
```

### Component Example

```jsx
function SongKeysManager({ songId }) {
  const { keys, loading, addKey, deleteKey, uploadFile } = useSongKeys(songId);
  const [showAddKey, setShowAddKey] = useState(false);

  if (loading) return <div>Loading keys...</div>;

  return (
    <div className="song-keys-manager">
      <h3>Tonalități disponibile</h3>

      <div className="keys-grid">
        {keys.map(key => (
          <div key={key.id} className="key-card">
            <div className="key-header">
              <span className="key-signature">{key.key_signature}</span>
              {key.is_original && <badge>Original</badge>}
              <span className="files-count">{key.files_count} fișiere</span>
            </div>

            {key.notes && <p className="key-notes">{key.notes}</p>}

            <div className="key-files">
              {key.files.map(file => (
                <div key={file.id} className="file-item">
                  <a href={file.file_path} download>{file.filename}</a>
                  <span>{formatFileSize(file.file_size)}</span>
                </div>
              ))}
            </div>

            <button onClick={() => handleUploadFile(key.id)}>
              + Adaugă fișier
            </button>

            <button onClick={() => deleteKey(key.id)} className="danger">
              Șterge tonalitate
            </button>
          </div>
        ))}
      </div>

      <button onClick={() => setShowAddKey(true)}>
        + Adaugă tonalitate
      </button>
    </div>
  );
}
```

---

## Best Practices

### Pentru Admins

1. **Tonalitate originală:** Marchează mereu tonalitatea originală cu `is_original: true`
2. **Nume fișiere:** Folosește nume descriptive: "Melodie - Tonalitate.pdf"
3. **Tipuri fișiere:** Setează corect `file_type` pentru filtrare ușoară
4. **Note:** Adaugă note pentru fiecare tonalitate (ex: "Pentru voci masculine")

### Pentru Development

1. **Validare:** Backend validează automat tipurile de fișiere și mărimea
2. **Cascade delete:** Când ștergi un key, toate fișierele se șterg automat
3. **Unique constraint:** Nu poți adăuga același key de două ori pentru o melodie
4. **File cleanup:** La ștergere, fișierele sunt eliminate din filesystem

---

## Troubleshooting

### Eroare: "This key already exists"

**Cauză:** Încerci să adaugi un key_signature care există deja

**Soluție:** Verifică keys existente înainte de a adăuga

### Eroare: "Invalid file type"

**Cauză:** Tipul fișierului nu este permis

**Soluție:** Folosește doar: PDF, DOCX, TXT, JPG, PNG, MP3, WAV, MIDI

### Files nu se șterg

**Cauză:** Posibil probleme de permisiuni

**Soluție:** Verifică permisiunile folderului `uploads/song-keys/`

---

## Next Steps

După implementare backend, următorii pași pentru UI:

- [ ] Component pentru afișare tonalități în song preview
- [ ] Modal pentru adăugare tonalitate
- [ ] UI pentru upload fișiere cu drag & drop
- [ ] Preview fișiere (PDF viewer, audio player)
- [ ] Filtrare melodii după tonalități disponibile
- [ ] Badge-uri pentru tonalități originale vs. alternative

