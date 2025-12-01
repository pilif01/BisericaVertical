# Tutorial: Pornirea Serverului Backend

Ghid complet pentru configurarea și pornirea serverului backend al aplicației Biserica Vertical Planning Center.

## Cuprins
- [Prerequisite](#prerequisite)
- [Instalare](#instalare)
- [Configurare](#configurare)
- [Pornire Server](#pornire-server)
- [Verificare Funcționare](#verificare-functionare)
- [Troubleshooting](#troubleshooting)

---

## Prerequisite

Înainte de a începe, asigură-te că ai instalate:

- **Node.js** (versiunea 16 sau mai mare)
  - Verifică versiunea: `node --version`
  - Descarcă de la: https://nodejs.org/

- **npm** (vine instalat cu Node.js)
  - Verifică versiunea: `npm --version`

---

## Instalare

### Pasul 1: Navighează în folderul backend

```bash
cd backend
```

### Pasul 2: Instalează dependențele

```bash
npm install
```

Aceasta va instala toate pachetele necesare din [package.json](package.json):
- Express.js (framework server)
- SQLite database (better-sqlite3)
- JWT pentru autentificare
- CORS, Helmet pentru securitate
- Multer pentru upload fișiere
- și altele

---

## Configurare

### Pasul 3: Configurează fișierul .env

1. **Verifică dacă există fișierul .env**:
   ```bash
   ls -la .env
   ```

2. **Dacă NU există**, copiază din exemplu:
   ```bash
   cp .env.example .env
   ```

3. **Editează fișierul .env**:
   ```bash
   # Poți folosi orice editor text
   nano .env
   # sau
   code .env
   # sau
   vim .env
   ```

4. **Configurații importante în .env**:

   ```env
   # Portul pe care rulează serverul
   PORT=3000

   # Modul de rulare (development/production)
   NODE_ENV=development

   # IMPORTANT: Generează un secret puternic pentru JWT
   JWT_SECRET=your_super_secret_key_here_generate_with_openssl
   JWT_EXPIRES_IN=7d

   # Calea către baza de date SQLite
   DATABASE_PATH=./database.db

   # Setări pentru upload fișiere
   UPLOADS_PATH=../public/assets/uploads
   MAX_FILE_SIZE=10485760

   # CORS - originile permise
   CORS_ORIGIN=http://localhost:5173,http://localhost:3000
   ```

5. **Generează un JWT_SECRET puternic** (recomandat):
   ```bash
   openssl rand -base64 64
   ```

   Copiază rezultatul și înlocuiește valoarea `JWT_SECRET` din .env

### Pasul 4: Inițializează baza de date (opțional)

Dacă vrei să resetezi baza de date sau să o creezi prima dată:

```bash
# Inițializează structura bazei de date
npm run db:init

# Populează cu date de test (opțional)
npm run db:seed

# Importă toate cele 99 de melodii din Planning Center
npm run db:import-songs
```

**Important:** Asigură-te că rulezi `npm run db:seed` înainte de a importa melodiile, pentru că scriptul de import necesită un utilizator admin existent.

---

## Pornire Server

Ai două opțiuni pentru a porni serverul:

### Opțiunea 1: Mod Development (recomandat pentru dezvoltare)

```bash
npm run dev
```

**Avantaje:**
- Auto-restart când modifici fișiere
- Perfect pentru development
- Folosește `nodemon`

### Opțiunea 2: Mod Production

```bash
npm start
```

**Avantaje:**
- Rulare standard cu Node.js
- Fără auto-restart
- Pentru producție

---

## Verificare Funcționare

### 1. Verifică output-ul în terminal

După pornire, ar trebui să vezi:

```
🚀 Planning Center Backend
==========================
✅ Server running on http://localhost:3000
📊 Environment: development
🔐 JWT Secret: Configured

📡 Available endpoints:
   POST   /api/auth/login
   GET    /api/auth/me
   GET    /api/services
   POST   /api/votes
   GET    /api/notifications

🔗 API Documentation: http://localhost:3000/api/health
```

### 2. Testează endpoint-ul de health check

Deschide browser-ul sau folosește curl:

```bash
curl http://localhost:3000/api/health
```

Răspuns așteptat:
```json
{
  "status": "ok",
  "timestamp": "2025-10-20T...",
  "environment": "development"
}
```

### 3. Testează în browser

Vizitează: http://localhost:3000/api/health

---

## Troubleshooting

### Problema 1: Port deja în uz

**Eroare:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Soluție:**
1. Schimbă portul în .env:
   ```env
   PORT=3001
   ```
2. SAU oprește procesul care folosește portul 3000:
   ```bash
   # Pe macOS/Linux
   lsof -ti:3000 | xargs kill

   # Pe Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

### Problema 2: Module not found

**Eroare:**
```
Error: Cannot find module 'express'
```

**Soluție:**
```bash
# Șterge node_modules și reinstalează
rm -rf node_modules package-lock.json
npm install
```

### Problema 3: JWT_SECRET not set

**Eroare:**
```
🔐 JWT Secret: NOT SET!
```

**Soluție:**
1. Verifică că fișierul .env există
2. Verifică că JWT_SECRET este setat în .env
3. Nu lăsa valoarea default din .env.example

### Problema 4: Database error

**Eroare:**
```
Error: SQLITE_CANTOPEN: unable to open database file
```

**Soluție:**
```bash
# Inițializează din nou baza de date
npm run db:init
```

### Problema 5: CORS errors în frontend

**Eroare în browser:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Soluție:**
Verifică CORS_ORIGIN în .env să includă URL-ul frontend-ului:
```env
CORS_ORIGIN=http://localhost:5173,http://localhost:3000
```

---

## Comenzi Utile

| Comandă | Descriere |
|---------|-----------|
| `npm start` | Pornește serverul în mod production |
| `npm run dev` | Pornește serverul în mod development cu nodemon |
| `npm run db:init` | Inițializează structura bazei de date |
| `npm run db:seed` | Populează baza de date cu date de test |
| `npm run db:import-songs` | Importă 99 melodii din Planning Center |

---

## Structura Proiectului

```
backend/
├── config/          # Configurații (database, etc)
├── controllers/     # Logica business
├── cron/           # Task-uri programate
├── middleware/     # Middleware Express
├── routes/         # Definirea rutelor API
├── scripts/        # Scripturi pentru DB
├── utils/          # Funcții helper
├── .env            # Configurare (NU commita!)
├── .env.example    # Template pentru .env
├── server.js       # Entry point
└── database.db     # Baza de date SQLite
```

---

## Endpoints Disponibile

### Autentificare
- `POST /api/auth/login` - Login utilizator
- `GET /api/auth/me` - Info utilizator curent

### Servicii
- `GET /api/services` - Lista servicii
- `POST /api/services` - Creare serviciu nou
- `PUT /api/services/:id` - Update serviciu

### Voting
- `POST /api/votes` - Votează pentru disponibilitate
- `GET /api/votes` - Voturi utilizator

### Notificări
- `GET /api/notifications` - Lista notificări
- `PUT /api/notifications/:id` - Marchează ca citită

### Utilizatori
- `GET /api/users` - Lista utilizatori
- `POST /api/users` - Creare utilizator nou

### Cântări
- `GET /api/songs` - Lista cântări
- `POST /api/songs` - Adaugă cântare nouă

---

## Securitate

Serverul include:
- 🔒 **Helmet** - Security headers
- 🔑 **JWT** - Autentificare securizată
- 🛡️ **CORS** - Cross-Origin protection
- 📊 **Rate limiting** - Protecție împotriva spam
- ✅ **Input validation** - Validare date
- 🔐 **Bcrypt** - Hash-uire parole

---

## Suport

Pentru probleme sau întrebări:
1. Verifică secțiunea [Troubleshooting](#troubleshooting)
2. Consultă [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
3. Verifică logs-urile în terminal

---

## License

ISC
