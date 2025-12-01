/**
 * Clean Saturday votes (caused by timezone bug)
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.db');

console.log('🧹 Cleaning Saturday votes...');

const db = new Database(DB_PATH);

// Check which dates are Saturdays
const allVotes = db.prepare('SELECT DISTINCT date FROM monthly_availability ORDER BY date').all();

console.log('\nVerificare voturi:');
const saturdayDates = [];

allVotes.forEach(v => {
  const date = new Date(v.date + 'T12:00:00');
  const dayOfWeek = date.getDay();
  const dayName = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'][dayOfWeek];
  
  console.log(`  ${v.date} = ${dayName} (${dayOfWeek})`);
  
  if (dayOfWeek === 6) {
    saturdayDates.push(v.date);
  }
});

if (saturdayDates.length > 0) {
  console.log(`\n⚠️  Găsite ${saturdayDates.length} voturi pentru Sâmbătă (greșite!)`);
  console.log('Șterg...');
  
  const deleteSaturdays = db.prepare(`
    DELETE FROM monthly_availability 
    WHERE date IN (${saturdayDates.map(() => '?').join(',')})
  `);
  
  deleteSaturdays.run(...saturdayDates);
  
  console.log('✅ Voturi Sâmbătă șterse!');
} else {
  console.log('\n✅ Nu sunt voturi pentru Sâmbătă');
}

const remaining = db.prepare('SELECT COUNT(*) as count FROM monthly_availability').get();
console.log(`\nVoturi rămase: ${remaining.count}`);

db.close();

console.log('\n✅ Done! Acum revotează în Vote page cu timezone-ul reparat!');

