const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const { getDatabase } = require('../config/database');

// Email configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'blueprintstudioworks@gmail.com',
    pass: 'syue jmqe kuqn qmwb'
  }
});

/**
 * Generate a random temporary password
 */
function generateTempPassword(username) {
  // Create a simple but secure temporary password based on username
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${username}${randomNum}!`;
}

/**
 * Send credentials email to selected users
 */
exports.sendCredentials = async (req, res) => {
  const { userIds } = req.body;

  // Check if user is superadmin
  if (!req.user.roles || !req.user.roles.includes('admin_global')) {
    return res.status(403).json({ error: 'Only superadmin can send credentials' });
  }

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'User IDs required' });
  }

  const db = getDatabase();

  // Get users info (we can't get plaintext passwords, so we'll inform them to reset)
  const placeholders = userIds.map(() => '?').join(',');
  const users = db.prepare(`
    SELECT id, username, email, full_name
    FROM users
    WHERE id IN (${placeholders})
  `).all(...userIds);

  if (users.length === 0) {
    return res.status(404).json({ error: 'No users found' });
  }

  const results = {
    success: [],
    failed: []
  };

  for (const user of users) {
    try {
      // Generate a new temporary password
      const tempPassword = generateTempPassword(user.username);
      const hashedPassword = bcrypt.hashSync(tempPassword, 10);
      
      // Update user with new temporary password and force password change
      db.prepare('UPDATE users SET password_hash = ?, force_password_change = 1 WHERE id = ?')
        .run(hashedPassword, user.id);

      const mailOptions = {
        from: '"Biserica Vertical" <blueprintstudioworks@gmail.com>',
        to: user.email,
        subject: 'Biserica Vertical - Credențiale Planning Center',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #000;">Biserica Vertical - Planning Center</h2>
            <p>Bună <strong>${user.full_name || user.username}</strong>,</p>
            <p>Contul tău pentru Planning Center a fost creat/actualizat.</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Username:</strong> ${user.username}</p>
              <p style="margin: 5px 0;"><strong>Parolă:</strong> ${tempPassword}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${user.email}</p>
              <p style="margin: 5px 0;"><strong>Link:</strong> <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/planner/login">Planning Center Login</a></p>
            </div>

            <p><strong>Important:</strong> La prima autentificare, vei fi rugat să îți schimbi parola.</p>
            <p style="color: #ff5722;"><strong>⚠️ Parola de mai sus este temporară și trebuie schimbată la prima autentificare.</strong></p>
            
            <p>Dacă ai nevoie de ajutor, contactează administratorul.</p>
            
            <br>
            <p style="color: #666; font-size: 12px;">
              Acest email a fost trimis automat de Planning Center - Biserica Vertical
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      results.success.push({ userId: user.id, email: user.email, tempPassword: tempPassword });
      console.info(`[EMAIL] Credentials sent to ${user.email} with temp password at ${new Date().toISOString()}`);
    } catch (error) {
      console.error(`[EMAIL] Failed to send to ${user.email}:`, error.message);
      results.failed.push({ userId: user.id, email: user.email, error: error.message });
    }
  }

  res.json({
    message: `Emails sent: ${results.success.length} success, ${results.failed.length} failed`,
    results
  });
};

/**
 * Get all users for selection (superadmin only)
 */
exports.getUsersForEmail = (req, res) => {
  // Check if user is superadmin
  if (!req.user.roles || !req.user.roles.includes('admin_global')) {
    return res.status(403).json({ error: 'Only superadmin can access this' });
  }

  const db = getDatabase();
  
  const users = db.prepare(`
    SELECT id, username, full_name, email, is_active
    FROM users
    ORDER BY username
  `).all();

  res.json({ users });
};

/**
 * Send reminder email to vote for availability
 */
exports.sendVoteReminder = async (req, res) => {
  const { userIds } = req.body;

  // Check if user is superadmin
  if (!req.user.roles || !req.user.roles.includes('admin_global')) {
    return res.status(403).json({ error: 'Only superadmin can send reminders' });
  }

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ error: 'User IDs required' });
  }

  const db = getDatabase();

  // Get users info
  const placeholders = userIds.map(() => '?').join(',');
  const users = db.prepare(`
    SELECT id, username, email, full_name
    FROM users
    WHERE id IN (${placeholders})
  `).all(...userIds);

  if (users.length === 0) {
    return res.status(404).json({ error: 'No users found' });
  }

  // Get current month info
  const now = new Date();
  const monthName = now.toLocaleDateString('ro-RO', { month: 'long', year: 'numeric' });

  const results = {
    success: [],
    failed: []
  };

  for (const user of users) {
    try {
      const mailOptions = {
        from: '"Biserica Vertical" <blueprintstudioworks@gmail.com>',
        to: user.email,
        subject: `📅 Reminder: Votează disponibilitatea pentru ${monthName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4CAF50;">Biserica Vertical - Planning Center</h2>
            <p>Bună <strong>${user.full_name || user.username}</strong>,</p>
            <p>Acesta este un reminder să îți marchezi disponibilitatea pentru <strong>${monthName}</strong>.</p>
            
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>📅 Luna:</strong> ${monthName}</p>
              <p style="margin: 5px 0;"><strong>📍 Zile relevante:</strong> Duminici (10:00) și Luni (19:00)</p>
            </div>

            <p><strong>De ce este important?</strong></p>
            <ul style="line-height: 1.8;">
              <li>Adminii planifică serviciile în funcție de disponibilitatea ta</li>
              <li>Votând la timp, evitați suprapunerile și conflictele</li>
              <li>Durează doar 2 minute să marchezi zilele când ești disponibil</li>
            </ul>

            <p style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5174'}/planner/vote" 
                 style="display: inline-block; padding: 14px 32px; background: #4CAF50; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                📅 Votează Acum
              </a>
            </p>
            
            <p>Mulțumim pentru răspuns prompt!</p>
            
            <br>
            <p style="color: #666; font-size: 12px;">
              Acest email a fost trimis automat de Planning Center - Biserica Vertical
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      results.success.push({ userId: user.id, email: user.email });
      console.info(`[EMAIL] Reminder sent to ${user.email} at ${new Date().toISOString()}`);
    } catch (error) {
      console.error(`[EMAIL] Failed to send reminder to ${user.email}:`, error.message);
      results.failed.push({ userId: user.id, email: user.email, error: error.message });
    }
  }

  res.json({
    message: `Reminders sent: ${results.success.length} success, ${results.failed.length} failed`,
    results
  });
};

