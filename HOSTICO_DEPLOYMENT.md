# 🚀 Deployment pe Hostico - Biserica Vertical

## 📦 Backend (Node.js)

### Pas 1: Pregătește fișierele

Backend-ul **NU necesită build**! Doar uploadezi fișierele.

**Fișiere de uploadat:**
```
backend/
├── config/
├── controllers/
├── cron/
├── middleware/
├── routes/
├── scripts/
├── utils/
├── server.js
├── package.json
├── package-lock.json
└── .env (creezi pe server)
```

**NU uploada:**
- ❌ `node_modules/` (se instalează pe server)
- ❌ `database.db` (se creează pe server)
- ❌ `uploads/` (se creează automat)
- ❌ `.git/`

### Pas 2: Conectare SSH la Hostico

```bash
ssh your-username@your-server.hostico.ro
```

### Pas 3: Uploadare fișiere

**Opțiunea A - SFTP/FTP:**
1. Folosește FileZilla sau WinSCP
2. Conectează-te la serverul Hostico
3. Uploadează folder-ul `backend/` în `/home/your-username/biserica-vertical/backend/`

**Opțiunea B - Git (recomandat):**
```bash
# Pe server
cd /home/your-username/biserica-vertical
git clone YOUR_REPO_URL .
cd backend
```

### Pas 4: Creează fișierul .env pe server

```bash
cd /home/your-username/biserica-vertical/backend
nano .env
```

Adaugă:
```bash
PORT=3000
NODE_ENV=production
DB_PATH=./database.db
JWT_SECRET=generează-un-string-random-foarte-lung-minim-64-caractere
JWT_EXPIRES_IN=7d
CORS_ORIGIN=https://biserica-vertical.ro,https://www.biserica-vertical.ro
FRONTEND_URL=https://biserica-vertical.ro
EMAIL_SERVICE=gmail
EMAIL_USER=blueprintstudioworks@gmail.com
EMAIL_PASSWORD=syue jmqe kuqn qmwb
```

Salvează: `Ctrl+X`, apoi `Y`, apoi `Enter`

**Generează JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Pas 5: Instalează Node.js pe Hostico

Verifică dacă Node.js e instalat:
```bash
node --version
```

Dacă nu e instalat, contactează Hostico support sau instalează NVM:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

### Pas 6: Instalează dependențele

```bash
cd /home/your-username/biserica-vertical/backend
npm install --production
```

### Pas 7: Inițializează baza de date

```bash
npm run db:init
npm run db:reset-users
```

### Pas 8: Pornește serverul cu PM2

```bash
# Instalează PM2 global (dacă nu e instalat)
npm install -g pm2

# Pornește server-ul
pm2 start server.js --name biserica-backend

# Salvează configurația
pm2 save

# Configurează PM2 să pornească la reboot
pm2 startup
```

### Pas 9: Verificare

```bash
# Verifică status
pm2 status

# Verifică logs
pm2 logs biserica-backend

# Test API
curl http://localhost:3000/api/health
```

---

## 🎨 Frontend (React)

### Pas 1: Build local

```bash
cd biserica-vertical-react

# Creează .env.production
echo "VITE_API_BASE_URL=https://biserica-vertical.ro" > .env.production

# Build
npm run build
```

Rezultat: Fișiere în `dist/`

### Pas 2: Upload pe Hostico

**Uploadează conținutul folder-ului `dist/` în:**
```
/home/your-username/public_html/
```

SAU dacă ai subdomain pentru planner:
```
/home/your-username/public_html/planner/
```

**Structură finală:**
```
public_html/
├── index.html
├── assets/
│   ├── index-abc123.js
│   ├── index-def456.css
│   └── hero.mp4
└── ...
```

### Pas 3: Configurare .htaccess pentru SPA routing

