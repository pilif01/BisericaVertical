/**
 * Import Songs from Planning Center
 * Importă toate melodiile din Planning Center în baza de date
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.db');

console.log('🎵 Importing songs from Planning Center...');
console.log('📁 Database path:', DB_PATH);

const db = new Database(DB_PATH);
db.pragma('foreign_keys = ON');

// Get admin user ID for created_by
const adminUser = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');

if (!adminUser) {
  console.error('❌ Admin user not found! Please run seed-database.js first.');
  process.exit(1);
}

// ============================================
// SONGS DATA - 99 melodii din Planning Center
// ============================================

const songs = [
  { title: 'Risen (Domnul Trăiește)', tempo: 132, keys: ['E'], language: 'ro' },
  { title: 'Adonai', tempo: 108, keys: ['Am'], language: 'he' },
  { title: 'Aduceți ca Jertfă', tempo: 128, keys: ['E', 'G'], language: 'ro' },
  { title: 'Agnus Dei', tempo: 68, keys: ['A', 'Bb', 'F', 'F#', 'G'], language: 'ro' },
  { title: 'Atotputernic', tempo: 75, keys: ['E'], language: 'ro' },
  { title: 'Auzi Corul Îngeresc (Hark! The Herald Angels Sing)', tempo: 94, keys: ['B', 'C', 'C#'], language: 'ro' },
  { title: 'Binecuvântat (Blessed Be the Name of the Lord)', tempo: 117, keys: ['A', 'F', 'F#', 'G'], language: 'ro' },
  { title: 'Bunătatea Ta (Goodness of God)', tempo: 63, keys: ['A', 'C', 'G'], language: 'ro' },
  { title: 'Cânt Aleluia (Light of the World)', tempo: 108, keys: ['C#', 'D'], language: 'ro' },
  { title: 'Cântați cu toții Isus domnește-n veci (Christmas Day)', tempo: 90, keys: ['C', 'C#'], language: 'ro' },
  { title: 'Cântați toți de bucurie (Joy to the world)', tempo: 148, keys: ['B'], language: 'ro' },
  { title: 'Ce Dar Măreț e Isus Salvatorul', tempo: 73, keys: ['C', 'D'], language: 'ro' },
  { title: 'Ce Dar Nemeritat (This is Amazing Grace)', tempo: 98, keys: ['A', 'D', 'E', 'G'], language: 'ro' },
  { title: 'Ce Mare Este Dragostea Ta (How Great is Your Love)', tempo: 74, keys: ['C', 'F', 'G'], language: 'ro' },
  { title: 'Ce mare ești Tu (Splendoare de Împărat)', tempo: 76, keys: ['Db', 'G'], language: 'ro' },
  { title: 'Celui ce Șade pe Tron', tempo: 67, keys: ['C', 'F', 'F#', 'G'], language: 'ro' },
  { title: 'Centrul Vieții', tempo: 70, keys: ['F', 'F#', 'G', 'G#'], language: 'ro' },
  { title: 'Chemăm Numele Tău', tempo: 84, keys: ['F', 'F#', 'G'], language: 'ro' },
  { title: 'Cine e ca El (Who is like the Lord)', tempo: 88, keys: ['C', 'E', 'F', 'G'], language: 'ro' },
  { title: 'Cine e vrednic? (Who Else)', tempo: 68, keys: ['Ab', 'G'], language: 'ro' },
  { title: 'Cinste, Onoare', tempo: 95, keys: ['C'], language: 'ro' },
  { title: 'Credința Mea eu o Zidesc (Cornerstone)', tempo: 71.5, keys: ['C', 'D'], language: 'ro' },
  { title: 'Crezul (The Creed)', tempo: 140, keys: ['G'], language: 'ro' },
  { title: 'Cristos a Înviat din Morți (Cu Moartea pe Moarte Călcând)', tempo: 85, keys: ['C', 'C#'], language: 'ro' },
  { title: 'Cristos din morți a înviat (Christ is risen)', tempo: 70, keys: ['G'], language: 'ro' },
  { title: 'De Ziua Ta', tempo: 68, keys: ['C'], language: 'ro' },
  { title: 'Doamne Ești Bun', tempo: 130, keys: ['A'], language: 'ro' },
  { title: 'Doamne, Tu salvezi', tempo: 130, keys: ['F'], language: 'ro' },
  { title: 'Doar Un Aleluia (Gratitude)', tempo: 78, keys: ['Bb', 'C', 'D', 'D#', 'E', 'Eb', 'F'], language: 'ro' },
  { title: 'Domn al Slavei', tempo: 90, keys: ['F', 'G'], language: 'ro' },
  { title: 'Domnești în veci (Reign Above It All)', tempo: 75, keys: ['D', 'E', 'F'], language: 'ro' },
  { title: 'Domnul Este Bun', tempo: 130, keys: ['A', 'G'], language: 'ro' },
  { title: 'Domnul Miracolelor', tempo: 71, keys: ['A', 'Bb', 'F#', 'G'], language: 'ro' },
  { title: 'Dragostea Dintâi', tempo: 94, keys: ['E'], language: 'ro' },
  { title: 'E Crăciunul (Christmas Morning)', tempo: 136, keys: ['G'], language: 'ro' },
  { title: 'Egipt (Egypt)', tempo: 75, keys: ['C', 'D'], language: 'ro' },
  { title: 'El Va Domni (He Shall Reign Forevermore)', tempo: 122, keys: ['C#', 'D', 'Eb'], language: 'ro' },
  { title: 'Ești Dumnezeu Nemărginit', tempo: 132, keys: ['E', 'Eb', 'F'], language: 'ro' },
  { title: 'Eu Cânt Azi Aleluia (Raise A Hallelujah)', tempo: 82, keys: ['C', 'D', 'E'], language: 'ro' },
  { title: 'Eu de Tine am Nevoie', tempo: 75, keys: ['C'], language: 'ro' },
  { title: 'Face of God (Cerul Nopții Înstelat)', tempo: 71, keys: ['G'], language: 'ro' },
  { title: 'Fii Întronat (Be Enthroned)', tempo: 71, keys: ['C', 'F', 'F#', 'G'], language: 'ro' },
  { title: 'Glorificat', tempo: 118, keys: ['C'], language: 'ro' },
  { title: 'Hai Deschide Inima Ta', tempo: 84, keys: ['G', 'A'], language: 'ro' },
  { title: 'Haină de Laudă', tempo: 136, keys: ['A', 'Bb', 'F'], language: 'ro' },
  { title: 'Happy Day (Oh ai înviat)', tempo: 132, keys: ['F', 'G'], language: 'ro' },
  { title: 'Holy Forever (Sfânt Din Veșnicie)', tempo: 72, keys: ['Bb', 'F', 'G'], language: 'ro' },
  { title: 'Hymn Of Heaven (Imn al vesniciei)', tempo: 71, keys: ['A', 'C', 'G'], language: 'ro' },
  { title: 'Il vreau pe Isus (Give me Jesus)', tempo: 69.5, keys: ['G'], language: 'ro' },
  { title: 'Îngerii din ceruri cântă + Îi vom cânta', tempo: 113, keys: ['D'], language: 'ro' },
  { title: 'Îngerii și Sfinții (Worthy Of It All)', tempo: 68, keys: ['C', 'D', 'Eb'], language: 'ro' },
  { title: 'Isus e Rege', tempo: 75, keys: ['C', 'D'], language: 'ro' },
  { title: 'Isus ești Domnul Domnilor', tempo: 66, keys: ['C', 'G'], language: 'ro' },
  { title: 'Îți Dau Toată Viața', tempo: 154, keys: ['F', 'F#'], language: 'ro' },
  { title: 'Îți Mulțumesc (Grateful)', tempo: 96, keys: ['C', 'G'], language: 'ro' },
  { title: 'Iubirea Ta', tempo: 128, keys: ['C', 'E', 'F', 'G'], language: 'ro' },
  { title: 'King Of Kings (Rege al Regilor)', tempo: 68, keys: ['C', 'D'], language: 'ro' },
  { title: 'King Of My Heart (Fie Regele Meu)', tempo: 136, keys: ['A', 'G'], language: 'ro' },
  { title: 'Laud Numele Tau, Isus (What A Beautiful Name)', tempo: 68, keys: ['D', 'E', 'Eb'], language: 'ro' },
  { title: 'Laudat să fii doar Tu', tempo: 82, keys: ['D', 'E', 'Eb'], language: 'ro' },
  { title: 'Leu și Miel (The Lion And The Lamb)', tempo: 90, keys: ['D', 'E'], language: 'ro' },
  { title: 'Living Hope (Isus Cristos, speranța mea)', tempo: 72, keys: ['A'], language: 'ro' },
  { title: 'Lupta e doar a Ta (Battle Belongs)', tempo: 81, keys: ['A', 'C', 'D', 'Db', 'E', 'F', 'F#', 'G'], language: 'ro' },
  { title: 'Mă-ntorc la Inima Închinării (Muzica-ncetat) (The Heart Of Worship)', tempo: 68, keys: ['C', 'G'], language: 'ro' },
  { title: 'Mare Dumnezeu (Doar Prin Tine)', tempo: 120, keys: ['E'], language: 'ro' },
  { title: 'Măreț Salvator (Doamne, Tu ce miști chiar munții) (Mighty To Save)', tempo: 75, keys: ['A', 'G'], language: 'ro' },
  { title: 'Mărețul Har', tempo: 123, keys: ['D', 'E', 'F', 'G'], language: 'ro' },
  { title: 'Mii De Laude', tempo: 130, keys: ['Bb', 'C', 'D', 'E', 'G'], language: 'ro' },
  { title: 'Mulțumesc, Isus (Thank You Jesus For The Blood)', tempo: 61, keys: ['Bb', 'C'], language: 'ro' },
  { title: 'Mulțumesc, Isus, pentru tot ce ai facut', tempo: 86, keys: ['C', 'D#'], language: 'ro' },
  { title: 'Nimeni nu este ca El (Te-ncoronăm cu laude) (No One Like The Lord)', tempo: 72, keys: ['D', 'E'], language: 'ro' },
  { title: 'Nimeni Nu-i Ca Tine, Isus', tempo: 81, keys: ['A', 'G'], language: 'ro' },
  { title: 'Numele Tău Este Mare', tempo: 128, keys: ['A', 'Bb', 'D'], language: 'ro' },
  { title: 'O, Noapte Sfântă (O Holy Night)', tempo: 90, keys: ['C', 'C#', 'D'], language: 'ro' },
  { title: 'Om al durerii (Man Of Sorrows)', tempo: 72, keys: ['D', 'F'], language: 'ro' },
  { title: 'Osana', tempo: 65, keys: ['F', 'F#', 'G'], language: 'ro' },
  { title: 'Praise', tempo: 127, keys: ['A', 'C', 'F', 'G'], language: 'en' },
  { title: 'Primul Noel (The First Noel)', tempo: 113, keys: ['G'], language: 'ro' },
  { title: 'Priviți, El a venit (Behold)', tempo: 73.5, keys: ['B'], language: 'ro' },
  { title: 'Regele Suprem (There Is A King)', tempo: 64, keys: ['A', 'Bb', 'C'], language: 'ro' },
  { title: 'Singurul Vrednic', tempo: 75, keys: ['E', 'G'], language: 'ro' },
  { title: 'Slava e a Ta', tempo: 70, keys: ['F'], language: 'ro' },
  { title: 'Slăvit E Azi Numele Isus (O Praise The Name)', tempo: 72, keys: ['Bb', 'C'], language: 'ro' },
  { title: 'Știind Că-i Viu (Because He Lives)', tempo: 62, keys: ['C', 'D', 'D-E'], language: 'ro' },
  { title: 'Tatăl Nostru (Our Father)', tempo: 70, keys: ['C'], language: 'ro' },
  { title: 'Te-am chemat', tempo: 80, keys: ['F'], language: 'ro' },
  { title: 'The Blessing (Cântecul Binecuvântării)', tempo: 70, keys: ['A', 'G'], language: 'ro' },
  { title: 'Tie ma predau', tempo: null, keys: ['F'], language: 'ro' },
  { title: 'Ție-ți Dau Inima (Aceasta Mi-e Dorința) (This is my desire)', tempo: 76.85, keys: ['D', 'E'], language: 'ro' },
  { title: 'Toată Închinarea (Lumina Lumii)', tempo: 69, keys: ['C', 'D', 'Eb', 'F', 'G'], language: 'ro' },
  { title: 'Tu Domnești', tempo: 67, keys: ['C', 'E', 'Eb', 'F', 'F#'], language: 'ro' },
  { title: 'Tu Ești Credincios', tempo: 120, keys: ['C', 'D'], language: 'ro' },
  { title: 'Tu Îmi Dai Curaj (You Make Me Brave)', tempo: 69, keys: ['D'], language: 'ro' },
  { title: 'Unde', tempo: 64, keys: [], language: 'ro' },
  { title: 'Vrednic', tempo: 75, keys: ['D', 'F', 'G'], language: 'ro' },
  { title: 'Vrednic de Închinare (None Like You)', tempo: 76, keys: ['A', 'Bb', 'C', 'F'], language: 'ro' },
  { title: 'Way Maker', tempo: 68, keys: ['D', 'G'], language: 'en' },
  { title: 'Worthy (Vrednic Ești Doar Tu)', tempo: 67.5, keys: ['C', 'D'], language: 'ro' },
  { title: 'Zideste In Mine', tempo: null, keys: ['F'], language: 'ro' }
];

// ============================================
// INSERT SONGS
// ============================================

const insertSong = db.prepare(`
  INSERT OR IGNORE INTO songs (
    title,
    key_signature,
    tempo,
    tags,
    language,
    created_by
  )
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((songs) => {
  let inserted = 0;
  let skipped = 0;

  for (const song of songs) {
    // Primary key signature (first in array)
    const keySignature = song.keys.length > 0 ? song.keys[0] : null;

    // Create tags array with all available keys
    const tags = [];
    if (song.keys.length > 1) {
      tags.push(`alternate_keys:${song.keys.slice(1).join(',')}`);
    }

    const tagsJson = tags.length > 0 ? JSON.stringify(tags) : null;

    try {
      const result = insertSong.run(
        song.title,
        keySignature,
        song.tempo,
        tagsJson,
        song.language,
        adminUser.id
      );

      if (result.changes > 0) {
        inserted++;
        console.log(`✅ ${song.title}`);
      } else {
        skipped++;
        console.log(`⏭️  ${song.title} (already exists)`);
      }
    } catch (error) {
      console.error(`❌ Error inserting ${song.title}:`, error.message);
    }
  }

  return { inserted, skipped };
});

const result = insertMany(songs);

db.close();

console.log('\n🎉 Import completed!');
console.log('\n📊 Summary:');
console.log(`   ✅ Songs inserted: ${result.inserted}`);
console.log(`   ⏭️  Songs skipped (duplicates): ${result.skipped}`);
console.log(`   📝 Total songs processed: ${songs.length}`);
console.log('\n💡 Note: Songs are imported without scheduling dates');
console.log('   You can now add them to services manually through the app');
