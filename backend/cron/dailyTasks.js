const { autoGenerateServices } = require('../controllers/autoGenerateServices');
const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'blueprintstudioworks@gmail.com',
    pass: 'syue jmqe kuqn qmwb'
  }
});

/**
 * Trimite reminder lunar pentru votarea disponibilității (ultima zi din lună)
 */
function sendMonthlyVotingReminders() {
  const { getDatabase } = require('../config/database');
  const db = getDatabase();
  
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Verifică dacă mâine începe o lună nouă (adică astăzi e ultima zi din lună)
  if (tomorrow.getDate() !== 1) {
    console.log('ℹ️  Nu suntem în ultima zi a lunii, nu trimitem reminder-uri de votare');
    return;
  }
  
  // Numele lunii următoare în română
  const nextMonth = tomorrow.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });
  
  console.log(`\n📅 Ultima zi din lună! Trimitem reminder-uri pentru votarea disponibilității pe ${nextMonth}...`);
  
  // Găsește toți utilizatorii activi cu email
  const users = db.prepare(`
    SELECT id, full_name, email
    FROM users
    WHERE is_active = 1
      AND email IS NOT NULL
      AND email != ''
  `).all();
  
  console.log(`   Found ${users.length} active users with email`);
  
  users.forEach(user => {
    const mailOptions = {
      from: '"Biserica Vertical" <blueprintstudioworks@gmail.com>',
      to: user.email,
      subject: `📅 Votează disponibilitatea pentru ${nextMonth}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Biserica Vertical - Reminder Lunar</h2>
          <p>Bună <strong>${user.full_name}</strong>,</p>
          <p>Începe <strong>${nextMonth}</strong> și avem nevoie de disponibilitatea ta!</p>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center;">
            <h3 style="margin: 0 0 15px 0; color: #fff; font-size: 24px;">📅 Votează Disponibilitatea</h3>
            <p style="margin: 0 0 20px 0; color: rgba(255,255,255,0.9); font-size: 16px;">
              Hai să planificăm împreună serviciile pentru luna următoare!
            </p>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/planner/vote" style="display: inline-block; padding: 14px 32px; background: #fff; color: #667eea; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
              Votează Acum 🗳️
            </a>
          </div>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #000;">De ce e important?</h4>
            <ul style="margin: 0; padding-left: 20px; color: #666;">
              <li>Ajuți echipa să planifice serviciile</li>
              <li>Primești notificări doar pentru zilele când ești disponibil</li>
              <li>Evităm să te programăm când nu poți veni</li>
            </ul>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Durează doar 2 minute! 💚
          </p>
          
          <br>
          <p style="color: #666; font-size: 12px;">
            Acest email a fost trimis automat de Planning Center - Biserica Vertical
          </p>
        </div>
      `
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(`   ❌ Failed to send monthly reminder to ${user.email}:`, error);
      } else {
        console.log(`   ✅ Monthly reminder sent to ${user.full_name} (${user.email})`);
      }
    });
  });
}

/**
 * Trimite reminder-uri email pentru assignments EXACT cu 3 zile înainte
 */
