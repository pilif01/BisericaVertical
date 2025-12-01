# 🚀 Production Deployment Guide - Biserica Vertical

## 📋 Checklist Pre-Deployment

- [x] Toate feature-urile testate local
- [x] Erori TypeScript rezolvate
- [x] Database schema actualizată
- [ ] Environment variables configurate
- [ ] CORS actualizat pentru domeniul production
- [ ] Email credentials actualizate
- [ ] SSL certificat instalat

---

## 🔧 Backend Setup

### 1. **Environment Variables**

Creează fișierul `.env` în `/backend`:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
DB_PATH=./database.db

# JWT Configuration (⚠️ SCHIMBĂ ACEST SECRET!)
JWT_SECRET=generează-un-string-random-foarte-lung-minim-64-caractere
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://biserica-vertical.ro,https://www.biserica-vertical.ro

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=blueprintstudioworks@gmail.com
EMAIL_PASSWORD=syue jmqe kuqn qmwb
```

**⚠️ IMPORTANT:** Generează un JWT_SECRET nou:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. **Instalare Dependențe**

```bash
cd backend
npm install --production
```

### 3. **Inițializare Database**

```bash
# Creează structura bazei de date
npm run db:init

# Adaugă utilizatorii
npm run db:reset-users

# (Opțional) Generează servicii până în 2026
node utils/autoGenerateServices.js
```

### 4. **Pornire Server**

**Opțiunea A - Direct:**
```bash
npm start
```

**Opțiunea B - Cu PM2 (recomandat):**
```bash
npm install -g pm2
pm2 start server.js --name biserica-vertical-backend
pm2 save
pm2 startup
```

### 5. **Verificare**

```bash
curl http://localhost:3000/api/health
```

Ar trebui să răspundă:
```json
{"status":"ok","timestamp":"...","environment":"production"}
```

---

## 🎨 Frontend Setup

### 1. **Environment Variables**

Creează fișierul `.env.production` în `/biserica-vertical-react`:

```bash
VITE_API_BASE_URL=https://api.biserica-vertical.ro
```

SAU pentru deployment pe același server:
```bash
VITE_API_BASE_URL=https://biserica-vertical.ro
```

### 2. **Build Production**

```bash
cd biserica-vertical-react
npm install
npm run build
```

Fișierele vor fi generate în `/biserica-vertical-react/dist/`

### 3. **Deploy Static Files**

**Opțiunea A - Nginx:**

```nginx
server {
    listen 80;
    server_name biserica-vertical.ro www.biserica-vertical.ro;
    
    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name biserica-vertical.ro www.biserica-vertical.ro;
    
    # SSL Configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Frontend (React)
    root /var/www/biserica-vertical/dist;
    index index.html;
    
    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static files caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

**Opțiunea B - Vercel/Netlify:**

1. Conectează repository-ul GitHub
2. Build command: `npm run build`
3. Output directory: `dist`
4. Environment variables: Adaugă `VITE_API_BASE_URL`

---

## 🔐 Securitate

### 1. **JWT Secret**

⚠️ **NICIODATĂ** nu folosi un JWT_SECRET simplu în producție!

```bash
# Generează un secret puternic
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 2. **CORS**

Actualizează în `backend/server.js` linia 51:

```javascript
origin: process.env.CORS_ORIGIN?.split(',') || ['https://bisericavertical.ro', 'https://www.bisericavertical.ro']
```

### 3. **Rate Limiting**

✅ Deja configurat:
- Login: 5 încercări / 15 minute
- API: Rate limiting pe endpoints

### 4. **Helmet Security Headers**

✅ Deja activ cu:
- CSP (Content Security Policy)
- HSTS
- XSS Protection

---

## 📧 Email Configuration

### Gmail App Password

1. Mergi la Google Account → Security
2. Activează 2-Step Verification
3. Generate App Password
4. Actualizează în `.env`:

```bash
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=generated-app-password
```

---

## 🗄️ Database Backup

### Backup automat zilnic:

```bash
# Adaugă în crontab
0 3 * * * cd /path/to/backend && cp database.db backups/database-$(date +\%Y\%m\%d).db
```

### Backup manual:

```bash
cd backend
cp database.db database-backup-$(date +%Y%m%d).db
```

---

## 🔄 Updates și Maintenance

### Update Code:

```bash
# Backend
cd backend
git pull
npm install
pm2 restart biserica-vertical-backend

# Frontend
cd biserica-vertical-react
git pull
npm install
npm run build
# Copiază dist/ pe server
```

### Database Migration:

Când adaugi coloane noi:
```bash
sqlite3 database.db "ALTER TABLE table_name ADD COLUMN new_column TEXT;"
```

---

## 📊 Monitoring

### Logs Backend (cu PM2):

```bash
pm2 logs biserica-vertical-backend
pm2 monit
```

### Health Check:

```bash
curl https://biserica-vertical.ro/api/health
```

### Database Stats:

```bash
sqlite3 database.db "SELECT COUNT(*) FROM users;"
sqlite3 database.db "SELECT COUNT(*) FROM services;"
sqlite3 database.db "SELECT COUNT(*) FROM songs;"
```

---

## 🐛 Troubleshooting

### Backend nu pornește:

```bash
# Verifică logs
pm2 logs biserica-vertical-backend --lines 100

# Verifică port
lsof -i :3000

# Restart
pm2 restart biserica-vertical-backend
```

### CORS Errors:

1. Verifică `CORS_ORIGIN` în `.env`
2. Verifică că domeniul din frontend match-uiește
3. Restartează backend

### Email-uri nu se trimit:

1. Verifică `EMAIL_USER` și `EMAIL_PASSWORD`
2. Verifică că 2FA este activat pe Gmail
3. Verifică logs pentru erori

### Database locked:

```bash
# Oprește toate procesele
pm2 stop biserica-vertical-backend

# Verifică lock
fuser database.db

# Repornește
pm2 start biserica-vertical-backend
```

---

## 🎯 Performance Optimization

### 1. **Enable Gzip în Nginx:**

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 2. **Database Optimization:**

```bash
sqlite3 database.db "VACUUM;"
sqlite3 database.db "ANALYZE;"
```

### 3. **Clean old uploads:**

```bash
# Șterge fișiere mai vechi de 90 zile
find backend/uploads -type f -mtime +90 -delete
```

---

## 📱 Features Availability

### ✅ Complet Funcționale:

- Autentificare JWT
- Planning Center (servicii, votare, assignments)
- Songs Library cu lyrics + acorduri
- Transpunere audio/PDF
- Email notifications + reminders
- Role-based permissions
- Calendar vizualizare
- Export PDF fără diacritice

### 🎵 Noi Features Implementate:

- Lyrics cu acorduri (format [Am]text)
- Viewer cu transpunere live
- Conversie la trepte (1, 2m, 3, etc.)
- Transpunere audio cu Tone.js (păstrează tempo)
- Reminder email 3 zile înainte
- Reminder lunar pentru votare
- Media roles (Operator Cam, Regizor, etc.)

---

## 🔗 URLs Production

- **Frontend:** https://biserica-vertical.ro
- **Backend API:** https://biserica-vertical.ro/api sau https://api.biserica-vertical.ro
- **Admin Login:** https://biserica-vertical.ro/planner/login

---

## 👥 Credențiale Default

⚠️ **Schimbă parolele în producție!**

### Super Admin:
- Username: `Filip`
- Password: `filipb` (trebuie schimbat la primul login)

### Utilizatori:
Vezi în `backend/scripts/reset-users.js` pentru lista completă.

---

## 📞 Support

Pentru probleme tehnice:
- Verifică logs: `pm2 logs`
- Health check: `/api/health`
- Database: verifică cu `sqlite3 database.db`

**🎉 Gata pentru producție!**

---

Last updated: December 2024
Version: 1.0.0