Creează `/home/your-username/public_html/.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  
  # Don't rewrite files or directories
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  
  # Rewrite everything else to index.html
  RewriteRule ^ index.html [L]
</IfModule>

# Enable CORS for API calls
<IfModule mod_headers.c>
  Header set Access-Control-Allow-Origin "*"
</IfModule>

# Compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Caching
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

---

## 🔗 Configurare Reverse Proxy (dacă Hostico suportă)

Dacă vrei ca API-ul să fie pe `biserica-vertical.ro/api`:

### Opțiunea A - .htaccess (cPanel)

Adaugă în `.htaccess`:
```apache
# Proxy pentru API
RewriteEngine On
RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]
```

### Opțiunea B - Contactează Hostico Support

Cere-le să configureze un reverse proxy de la `/api` către `localhost:3000`

---

## 🔐 Securitate pe Hostico

### 1. Protejează .env

```bash
chmod 600 /home/your-username/biserica-vertical/backend/.env
```

### 2. Configurează Firewall

Doar portul 80 (HTTP) și 443 (HTTPS) trebuie expuse public.
Port 3000 trebuie accesibil doar local.

### 3. SSL Certificate

Hostico oferă SSL gratuit (Let's Encrypt):
1. Intră în cPanel
2. Mergi la SSL/TLS
3. Activează AutoSSL pentru `biserica-vertical.ro`

---

## 📊 Management și Monitoring

### Logs

```bash
# Logs PM2
pm2 logs biserica-backend

# Logs detaliate
pm2 logs biserica-backend --lines 100
```

### Restart

```bash
pm2 restart biserica-backend
```

### Stop

```bash
pm2 stop biserica-backend
```

### Status

```bash
pm2 status
pm2 monit
```

---

## 🔄 Update Code

### Update Backend

```bash
ssh your-username@your-server.hostico.ro
cd /home/your-username/biserica-vertical/backend
git pull
npm install --production
pm2 restart biserica-backend
```

### Update Frontend

```bash
# Local
cd biserica-vertical-react
npm run build

# Upload dist/ prin FTP/SFTP la public_html/
```

---

## 🐛 Troubleshooting Hostico

### Backend nu pornește

```bash
# Verifică logs
pm2 logs biserica-backend --err

# Verifică dacă Node.js e instalat
node --version

# Verifică dacă portul 3000 e liber
netstat -tuln | grep 3000
```

### "Cannot find module"

```bash
cd backend
rm -rf node_modules
npm install --production
pm2 restart biserica-backend
```

### Database errors

```bash
cd backend
chmod 644 database.db
npm run db:init
```

### Email nu se trimite

Verifică că Hostico permite conexiuni SMTP externe (port 587/465).
Unii provideri blochează SMTP pentru anti-spam.

---

## ⚡ Quick Commands

```bash
# Start
cd ~/biserica-vertical/backend && pm2 start server.js --name biserica-backend

# Status
pm2 status

# Logs
pm2 logs biserica-backend --lines 50

# Restart
pm2 restart biserica-backend

# Stop
pm2 stop biserica-backend

# Delete
pm2 delete biserica-backend
```

---

## 📞 Contact Hostico Support

Dacă întâmpini probleme:
- **Email:** support@hostico.ro
- **Chat:** Pe site-ul lor
- **Telefon:** Vezi pe site

Cere-le ajutor pentru:
- Instalare Node.js / PM2
- Configurare reverse proxy
- Deschidere port 3000 (doar local)
- SSL certificate

---

## ✅ Checklist Final

- [ ] Backend uploadat pe server
- [ ] `.env` creat și configurat
- [ ] `npm install` executat
- [ ] Database inițializată
- [ ] PM2 pornit și salvat
- [ ] Frontend build și uploadat
- [ ] `.htaccess` configurat
- [ ] SSL activat
- [ ] Teste: login, votare, notificări
- [ ] Email-uri funcționează

---

**🎉 Gata pentru live pe biserica-vertical.ro!**