function sendServiceReminders() {
  const { getDatabase } = require('../config/database');
  const db = getDatabase();
  
  // Calculează data exactă cu 3 zile în viitor
  const now = new Date();
  const in3Days = new Date(now);
  in3Days.setDate(in3Days.getDate() + 3);
  
  const in3DaysStr = in3Days.toISOString().split('T')[0];
  
  console.log(`\n📧 Checking reminders for services on ${in3DaysStr} (exactly 3 days away)...`);
  
  // Găsește toate assignments pentru servicii EXACT cu 3 zile înainte
  // care nu au primit reminder încă
  const assignments = db.prepare(`
    SELECT 
      a.id, a.role_detail, a.status,
      s.id as service_id, s.title, s.date, s.time, s.location,
      u.id as user_id, u.full_name, u.email
    FROM assignments a
    JOIN services s ON a.service_id = s.id
    JOIN users u ON a.user_id = u.id
    WHERE s.date = ?
      AND a.reminder_sent = 0
      AND u.email IS NOT NULL
      AND u.email != ''
    ORDER BY s.time
  `).all(in3DaysStr);
  
  console.log(`   Found ${assignments.length} assignments needing reminders`);
  
  assignments.forEach(assignment => {
    const serviceDate = new Date(assignment.date + 'T12:00:00');
    const dateStr = serviceDate.toLocaleDateString('ro-RO', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    const statusText = assignment.status === 'confirmed' 
      ? 'ai confirmat participarea' 
      : 'NU ai confirmat participarea încă';
    
    const statusColor = assignment.status === 'confirmed' ? '#4CAF50' : '#FF9800';
    const statusEmoji = assignment.status === 'confirmed' ? '✅' : '⚠️';
    
    const mailOptions = {
      from: '"Biserica Vertical" <blueprintstudioworks@gmail.com>',
      to: assignment.email,
      subject: `${statusEmoji} Reminder - ${assignment.title} în 3 zile`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Biserica Vertical - Reminder</h2>
          <p>Bună <strong>${assignment.full_name}</strong>,</p>
          <p>Acesta este un reminder pentru serviciul la care ești programat:</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 12px 0; color: #000;">${assignment.title}</h3>
            <p style="margin: 5px 0;"><strong>📅 Data:</strong> ${dateStr}</p>
            <p style="margin: 5px 0;"><strong>🕐 Ora:</strong> ${assignment.time}</p>
            <p style="margin: 5px 0;"><strong>📍 Locație:</strong> ${assignment.location || 'Biserica Vertical'}</p>
            <p style="margin: 5px 0;"><strong>🎭 Rol:</strong> ${assignment.role_detail}</p>
            <p style="margin: 15px 0 5px 0; padding-top: 15px; border-top: 2px solid ${statusColor};">
              <strong>Status:</strong> <span style="color: ${statusColor};">${statusEmoji} ${statusText}</span>
            </p>
          </div>

          ${assignment.status !== 'confirmed' ? `
          <p style="color: #FF9800; font-weight: bold;">⚠️ Te rugăm să confirmi participarea cât mai curând!</p>
          <p><a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/planner/schedule" style="display: inline-block; padding: 12px 24px; background: #FF9800; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold;">Confirmă Participarea</a></p>
          ` : `
          <p style="color: #4CAF50; font-weight: bold;">✅ Mulțumim că ai confirmat!</p>
          `}
          
          <p>Ne vedem acolo!</p>
          
          <br>
          <p style="color: #666; font-size: 12px;">
            Acest email a fost trimis automat de Planning Center - Biserica Vertical
          </p>
        </div>
      `
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error(`   ❌ Failed to send reminder to ${assignment.email}:`, error);
      } else {
        console.log(`   ✅ Reminder sent to ${assignment.full_name} (${assignment.email})`);
        
        // Marchează reminder-ul ca trimis
        db.prepare(`
          UPDATE assignments 
          SET reminder_sent = 1, reminder_sent_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(assignment.id);
      }
    });
  });
}

/**
 * Verifică zilnic starea serviciilor
 * Rulează în fiecare zi la ora 00:00
 * 
 * Notă: Toate serviciile sunt deja generate până la sfârșitul anului 2026
 * Acest task doar verifică integritatea și trimite remindere
 */
function runDailyTasks() {
  const now = new Date();
  
  console.log(`\n🔄 Daily Tasks - ${now.toLocaleDateString('ro-RO')}`);
  
  // Verifică dacă avem servicii generate până la sfârșitul anului 2026
  const { getDatabase } = require('../config/database');
  const db = getDatabase();
  
  const lastService = db.prepare(`
    SELECT MAX(date) as last_date 
    FROM services 
    WHERE service_type IN ('biserica_duminica', 'tineret_luni')
  `).get();
  
  if (!lastService || !lastService.last_date) {
    console.log('⚠️  Niciun serviciu găsit! Regenerez...');
    autoGenerateServices();
  } else {
    const lastDate = new Date(lastService.last_date);
    const endOf2026 = new Date(2026, 11, 31);
    
    if (lastDate < endOf2026) {
      console.log('⚠️  Serviciile nu acoperă până la sfârșitul anului 2026! Regenerez...');
      autoGenerateServices();
    } else {
      console.log(`✅ Serviciile acoperă până la ${lastService.last_date}`);
      console.log('ℹ️  Toate serviciile sunt generate corect');
    }
  }
  
  // Trimite reminder-uri pentru servicii în următoarele 3 zile
  sendServiceReminders();
  
  // Trimite reminder-uri lunare pentru votare (ultima zi din lună)
  sendMonthlyVotingReminders();
}

/**
 * Setează intervalul pentru daily tasks (rulează la miezul nopții)
 */
function scheduleDailyTasks() {
  // Calculează timpul până la miezul nopții
  const now = new Date();
  const night = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1, // mâine
    0, 0, 0 // 00:00:00
  );
  const msUntilMidnight = night.getTime() - now.getTime();
  
  // Rulează prima dată la miezul nopții
  setTimeout(() => {
    runDailyTasks();
    
    // Apoi rulează în fiecare zi la miezul nopții
    setInterval(runDailyTasks, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
  
  console.log(`⏰ Daily tasks scheduled pentru ${night.toLocaleString('ro-RO')}`);
}

module.exports = { runDailyTasks, scheduleDailyTasks };

