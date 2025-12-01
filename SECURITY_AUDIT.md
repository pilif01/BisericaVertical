# 🔒 AUDIT DE SECURITATE - PLANNING CENTER
**Data:** 13 Octombrie 2025
**Status:** ⚠️ VULNERABILITĂȚI CRITICE IDENTIFICATE

---

## 📊 REZUMAT EXECUTIV

Sistemul Planning Center are **vulnerabilități de securitate critice** care trebuie adresate urgent. Rating actual: **5/10**

### 🚨 Probleme Critice:
1. ❌ JWT Secret hardcodat în `.env` (vizibil în repository)
2. ❌ Token stocat în `localStorage` (vulnerabil la XSS)
3. ❌ Lipsă protecție CSRF
4. ❌ Lipsă rate limiting pe login
5. ❌ Lipsă HTTPS enforcement
6. ❌ Parole fără politici de complexitate
7. ❌ Lipsă 2FA (Two-Factor Authentication)
8. ❌ `.env` committat în git (BAD PRACTICE!)

---

## 🔍 VULNERABILITĂȚI DETALIATE

### 1. **🔴 CRITIC - JWT Secret Expus**
**Locație:** `backend/.env:6`
```env
JWT_SECRET=biserica_vertical_secret_key_2025_change_in_production
```

**Risc:**
- Secret hardcodat și committat în repository
- Oricine cu acces la repository poate genera token-uri valide
- Atacator poate impersona orice utilizator

**Impact:** ⚠️ **FOARTE CRITIC**
**Probabilitate:** 🔴 Foarte Mare

**Recomandare:**
```bash
# Generează un secret puternic
openssl rand -base64 64

# Adaugă în .gitignore
echo ".env" >> .gitignore

# Șterge din git history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch backend/.env" \
  --prune-empty --tag-name-filter cat -- --all
```

---

### 2. **🔴 CRITIC - Token în localStorage (XSS Vulnerability)**
**Locație:** `src/utils/api.ts:4, 34-36`
```typescript
localStorage.setItem('token', token);
localStorage.setItem('user', JSON.stringify(user));
```

**Risc:**
- Atacuri XSS pot accesa `localStorage`
- JavaScript rău-intenționat poate fura token-ul
- Nu se poate proteja cu HttpOnly flag

**Impact:** ⚠️ **FOARTE CRITIC**
**Probabilitate:** 🟠 Mare (dacă există XSS)

**Recomandare:**
- Folosește **HttpOnly cookies** pentru token
- Implementează **SameSite=Strict**
- Folosește **Secure flag** (doar HTTPS)

---

### 3. **🟠 MAJOR - Lipsă Rate Limiting**
**Locație:** `backend/routes/auth.js:7`
```javascript
router.post('/login', authController.login);
```

**Risc:**
- Atacuri brute-force pe login
- Nimeni nu oprește 10,000 încercări pe secundă
- DDoS vulnerabil

**Impact:** 🟠 **MAJOR**
**Probabilitate:** 🔴 Foarte Mare

**Recomandare:**
```javascript
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute
  max: 5, // 5 încercări
  message: 'Prea multe încercări. Încearcă din nou în 15 minute.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, authController.login);
```

---

### 4. **🟠 MAJOR - Lipsă CSRF Protection**
**Locație:** `backend/server.js`

**Risc:**
- Atacuri Cross-Site Request Forgery
- Atacatorul poate executa acțiuni în numele utilizatorului autentificat

**Impact:** 🟠 **MAJOR**
**Probabilitate:** 🟠 Mare

**Recomandare:**
```javascript
const csrf = require('csurf');
const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);
```

---

### 5. **🟡 MEDIU - Parole Slabe Permise**
**Locație:** `backend/controllers/authController.js:92`
```javascript
if (newPassword.length < 6) {
  return res.status(400).json({ error: 'Password must be at least 6 characters' });
}
```

**Risc:**
- Parole de 6 caractere sunt foarte slabe
- Lipsă verificare complexitate (uppercase, numere, simboluri)
- Lipsă verificare împotriva parolelor comune

**Impact:** 🟡 **MEDIU**
**Probabilitate:** 🟠 Mare

**Recomandare:**
```javascript
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{12,}$/;

if (!passwordRegex.test(newPassword)) {
  return res.status(400).json({
    error: 'Parola trebuie să conțină: minim 12 caractere, literă mare, literă mică, cifră și simbol'
  });
}
```

---

### 6. **🟡 MEDIU - Lipsă HTTPS Enforcement**
**Locație:** `backend/server.js`

**Risc:**
- Date transmise în clear text
- Token-uri și parole pot fi interceptate
- Man-in-the-Middle attacks

**Impact:** 🔴 **CRITIC în producție**
**Probabilitate:** 🟡 Medie

**Recomandare:**
```javascript
// Forțează HTTPS în producție
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Setează Security Headers
const helmet = require('helmet');
app.use(helmet());
```

---

### 7. **🟡 MEDIU - Lipsă 2FA (Two-Factor Authentication)**

