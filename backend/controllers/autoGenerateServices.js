const { getDatabase } = require('../config/database');
const { createNotification } = require('../utils/notifications');

/**
 * Auto-generate services COMPLET AUTOMAT
 * Generează TOATE serviciile până la sfârșitul anului 2026
 */
function autoGenerateServices() {
  const db = getDatabase();
  
  // Get admin user (creator)
  const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!admin) {
    console.error('Admin user not found');
    return [];
  }

  const today = new Date();
  const generated = [];
  
  // Generează de la luna curentă până la decembrie 2026
  const endDate = new Date(2026, 11, 31); // 31 decembrie 2026
  
  const monthsToGenerate = [];
  let currentYear = today.getFullYear();
  let currentMonth = today.getMonth();
  
  // Construiește lista de luni până la decembrie 2026
  while (currentYear < 2027) {
    monthsToGenerate.push({ year: currentYear, month: currentMonth });
    
    currentMonth++;
    if (currentMonth > 11) {
      currentMonth = 0;
      currentYear++;
    }
    
    // Oprește-te după decembrie 2026
    if (currentYear === 2026 && currentMonth > 11) break;
    if (currentYear > 2026) break;
  }
  
  console.log(`📅 Generez servicii pentru ${monthsToGenerate.length} luni (până la decembrie 2026)...`);
  
  for (const { year, month } of monthsToGenerate) {
    const actualYear = year;
    const actualMonth = month;
    const daysInMonth = new Date(actualYear, actualMonth + 1, 0).getDate();
    
    // Găsește toate duminicile și lunile din această lună
    for (let day = 1; day <= daysInMonth; day++) {
      const currentDate = new Date(actualYear, actualMonth, day, 12, 0, 0); // Set la 12:00 pentru a evita timezone issues
      const dayOfWeek = currentDate.getDay();
      
      // Skip zilele din trecut (doar pentru luna curentă)
      const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const currentMidnight = new Date(actualYear, actualMonth, day);
      if (currentMidnight < todayMidnight && actualMonth === today.getMonth()) continue;
      
      // Duminică (0) - Serviciu Biserică
      if (dayOfWeek === 0) {
        const sundayDate = `${actualYear}-${String(actualMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const existingSunday = db.prepare(
          'SELECT id FROM services WHERE date = ? AND service_type = ?'
        ).get(sundayDate, 'biserica_duminica');
        
        if (!existingSunday) {
          const result = db.prepare(`
            INSERT INTO services (title, service_type, date, time, location, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            'Serviciu Biserică',
            'biserica_duminica',
            sundayDate,
            '10:00',
            'Biserica Vertical',
            'draft',
            admin.id
          );
          
          const serviceId = result.lastInsertRowid;
          openVotingForService(db, serviceId, sundayDate, 'biserica', admin.id);
          generated.push({ type: 'biserică', date: sundayDate, id: serviceId });
        }
      }
      
      // Luni (1) - Tineret UNITED
      if (dayOfWeek === 1) {
        const mondayDate = `${actualYear}-${String(actualMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        const existingMonday = db.prepare(
          'SELECT id FROM services WHERE date = ? AND service_type = ?'
        ).get(mondayDate, 'tineret_luni');
        
        if (!existingMonday) {
          const result = db.prepare(`
            INSERT INTO services (title, service_type, date, time, location, status, created_by)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(
            'Tineret UNITED',
            'tineret_luni',
            mondayDate,
            '19:00',
            'Sala Tineret',
            'draft',
            admin.id
          );
          
          const serviceId = result.lastInsertRowid;
          openVotingForService(db, serviceId, mondayDate, 'tineret', admin.id);
          generated.push({ type: 'tineret', date: mondayDate, id: serviceId });
        }
      }
    }
  }
  
  console.log(`✅ Auto-generated ${generated.length} services (până la decembrie 2026)`);
  return generated;
}

/**
 * Deschide automat votarea pentru un serviciu
 */
function openVotingForService(db, serviceId, serviceDate, serviceType, adminId) {
  // Setează deadline: cu 3 zile înainte de serviciu
  const deadline = new Date(serviceDate);
  deadline.setDate(deadline.getDate() - 3);
  deadline.setHours(23, 59, 59);
  const deadlineStr = deadline.toISOString().replace('T', ' ').substring(0, 19);

  // Departamente per tip serviciu
  const roleTypes = serviceType === 'biserica' 
    ? ['trupa', 'sound', 'media', 'grupa_copii', 'bun_venit', 'cafea']
    : ['tineret', 'trupa', 'sound', 'media', 'bun_venit_tineret', 'cafea'];

  // Update service
  db.prepare(`
    UPDATE services
    SET voting_open = 1, voting_deadline = ?, status = 'voting_open'
    WHERE id = ?
  `).run(deadlineStr, serviceId);

  // Crează polls pentru fiecare rol
  const insertPoll = db.prepare(`
    INSERT INTO availability_polls (service_id, role_type, required_count, deadline)
    VALUES (?, ?, ?, ?)
  `);

  for (const roleType of roleTypes) {
    insertPoll.run(serviceId, roleType, 1, deadlineStr);
  }

  // Notifică toți userii cu aceste roluri
  const usersToNotify = db.prepare(`
    SELECT DISTINCT u.id, u.full_name
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name IN (${roleTypes.map(() => '?').join(',')})
    AND u.is_active = 1
  `).all(...roleTypes);

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(serviceId);

  for (const user of usersToNotify) {
    createNotification(db, {
      userId: user.id,
      type: 'voting_open',
      title: `Votare deschisă: ${service.title}`,
      message: `Votează disponibilitatea ta pentru ${service.title} (${service.date} ${service.time}). Deadline: ${deadline.toLocaleDateString('ro-RO')}`,
      actionUrl: `/planner/vote`,
      actionLabel: 'Votează acum'
    });
  }
}

/**
 * API endpoint pentru a triggera auto-generarea
 */
exports.generateServices = (req, res) => {
  try {
    const generated = autoGenerateServices();
    res.json({
      message: 'Services generated successfully',
      count: generated.length,
      services: generated
    });
  } catch (error) {
    console.error('Error generating services:', error);
    res.status(500).json({ error: 'Failed to generate services' });
  }
};

/**
 * Run on server start
 */
exports.autoGenerateOnStartup = () => {
  console.log('🔄 Auto-generating services...');
  const generated = autoGenerateServices();
  console.log(`✅ Generated ${generated.length} new services`);
};

module.exports = {
  autoGenerateServices,
  generateServices: exports.generateServices,
  autoGenerateOnStartup: exports.autoGenerateOnStartup
};

