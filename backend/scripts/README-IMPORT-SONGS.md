# Import Melodii din Planning Center

## Descriere

Acest script importă toate cele 99 de melodii din Planning Center în baza de date SQLite a aplicației Biserica Vertical.

## Caracteristici

- **99 melodii complete** cu titluri, chei muzicale, tempo și limbă
- **Fără date de programare** - melodiile sunt importate clean, gata de a fi adăugate în servicii
- **Keys multiple** - melodiile cu mai multe chei au cheia principală în `key_signature` și restul în `tags`
- **Detecție duplicate** - scriptul nu va adăuga melodii duplicate
- **Safe import** - folosește `INSERT OR IGNORE` pentru siguranță

## Utilizare

### Prerequisite

Înainte de a rula scriptul, asigură-te că:

1. **Baza de date este inițializată:**
   ```bash
   npm run db:init
   ```

2. **Există un utilizator admin:**
   ```bash
   npm run db:seed
   ```

### Rulare Script

```bash
node scripts/import-songs.js
```

### Output Așteptat

```
🎵 Importing songs from Planning Center...
📁 Database path: /Users/.../backend/database.db
✅ Risen (Domnul Trăiește)
✅ Adonai
✅ Aduceți ca Jertfă
...
✅ Zideste In Mine

🎉 Import completed!

📊 Summary:
   ✅ Songs inserted: 99
   ⏭️  Songs skipped (duplicates): 0
   📝 Total songs processed: 99
```

## Structura Datelor

Fiecare melodie este importată cu următoarele informații:

| Câmp | Tip | Descriere | Exemplu |
|------|-----|-----------|---------|
| `title` | String | Titlul melodiei (cu versiune engleză dacă există) | "Bunătatea Ta (Goodness of God)" |
| `key_signature` | String | Cheia muzicală principală | "D", "A", "G" |
| `tempo` | Integer | BPM (beats per minute) | 72, 120, 68 |
| `language` | String | Limba melodiei | "ro", "en", "he" |
| `tags` | JSON | Chei alternative (dacă există) | `["alternate_keys:C,D,E"]` |
| `created_by` | Integer | ID-ul utilizatorului admin | 1 |

## Exemple de Melodii Importate

### Melodie simplă (o singură cheie)
```json
{
  "title": "Atotputernic",
  "key_signature": "E",
  "tempo": 75,
  "language": "ro",
  "tags": null
}
```

### Melodie cu chei multiple
```json
{
  "title": "Lupta e doar a Ta (Battle Belongs)",
  "key_signature": "A",
  "tempo": 81,
  "language": "ro",
  "tags": ["alternate_keys:C,D,Db,E,F,F#,G"]
}
```

### Melodie fără tempo
```json
{
  "title": "Tie ma predau",
  "key_signature": "F",
  "tempo": null,
  "language": "ro",
  "tags": null
}
```

## Verificare Import

După rularea scriptului, poți verifica că melodiile au fost importate corect:

```bash
# Numără melodiile
sqlite3 database.db "SELECT COUNT(*) FROM songs;"

# Afișează primele 10 melodii
sqlite3 database.db "SELECT title, key_signature, tempo FROM songs LIMIT 10;"

# Caută o melodie specifică
sqlite3 database.db "SELECT * FROM songs WHERE title LIKE '%Bunătatea%';"

# Melodii în limba română
sqlite3 database.db "SELECT COUNT(*) FROM songs WHERE language = 'ro';"

# Melodii cu tempo rapid (>100 BPM)
sqlite3 database.db "SELECT title, tempo FROM songs WHERE tempo > 100 ORDER BY tempo DESC;"
```

## Categorii de Melodii

### După limbă:
- **Română (ro):** 96 melodii
- **Engleză (en):** 2 melodii (Praise, Way Maker)
- **Ebraică (he):** 1 melodie (Adonai)

### După tempo (aprox.):
- **Lente (<70 BPM):** Melodii de închinare intimă
- **Moderate (70-90 BPM):** Majoritatea melodiilor
- **Energice (>100 BPM):** Melodii de laudă activă

### Melodii speciale (Crăciun/Paști):
- Auzi Corul Îngeresc
- Cântați cu toții Isus domnește-n veci
- Cântați toți de bucurie
- E Crăciunul
- El Va Domni
- Îngerii din ceruri cântă
- O, Noapte Sfântă
- Primul Noel
- Priviți, El a venit
- Cristos a Înviat din Morți
- Cristos din morți a înviat
- Happy Day
- Slăvit E Azi Numele Isus
- Om al durerii

## Re-import

Dacă vrei să re-importezi melodiile:

1. **Scriptul este safe** - folosește `INSERT OR IGNORE`, deci nu va crea duplicate
2. **Pentru reset complet:**
   ```bash
   # Șterge toate melodiile
   sqlite3 database.db "DELETE FROM songs;"

   # Re-importă
   node scripts/import-songs.js
   ```

3. **Pentru a șterge doar melodiile importate (păstrează testele):**
   ```bash
   # Șterge doar melodiile create de script
   sqlite3 database.db "DELETE FROM songs WHERE title LIKE '%(%)%';"

   # Re-importă
   node scripts/import-songs.js
   ```

## Troubleshooting

### Eroare: "Admin user not found"

**Cauză:** Nu există utilizator admin în baza de date

**Soluție:**
```bash
npm run db:seed
```

### Eroare: "table songs does not exist"

**Cauză:** Baza de date nu este inițializată

**Soluție:**
```bash
npm run db:init
```

### Melodii duplicate

**Cauză:** Scriptul a fost rulat de mai multe ori

**Soluție:** Scriptul folosește `INSERT OR IGNORE`, deci duplicate-urile sunt pur și simplu sărite. Nu este nevoie de acțiune.

## Utilizare în Aplicație

După import, melodiile pot fi:

1. **Căutate** în biblioteca de cântări
2. **Adăugate** la servicii și evenimente
3. **Filtrate** după cheie, tempo, limbă
4. **Editate** (titlu, cheie, tempo, tags)
5. **Șterse** individual dacă nu sunt folosite

## Diferențe față de Planning Center

| Caracteristică | Planning Center | Aplicația noastră |
|----------------|-----------------|-------------------|
| Date programate | DA | NU (importate clean) |
| Artist | DA | NU (se poate adăuga manual) |
| Attachment-uri | DA | NU |
| CCLI | DA | NU |
| Aranjamente | DA | NU |
| Versuri | DA | NU (se poate adăuga prin tags/notes) |

## Viitor

Extensii posibile pentru script:

- [ ] Import din fișier CSV
- [ ] Import din API Planning Center
- [ ] Import artist pentru fiecare melodie
- [ ] Import versuri
- [ ] Import CCLI numbers
- [ ] Sincronizare automată cu Planning Center

## Suport

Pentru probleme cu scriptul de import:
1. Verifică că ai rulat `npm run db:init` și `npm run db:seed`
2. Verifică că fișierul `database.db` există în folderul backend
3. Consultă logs-urile pentru erori specifice
