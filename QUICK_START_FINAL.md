# 🚀 QUICK START - Planning Center cu Transpunere

## ⚡ Start Rapid (5 minute)

### 1️⃣ Instalează FFmpeg (IMPORTANT pentru audio)

```bash
# Mac
brew install ffmpeg

# Linux
sudo apt-get install ffmpeg

# Verificare
ffmpeg -version
```

### 2️⃣ Pornește Backend
```bash
cd /Users/filipbulc/Documents/BisericaVertical/backend
npm start
```

### 3️⃣ Pornește Frontend (în alt terminal)
```bash
cd /Users/filipbulc/Documents/BisericaVertical/biserica-vertical-react
npm run dev
```

### 4️⃣ Login
- URL: **http://localhost:5174/planner/login**
- Username: **Filip**
- Parolă: *parola ta nouă*

---

## 🎵 Test Transpunere (2 minute)

### Pasul 1: Alege o Melodie
1. Click pe **"Melodii"** în navbar
2. Alege orice melodie (ex: "Way Maker")
3. Click pe **"Gestionează Fișiere (PDF & Audio)"**

### Pasul 2: Upload Fișier
1. Selectează tonalitatea originală (ex: **D**)
2. Click pe butonul **Upload** lângă "PDF"
3. Alege un PDF cu acorduri (C, Dm, G, etc.)
4. Așteaptă confirmarea

### Pasul 3: Generează Transpuneri
1. Click pe **"Generează toate PDF-urile"**
2. Așteaptă 10-30 secunde
3. ✅ Gata! Toate PDF-urile transpuse apar automat

### (Opțional) Transpunere Audio:
1. Upload un fișier MP3/WAV în tonalitatea originală
2. Click pe **"Generează toate audio-urile"**
3. Așteaptă 1-2 minute (în funcție de lungimea fișierului)
4. ✅ Gata! Toate audio-urile transpuse!

---

## 📋 Ce Poți Face

### ✅ Sistem Complet:
- **100 melodii** în baza de date
- **52 servicii** generate (Duminici + Luni pentru 6 luni)
- **Upload PDF & Audio** pentru orice melodie
- **Transpunere automată** acorduri în PDF
- **Transpunere automată** audio (pitch shifting)
- **Download** fișiere transpuse
- **Email credențiale** către utilizatori (superadmin)

---

## 📁 Foldere Create

Toate fișierele sunt organizate:
```
backend/uploads/songs/
  ├── song_209_Risen_Domnul_Traie_te/
  │   ├── E/    # Foldere per tonalitate
  │   ├── F/
  │   └── G/
  ├── song_210_Adonai/
  └── ...
```

---

## 🔧 Dacă Ceva Nu Funcționează

### FFmpeg nu e instalat:
```bash
# Instalează:
brew install ffmpeg

# Verifică:
ffmpeg -version
```

### Serviciile nu apar:
```bash
cd backend
npm run db:populate
```

### Erori la upload:
- Verifică că backend-ul rulează (http://localhost:3000)
- Verifică că folderul `uploads/temp` există

---

## 📊 Users Existenți

- **Filip** (superadmin) - poate trimite email-uri
- **29 utilizatori** - trebuie să își schimbe parola la prima autentificare

---

## 📚 Documentație Completă

- **IMPLEMENTATION_COMPLETE_TRANSPUNERE.md** - Ghid complet tehnic
- **FFMPEG_SETUP.md** - Setup FFmpeg detaliat
- **TRANSPUNERE_ROADMAP.md** - Roadmap implementare

---

**🎉 Totul este gata și funcțional!**

**Need help?** Citește documentația sau verifică backend logs.

