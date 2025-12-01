const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '../database.db'));

// Lista completă de melodii cu tonalități
const songsWithKeys = [
  { title: 'Risen (Domnul Trăiește)', keys: ['E'] },
  { title: 'Adonai', keys: ['Am'] },
  { title: 'Aduceți ca Jertfă', keys: ['E', 'G'] },
  { title: 'Agnus Dei', keys: ['A', 'Bb', 'F', 'F#', 'G'] },
  { title: 'Atotputernic', keys: ['E'] },
  { title: 'Auzi Corul Îngeresc (Hark! The Herald Angels Sing)', keys: ['B', 'C', 'C#'] },
  { title: 'Binecuvântat (Blessed Be the Name of the Lord)', keys: ['A', 'F', 'F#', 'G'] },
  { title: 'Bunătatea Ta (Goodness of God)', keys: ['A', 'C', 'G'] },
  { title: 'Cânt Aleluia (Light of the World)', keys: ['C#', 'D'] },
  { title: 'Cântați cu toții Isus domnește-n veci (Christmas Day)', keys: ['C', 'C#'] },
  { title: 'Cântați toți de bucurie (Joy to the world)', keys: ['B'] },
  { title: 'Ce Dar Măreț e Isus Salvatorul', keys: ['C', 'D'] },
  { title: 'Ce Dar Nemeritat (This is Amazing Grace)', keys: ['A', 'D', 'E', 'G'] },
  { title: 'Ce Mare Este Dragostea Ta (How Great is Your Love)', keys: ['C', 'F', 'G'] },
  { title: 'Ce mare ești Tu (Splendoare de Împărat)', keys: ['Db', 'G'] },
  { title: 'Celui ce Șade pe Tron', keys: ['C', 'F', 'F#', 'G'] },
  { title: 'Centrul Vieții', keys: ['F', 'F#', 'G', 'G#'] },
  { title: 'Chemăm Numele Tău', keys: ['F', 'F#', 'G'] },
  { title: 'Cine e ca El (Who is like the Lord)', keys: ['C', 'E', 'F', 'G'] },
  { title: 'Cine e vrednic? (Who Else)', keys: ['Ab', 'G'] },
  { title: 'Cinste, Onoare', keys: ['C'] },
  { title: 'Credința Mea eu o Zidesc (Cornerstone)', keys: ['C', 'D'] },
  { title: 'Crezul (The Creed)', keys: ['G'] },
  { title: 'Cristos a Înviat din Morți (Cu Moartea pe Moarte Călcând)', keys: ['C', 'C#'] },
  { title: 'Cristos din morți a înviat (Christ is risen)', keys: ['G'] },
  { title: 'De Ziua Ta', keys: ['C'] },
  { title: 'Doamne Ești Bun', keys: ['A'] },
  { title: 'Doamne, Tu salvezi', keys: ['F'] },
  { title: 'Doar Un Aleluia (Gratitude)', keys: ['Bb', 'C', 'D', 'D#', 'E', 'Eb', 'F'] },
  { title: 'Domn al Slavei', keys: ['F', 'G'] },
  { title: 'Domnești în veci (Reign Above It All)', keys: ['D', 'E', 'F'] },
  { title: 'Domnul Este Bun', keys: ['A', 'G'] },
  { title: 'Domnul Miracolelor', keys: ['A', 'Bb', 'F#', 'G'] },
  { title: 'Dragostea Dintâi', keys: ['E'] },
  { title: 'E Crăciunul (Christmas Morning)', keys: ['G'] },
  { title: 'Egipt (Egypt)', keys: ['C', 'D'] },
  { title: 'El Va Domni (He Shall Reign Forevermore)', keys: ['C#', 'D', 'Eb'] },
  { title: 'Ești Dumnezeu Nemărginit', keys: ['E', 'Eb', 'F'] },
  { title: 'Eu Cânt Azi Aleluia (Raise A Hallelujah)', keys: ['C', 'D', 'E'] },
  { title: 'Eu de Tine am Nevoie', keys: ['C'] },
  { title: 'Face of God (Cerul Nopții Înstelat)', keys: ['G'] },
  { title: 'Fii Întronat (Be Enthroned)', keys: ['C', 'F', 'F#', 'G'] },
  { title: 'Glorificat', keys: ['C'] },
  { title: 'Hai Deschide Inima Ta', keys: ['G'] }, // G-A interpretat ca G
  { title: 'Haină de Laudă', keys: ['A', 'Bb', 'F'] },
  { title: 'Happy Day (Oh ai înviat)', keys: ['F', 'G'] },
  { title: 'Holy Forever (Sfânt Din Veșnicie)', keys: ['Bb', 'F', 'G'] },
  { title: 'Hymn Of Heaven(Imn al vesniciei)', keys: ['A', 'C', 'G'] },
  { title: 'Il vreau pe Isus (Give me Jesus)', keys: ['G'] },
  { title: 'Îngerii din ceruri cântă + Îi vom cânta', keys: ['D'] },
  { title: 'Îngerii și Sfinții (Worthy Of It All)', keys: ['C', 'D', 'Eb'] },
  { title: 'Isus e Rege', keys: ['C', 'D'] },
  { title: 'Isus ești Domnul Domnilor', keys: ['C', 'G'] },
  { title: 'Îți Dau Toată Viața', keys: ['F', 'F#'] },
  { title: 'Îți Mulțumesc (Grateful)', keys: ['C', 'G'] },
  { title: 'Iubirea Ta', keys: ['C', 'E', 'F', 'G'] },
  { title: 'King Of Kings (Rege al Regilor)', keys: ['C', 'D'] },
  { title: 'King Of My Heart (Fie Regele Meu)', keys: ['A', 'G'] },
  { title: 'Laud Numele Tau, Isus (What A Beautiful Name)', keys: ['D', 'E', 'Eb'] },
  { title: 'Laudat să fii doar Tu', keys: ['D', 'E', 'Eb'] },
  { title: 'Leu și Miel (The Lion And The Lamb)', keys: ['D', 'E'] },
  { title: 'Living Hope (Isus Cristos, speranța mea)', keys: ['A'] },
  { title: 'Lupta e doar a Ta (Battle Belongs)', keys: ['A', 'C', 'D', 'Db', 'E', 'F', 'F#', 'G'] },
  { title: 'Mă-ntorc la Inima Închinării (Muzica-ncetat) (The Heart Of Worship)', keys: ['C', 'G'] },
  { title: 'Mare Dumnezeu (Doar Prin Tine)', keys: ['E'] },
  { title: 'Măreț Salvator (Doamne, Tu ce miști chiar munții) (Mighty To Save)', keys: ['A', 'G'] },
  { title: 'Mărețul Har', keys: ['D', 'E', 'F', 'G'] },
  { title: 'Mii De Laude', keys: ['Bb', 'C', 'D', 'E', 'G'] },
  { title: 'Mulțumesc, Isus (Thank You Jesus For The Blood)', keys: ['Bb', 'C'] },
  { title: 'Mulțumesc, Isus, pentru tot ce ai facut', keys: ['C', 'D#'] },
  { title: 'Nimeni nu este ca El (Te-ncoronăm cu laude) (No One Like The Lord)', keys: ['D', 'E'] },
  { title: 'Nimeni Nu-i Ca Tine, Isus', keys: ['A', 'G'] },
  { title: 'Numele Tău Este Mare', keys: ['A', 'Bb', 'D'] },
  { title: 'O, Noapte Sfântă (O Holy Night)', keys: ['C', 'C#', 'D'] },
  { title: 'Om al durerii (Man Of Sorrows)', keys: ['D', 'F'] },
  { title: 'Osana', keys: ['F', 'F#', 'G'] },
  { title: 'Praise', keys: ['A', 'C', 'F', 'G'] },
  { title: 'Primul Noel (The First Noel)', keys: ['G'] },
  { title: 'Priviți, El a venit (Behold)', keys: ['B'] },
  { title: 'Regele Suprem (There Is A King)', keys: ['A', 'Bb', 'C'] },
  { title: 'Singurul Vrednic', keys: ['E', 'G'] },
  { title: 'Slava e a Ta', keys: ['F'] },
  { title: 'Slăvit E Azi Numele Isus (O Praise The Name)', keys: ['Bb', 'C'] },
  { title: 'Știind Că-i Viu (Because He Lives)', keys: ['C', 'D'] }, // D-E interpretat ca D
  { title: 'Tatăl Nostru (Our Father)', keys: ['C'] },
  { title: 'Te-am chemat', keys: ['F'] },
  { title: 'The Blessing (Cântecul Binecuvântării)', keys: ['A', 'G'] },
  { title: 'Tie ma predau', keys: ['F'] },
  { title: 'Ție-ți Dau Inima (Aceasta Mi-e Dorința) (This is my desire)', keys: ['D', 'E'] },
  { title: 'Toată Închinarea (Lumina Lumii)', keys: ['C', 'D', 'Eb', 'F', 'G'] },
  { title: 'Tu Domnești', keys: ['C', 'E', 'Eb', 'F', 'F#'] },
  { title: 'Tu Ești Credincios', keys: ['C', 'D'] },
  { title: 'Tu Îmi Dai Curaj (You Make Me Brave)', keys: ['D'] },
  { title: 'Unde', keys: [] }, // Nu are tonalitate specificată
  { title: 'Vrednic', keys: ['D', 'F', 'G'] },
  { title: 'Vrednic de Închinare (None Like You)', keys: ['A', 'Bb', 'C', 'F'] },
  { title: 'Way Maker', keys: ['D', 'G'] },
  { title: 'Worthy (Vrednic Ești Doar Tu)', keys: ['C', 'D'] },
  { title: 'Zideste In Mine', keys: ['F'] }
];

