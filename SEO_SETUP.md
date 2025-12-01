# 🔍 SEO Setup - Biserica Vertical

## ✅ Ce am pregătit

### 1. **robots.txt** ✅
- Permite indexarea paginilor publice
- Blochează /planner/ și /admin/ (zone private)
- Include link la sitemap

### 2. **sitemap.xml** ✅
- Toate paginile publice listate
- Priorități setate corect
- Frecvență de actualizare

### 3. **Meta Tags SEO în index.html** ✅
- Title și description optimizate
- Keywords relevante
- Open Graph pentru social media
- Twitter Cards
- Schema.org structured data
- Canonical URLs

---

## 📋 Pași După Deployment

### 1. **Google Search Console**

#### A. Verificare proprietate
1. Mergi la: https://search.google.com/search-console
2. Click "Add Property"
3. Introduce: `biserica-vertical.ro`
4. Alege metoda de verificare:

**Opțiunea 1 - HTML Tag (recomandat):**
```html
<meta name="google-site-verification" content="YOUR_CODE_HERE" />
```
Adaugă în `index.html` în `<head>`

**Opțiunea 2 - HTML File:**
- Download `googleXXXXXXXX.html`
- Uploadează în `/public/` folder

**Opțiunea 3 - DNS:**
- Adaugă TXT record în DNS-ul Hostico

#### B. Submit Sitemap
1. În Search Console → Sitemaps
2. Add new sitemap: `https://biserica-vertical.ro/sitemap.xml`
3. Click Submit

### 2. **Google My Business**

1. Mergi la: https://www.google.com/business/
2. Claim business: "Biserica Vertical"
3. Completează:
   - Adresă: Splaiul Tudor Vladimirescu 19A, Timișoara
   - Telefon
   - Program: Duminica 10:00-13:00
   - Categorie: Church / Religious Organization
   - Website: https://biserica-vertical.ro

### 3. **Google Analytics (opțional)**

#### A. Creează cont
1. https://analytics.google.com
2. Creează property: biserica-vertical.ro
3. Primești Measurement ID: `G-XXXXXXXXXX`

#### B. Adaugă în index.html
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

---

## 🎯 Optimizări SEO Implementate

### Meta Tags
✅ Title descriptiv: "Biserica Vertical Timișoara - Comunitate Creștină Contemporană"
✅ Description: Include cuvinte cheie și program
✅ Keywords: biserica timisoara, biserica vertical, tineret crestin

### Open Graph
✅ Titlu, descriere, imagine
✅ Optimizat pentru Facebook share
✅ Locale set la ro_RO

### Schema.org
✅ Type: Church
✅ Adresă completă
✅ Program servicii
✅ Social media links (actualizează cu conturile tale reale)

### Performance
✅ SPA routing cu .htaccess
✅ Caching pentru assets
✅ Compression (gzip)

---

## 📊 Keywords Strategy

### Primary Keywords:
- biserica timisoara
- biserica vertical
- biserica crestina timisoara

### Secondary Keywords:
- tineret crestin timisoara
- UNITED tineret
- serviciu religios duminica timisoara
- comunitate crestina timisoara

### Long-tail:
- biserica pentru tineri timisoara
- unde sa merg la biserica in timisoara
- tineret crestin luni seara timisoara

---

## 🔗 Backlinks Strategy

### 1. Local Directories
- Registru Biserici România
- Google My Business
- Facebook Places
- Yelp Romania

### 2. Social Media
- Facebook Page
- Instagram
- YouTube (pentru livestream-uri)

### 3. Content
- Blog posts despre evenimente
- Photos din servicii
- Testimoniale membri

---

## 📈 Monitoring

### Google Search Console - Verifică:
- Coverage (pagini indexate)
- Performance (clicks, impressions)
- Errors (404s, crawl errors)

### Tools:
- Google Search Console: https://search.google.com/search-console
- Google PageSpeed Insights: https://pagespeed.web.dev/
- Google Mobile-Friendly Test: https://search.google.com/test/mobile-friendly

---

## 🚀 Quick Wins

### 1. **Update Schema.org** în index.html
Adaugă numărul de telefon real și link-urile reale social media:
```json
"telephone": "+40-XXX-XXX-XXX",
"sameAs": [
  "https://www.facebook.com/YOUR_ACTUAL_PAGE",
  "https://www.instagram.com/YOUR_ACTUAL_PROFILE"
]
```

### 2. **Creează Google My Business**
Apare în Google Maps și Search local!

### 3. **Submit la Google**
După deployment, mergi la:
https://www.google.com/ping?sitemap=https://biserica-vertical.ro/sitemap.xml

### 4. **Verifică indexarea**
După 1-2 săptămâni:
```
site:biserica-vertical.ro
```
În Google search să vezi câte pagini sunt indexate.

---

## 📝 Content Recommendations

Pentru SEO mai bun:
1. Adaugă mai mult text pe homepage (min 300 cuvinte)
2. Blog cu articole despre evenimente
3. Pagină "Predici" cu înregistrări
4. Pagină "Galerie Foto"
5. Pagină "Mărturii"

---

## ✅ Checklist SEO

- [x] robots.txt creat
- [x] sitemap.xml creat
- [x] Meta tags adăugate
- [x] Schema.org structured data
- [x] Open Graph tags
- [x] Canonical URLs
- [ ] Google Search Console setup (după deployment)
- [ ] Google My Business setup
- [ ] Social media links actualizate
- [ ] Google Analytics (opțional)

---

**🎯 Site-ul e optimizat pentru Google!**

După deployment:
1. Submit sitemap în Google Search Console
2. Claim Google My Business
3. Share pe social media
4. Așteaptă 1-2 săptămâni pentru indexare

**Prima pagină pe Google pentru "biserica vertical timisoara"!** 🚀