**Risc:**
- Dacă parola este compromisă, atacatorul are acces complet
- Nu există al doilea layer de securitate

**Impact:** 🟠 **MAJOR pentru admin accounts**
**Probabilitate:** 🟡 Medie

**Recomandare:**
- Implementează 2FA cu TOTP (Google Authenticator, Authy)
- Obligatoriu pentru admin_global și admin_trupa

---

### 8. **🟢 MINOR - CORS Prea Permisiv**
**Locație:** `backend/server.js:10-13`
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}));
```

**Risc:**
- Dacă `CORS_ORIGIN` nu e setat, permite toate originile (`*`)
- Combinat cu `credentials: true` poate fi exploatat

**Impact:** 🟡 **MEDIU**
**Probabilitate:** 🟢 Mică

**Recomandare:**
```javascript
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

---

### 9. **🟢 MINOR - Logging Insuficient pentru Security Events**

**Risc:**
- Nu se logează failed login attempts
- Nu se poate detecta atacuri în timp real
- Nu există audit trail

**Impact:** 🟡 **MEDIU**
**Probabilitate:** 🟠 Mare

**Recomandare:**
```javascript
// În authController.js
if (!isValid) {
  console.warn(`Failed login attempt for user: ${username} from IP: ${req.ip}`);
  // TODO: increment failed_attempts counter in database
  return res.status(401).json({ error: 'Invalid credentials' });
}

console.info(`Successful login for user: ${username} from IP: ${req.ip}`);
```

---

### 10. **🟢 MINOR - SQL Injection (Protejat parțial)**

**Status:** ✅ Bine implementat cu prepared statements
```javascript
const user = db.prepare(`
  SELECT id, username, password_hash FROM users WHERE username = ?
`).get(username);
```

**Risc:** 🟢 **SCĂZUT** - Folosește prepared statements
✅ **BINE IMPLEMENTAT**

---

## 📋 PLAN DE ACȚIUNE PRIORITIZAT

### 🔴 **URGENT (În următoarele 24 ore)**

1. **Regenerează JWT Secret**
   ```bash
   openssl rand -base64 64 > secret.txt
   # Actualizează .env cu noul secret
   # Adaugă .env în .gitignore
   # Șterge .env din git history
   ```

2. **Implementează Rate Limiting**
   ```bash
   npm install express-rate-limit
   ```

3. **Adaugă Security Headers**
   ```bash
   npm install helmet
   ```

### 🟠 **IMPORTANT (În următoarele 7 zile)**

4. **Migrează de la localStorage la HttpOnly Cookies**
5. **Implementează CSRF Protection**
6. **Enforce parole puternice (minim 12 caractere + complexitate)**
7. **Forțează HTTPS în producție**

### 🟡 **RECOMANDABIL (În următoarele 30 zile)**

8. **Implementează 2FA pentru admin accounts**
9. **Adaugă Security Logging și Monitoring**
10. **Implementează account lockout după 5 failed login attempts**
11. **Adaugă Session Management (logout all devices)**

---

## 🛡️ BEST PRACTICES RECOMANDATE

### Environment Variables
```bash
# ❌ BAD
JWT_SECRET=biserica_vertical_secret_key_2025_change_in_production

# ✅ GOOD
JWT_SECRET=<generare cu openssl rand -base64 64>
```

### Password Policy
```
✅ Minim 12 caractere
✅ Cel puțin o literă mare
✅ Cel puțin o literă mică
✅ Cel puțin o cifră
✅ Cel puțin un simbol special
✅ Nu permite parole comune (password123, admin123, etc.)
```

### Token Storage
```
❌ localStorage (vulnerabil la XSS)
✅ HttpOnly Cookie + Secure + SameSite=Strict
```

### HTTPS
```
✅ Forțează HTTPS în producție
✅ Folosește HSTS (HTTP Strict Transport Security)
✅ Certificate SSL valid (Let's Encrypt gratuit)
```

---

## 📊 SCORING DUPĂ IMPLEMENTARE

| Categorie | Scor Actual | Scor După Fix |
|-----------|-------------|---------------|
| Authentication | 5/10 | 9/10 |
| Authorization | 8/10 | 9/10 |
| Data Protection | 3/10 | 9/10 |
| Network Security | 4/10 | 9/10 |
| Monitoring | 2/10 | 7/10 |
| **TOTAL** | **5/10** | **8.6/10** |

---

## 🔗 RESURSE UTILE

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)

---

## ✅ CONCLUZIE

Planner-ul poate fi hackat relativ ușor în starea actuală, **MAI ALES** dacă `.env` cu JWT Secret este vizibil în repository public.

**Priorități absolute:**
1. 🔴 Schimbă JWT Secret URGENT
2. 🔴 Adaugă Rate Limiting
3. 🟠 Migrează la HttpOnly Cookies
4. 🟠 Implementează HTTPS în producție

Cu aceste fix-uri implementate, securitatea va crește de la **5/10** la **8.6/10** ✅
