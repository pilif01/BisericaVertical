const { getDatabase } = require('../config/database');

/**
 * Auto-generate services for next 3 months if needed
 */
function autoGenerateServices() {
  const db = getDatabase();
  
  try {
    // Check last service date
    const lastService = db.prepare(`
      SELECT MAX(date) as last_date FROM services
    `).get();
    
    const today = new Date();
    const lastDate = lastService?.last_date ? new Date(lastService.last_date) : today;
    
    // Calculate how many weeks ahead we have services
    const weeksDiff = Math.floor((lastDate - today) / (7 * 24 * 60 * 60 * 1000));
    
    console.log(`📅 Last service date: ${lastDate.toISOString().split('T')[0]}`);
    console.log(`📊 Services scheduled for next ${weeksDiff} weeks`);
    
    // If we have less than 4 weeks of services, generate more
    if (weeksDiff < 4) {
      console.log('⚠️  Low on services! Generating more...');
      
      // Get admin user (Filip)
      const admin = db.prepare('SELECT id FROM users WHERE username = ?').get('Filip');
      if (!admin) {
        console.error('❌ Admin user (Filip) not found!');
        return;
      }
      
      // Generate services for next 3 months from last date
      const startDate = new Date(lastDate);
      startDate.setDate(startDate.getDate() + 7); // Start from next week after last service
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 3);
      
      const insertService = db.prepare(`
        INSERT INTO services (title, service_type, date, time, location, status, created_by, created_at)
        VALUES (?, ?, ?, ?, ?, 'draft', ?, CURRENT_TIMESTAMP)
      `);
      
      let current = new Date(startDate);
      let count = 0;
      
      while (current <= endDate) {
        const dayOfWeek = current.getDay();
        
        // Sunday (0) at 10:00
        if (dayOfWeek === 0) {
          insertService.run(
            'Serviciu Biserică',
            'biserica_duminica',
            current.toISOString().split('T')[0],
            '10:00',
            'Biserica Vertical',
            admin.id
          );
          count++;
        }
        
        // Monday (1) at 19:00
        if (dayOfWeek === 1) {
          insertService.run(
            'Tineret UNITED',
            'tineret_luni',
            current.toISOString().split('T')[0],
            '19:00',
            'Sala Tineret',
            admin.id
          );
          count++;
        }
        
        current.setDate(current.getDate() + 1);
      }
      
      console.log(`✅ Generated ${count} new services!`);
      return count;
    } else {
      console.log('✅ Enough services scheduled. No need to generate more.');
      return 0;
    }
  } catch (error) {
    console.error('❌ Error auto-generating services:', error);
    return 0;
  }
}

/**
 * Schedule auto-generation check (runs daily at 3 AM)
 */
function scheduleAutoGeneration() {
  const checkInterval = 24 * 60 * 60 * 1000; // 24 hours
  
  setInterval(() => {
    console.log('\n⏰ Running scheduled service auto-generation check...');
    autoGenerateServices();
  }, checkInterval);
  
  console.log('⏰ Auto-generation scheduled to run every 24 hours');
}

module.exports = {
  autoGenerateServices,
  scheduleAutoGeneration
};

