# 🎉 Noi Funcționalități - Planning Center

## ✅ Ce s-a implementat

### 1. 📊 Reset Utilizatori
- **Șters**: Toți utilizatorii vechi din baza de date
- **Adăugat**: 29 conturi noi pentru echipa Vertical
- **Status**: Toți utilizatorii trebuie să își schimbe parola la prima autentificare

### 2. 👑 Filip - Superadmin
- Filip (username: `Filip`) are acum rolul de **Superadmin** (admin_global)
- Are acces complet la toate funcționalitățile admin
- Poate trimite credențiale prin email la toți utilizatorii

### 3. 🔒 Schimbare Parolă Obligatorie
- **La prima autentificare**, fiecare utilizator trebuie să își schimbe parola
- Parola nouă trebuie să respecte cerințele de securitate:
  - Minim 12 caractere
  - Cel puțin o literă mare
  - Cel puțin o literă mică
  - Cel puțin o cifră
  - Cel puțin un caracter special (@$!%*?&#, etc.)

### 4. 📧 Trimitere Credențiale (Superadmin)
- Buton nou în navbar: **Email** (pentru superadmin)
- Permite selectarea utilizatorilor din baza de date
- Trimite email cu username și link către Planning Center
- Email-urile sunt trimise de la: `blueprintstudioworks@gmail.com`

---

## 🚀 Cum să pornești aplicația

### 1. Pornește Backend
```bash
cd backend
npm start
```
Backend rulează pe: **http://localhost:3000**

### 2. Pornește Frontend
```bash
cd biserica-vertical-react
npm run dev
```
Frontend rulează pe: **http://localhost:5174**

---

## 🔐 Credențiale Utilizatori

Toți utilizatorii au fost creați cu parolele trimise de tine. Iată lista completă:

| Username | Email | Parolă Inițială |
|----------|-------|-----------------|
| Amedeea | amedeeahnatiuc@yahoo.com | amedeeah |
| Amelia | amelia.sophia1@icloud.com | ameliac |
| Ana | anagubernu129@gmail.com | anach |
| Bianca | biancaivascu007@gmail.com | biaiv |
| Bogdan | bogdan08ivascu@gmail.com | bogdiiv |
| Calin | czatic97@gmail.com | calinz |
| Criss | criss.neagu1000@yahoo.com | crissn |
| Daniel | chevron_dany@yahoo.com | danih |
| Eduard | maghetedu@gmail.com | edema |
| **Filip** | bulcfilip641@gmail.com | filipb |
| Georgiana | filipgeorgiana@yahoo.com | georgic |
| Iosua | iosuatiprigan@gmail.com | iosuati |
| Laurențiu | laumoa@gmail.com | lauma |
| Lois | bulclois@gmail.com | lois |
| Mălina | malina_basaraba@yahoo.com | malih |
| Marinusha | sinca_marinusha@yahoo.com | maris |
| Mathias | sincamathias@gmail.com | maths |
| Nicole | nicole_irimia@yahoo.com | nice |
| Robert | perjurobert@gmail.com | robertper |
| Vlad | vladchindea94@gmail.com | vlchd |
| Albert | feheralbert@yahoo.ro | feheralbert@yahoo.ro |
| Alin | alin.stanete@gmail.com | alinstan |
| Andreas | andreasmaghet@gmail.com | andreasmgh |
| ClaudiuH | hegedus.claudiu@gmail.com | claudiuheg |
| ClaudiuC | claudiuclauxiu95@gmail.com | claudiuclau |
| David | david.bilauca@gmail.com | davidB |
| Emanuel | emanuel.cocora@gmail.com | emco |
| MariusCristian | ignatoaiemariuscristian@yahoo.com | MariusCristian |
| Rebeca | rebeca.teban@gmail.com | Rebeca |

**⚠️ IMPORTANT**: Toți utilizatorii trebuie să își schimbe parola la prima autentificare!

---

## 📖 Flow de Utilizare

### Pentru Utilizatori Normali

1. **Login**: Mergi la `http://localhost:5174/planner/login`
2. **Introdu credențialele**: Username și parola inițială
3. **Schimbă parola**: Vei fi redirecționat automat să setezi o parolă nouă
4. **Dashboard**: După schimbarea parolei, vei ajunge la dashboard

### Pentru Filip (Superadmin)

1. **Login**: Username: `Filip`, Parolă: `filipb`
2. **Schimbă parola**: Setează o parolă puternică
3. **Acces Superadmin**:
   - Butonul **Email** apare în navbar (sus-dreapta)
   - Click pe **Email** → Pagina "Trimite Credențiale"
4. **Trimite Email-uri**:
   - Selectează utilizatorii din listă
   - Click pe "Trimite email către X utilizator(i)"
   - Email-urile sunt trimise automat

---

## 📧 Email Configuration

Email-urile sunt trimise de la:
- **Email**: blueprintstudioworks@gmail.com
- **App Password**: syue jmqe kuqn qmwb (configurat în backend)

### Format Email Trimis
```
Subiect: Biserica Vertical - Credențiale Planning Center

Bună [Nume Utilizator],

Contul tău pentru Planning Center a fost creat/actualizat.

Username: [username]
Email: [email]
Link: Planning Center Login

Important: La prima autentificare, vei fi rugat să îți schimbi parola.
```

---

## 🔧 Funcții Tehnice Noi

### Backend

#### 1. Database Migration
```bash
npm run db:add-password-column
```
Adaugă coloana `force_password_change` la tabelul `users`

#### 2. Reset Users
```bash
npm run db:reset-users
```
Șterge utilizatorii vechi și adaugă noii utilizatori Vertical

#### 3. Email Controller
- **Endpoint**: `POST /api/email/send-credentials`
- **Acces**: Doar superadmin
- **Body**: `{ userIds: [1, 2, 3] }`

#### 4. Auth Updates
- **Login**: Returnează `forcePasswordChange: true/false`
- **Endpoint nou**: `POST /api/auth/first-time-password-change`
  - Nu necesită parolă curentă
  - Validează puterea parolei noi
  - Resetează flag-ul `force_password_change`

### Frontend

#### 1. Login cu Schimbare Parolă
- Detectează `forcePasswordChange` la login
- Afișează form pentru setare parolă nouă
- Validare client-side pentru puterea parolei

#### 2. SendCredentials Page
- **Route**: `/planner/send-credentials`
- **Acces**: Doar superadmin
- **Features**:
  - Lista tuturor utilizatorilor
  - Checkbox pentru selectare
  - Selectează tot / Deselectează tot
  - Trimite email-uri în batch
  - Afișează rezultate (success/failed)

#### 3. PlannerNav Update
- Buton **Email** pentru superadmin
- Icon de mail cu styling blue
- Visible doar pentru utilizatori cu rol `admin_global`

---

## 🛡️ Securitate

### Password Requirements
- Minim 12 caractere
- 1 literă mare
- 1 literă mică
- 1 cifră
- 1 caracter special
- Nu poate fi o parolă comună

### Rate Limiting
- Login: Max 5 încercări / 15 minute
- Schimbare parolă: Max 3 / oră

### Logging
- Toate login-urile sunt logate (success + fail)
- Schimbările de parolă sunt logate
- Email-uri trimise sunt logate

---

## 🐛 Troubleshooting

### 1. "Column force_password_change not found"
```bash
cd backend
npm run db:add-password-column
```

### 2. "Email sending failed"
- Verifică configurația Gmail în `backend/controllers/emailController.js`
- Asigură-te că app password-ul este corect
- Verifică conexiunea la internet

### 3. "Cannot access send credentials page"
- Doar Filip (superadmin) poate accesa
- Verifică că Filip are rolul `admin_global`
- Refresh după login

### 4. "Password doesn't meet requirements"
- Minim 12 caractere
- Include majuscule, minuscule, cifre, caractere speciale
- Nu folosi parole comune (password123, etc.)

---

## 📝 Script-uri Disponibile

### Backend
```bash
npm start                    # Pornește serverul
npm run dev                  # Pornește cu nodemon (dev mode)
npm run db:init              # Inițializează baza de date
npm run db:seed              # Populează cu date de test
npm run db:add-password-column   # Adaugă coloana force_password_change
npm run db:reset-users       # Reset utilizatori cu noile conturi Vertical
```

### Frontend
```bash
npm run dev                  # Pornește frontend-ul
npm run build                # Build pentru producție
npm run preview              # Preview build local
```

---

## ✅ Checklist

- [x] Coloana `force_password_change` adăugată
- [x] 29 utilizatori noi creați
- [x] Filip este superadmin
- [x] Toți utilizatorii trebuie să schimbe parola
- [x] Endpoint pentru schimbare parolă (first-time)
- [x] Email controller cu nodemailer
- [x] Pagină SendCredentials pentru superadmin
- [x] Buton Email în navbar pentru superadmin
- [x] Login detectează force_password_change
- [x] Validare securitate parolă (12+ caractere)

---

## 🎯 Next Steps

1. **Pornește backend-ul**: `cd backend && npm start`
2. **Pornește frontend-ul**: `cd biserica-vertical-react && npm run dev`
3. **Loghează-te ca Filip**: Username: `Filip`, Parolă: `filipb`
4. **Schimbă parola**: Setează o parolă puternică
5. **Testează Email**: Click pe butonul **Email** → Selectează utilizatori → Trimite

---

**🎉 Toate funcționalitățile sunt implementate și funcționale!**

Pentru suport, verifică:
- `backend/controllers/emailController.js` - Email logic
- `backend/controllers/authController.js` - Auth + password change
- `biserica-vertical-react/src/pages/planner/Login.tsx` - Login flow
- `biserica-vertical-react/src/pages/planner/SendCredentials.tsx` - Send emails UI