console.log('🎵 Actualizare tonalități pentru toate melodiile...\n');

let updated = 0;
let notFound = 0;
let totalKeys = 0;

for (const songData of songsWithKeys) {
  // Găsește melodia în baza de date
  const song = db.prepare('SELECT id, title FROM songs WHERE title = ?').get(songData.title);

  if (!song) {
    console.log(`❌ Nu am găsit: "${songData.title}"`);
    notFound++;
    continue;
  }

  // Șterge tonalitățile existente
  db.prepare('DELETE FROM song_keys WHERE song_id = ?').run(song.id);

  // Adaugă tonalitățile noi
  if (songData.keys.length === 0) {
    console.log(`⚠️  "${song.title}" - Nicio tonalitate specificată`);
    updated++;
    continue;
  }

  for (let i = 0; i < songData.keys.length; i++) {
    const key = songData.keys[i];
    const isOriginal = i === 0; // Prima tonalitate = originală

    db.prepare(`
      INSERT INTO song_keys (song_id, key_signature, is_original, created_at, updated_at)
      VALUES (?, ?, ?, datetime('now'), datetime('now'))
    `).run(song.id, key, isOriginal ? 1 : 0);

    totalKeys++;
  }

  console.log(`✅ "${song.title}" - ${songData.keys.length} tonalități: ${songData.keys.join(', ')}`);
  updated++;
}

console.log('\n📊 Rezumat:');
console.log(`   ✅ Melodii actualizate: ${updated}`);
console.log(`   ❌ Melodii negăsite: ${notFound}`);
console.log(`   🎹 Total tonalități adăugate: ${totalKeys}`);

db.close();
