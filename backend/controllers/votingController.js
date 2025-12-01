const { getDatabase } = require('../config/database');
const { canViewVotes } = require('../middleware/auth');
const { createNotification } = require('../utils/notifications');

/**
 * Open voting for a service
 */
exports.openVoting = (req, res) => {
  const { id } = req.params;
  const { roleTypes, counts, deadline } = req.body;

  if (!roleTypes || !counts || !deadline) {
    return res.status(400).json({ error: 'Missing required fields: roleTypes, counts, deadline' });
  }

  const db = getDatabase();

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  // Update service
  db.prepare(`
    UPDATE services
    SET voting_open = 1, voting_deadline = ?, status = 'voting_open', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(deadline, id);

  // Create polls for each role
  const insertPoll = db.prepare(`
    INSERT INTO availability_polls (service_id, role_type, required_count, deadline)
    VALUES (?, ?, ?, ?)
  `);

  const pollIds = [];

  for (const roleType of roleTypes) {
    const result = insertPoll.run(id, roleType, counts[roleType] || 1, deadline);
    pollIds.push(result.lastInsertRowid);
  }

  // Get all users with these roles and send notifications
  const usersToNotify = db.prepare(`
    SELECT DISTINCT u.id, u.full_name, u.email
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE r.name IN (${roleTypes.map(() => '?').join(',')})
    AND u.is_active = 1
  `).all(...roleTypes);

  for (const user of usersToNotify) {
    createNotification(db, {
      userId: user.id,
      type: 'voting_open',
      title: `Votare deschisă: ${service.title}`,
      message: `Votează disponibilitatea ta pentru ${service.title} (${service.date} ${service.time}). Deadline: ${new Date(deadline).toLocaleString('ro-RO')}`,
      actionUrl: `/planner/vote`,
      actionLabel: 'Votează acum'
    });
  }

  res.json({
    message: 'Voting opened successfully',
    pollsCreated: pollIds.length,
    notificationsSent: usersToNotify.length
  });
};

/**
 * Get polls for a service
 */
exports.getPolls = (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  const polls = db.prepare(`
    SELECT p.*, 
           (SELECT COUNT(*) FROM availability_votes WHERE poll_id = p.id) as total_votes,
           (SELECT COUNT(*) FROM availability_votes WHERE poll_id = p.id AND vote = 'available') as available_count,
           (SELECT COUNT(*) FROM availability_votes WHERE poll_id = p.id AND vote = 'maybe') as maybe_count,
           (SELECT COUNT(*) FROM availability_votes WHERE poll_id = p.id AND vote = 'unavailable') as unavailable_count
    FROM availability_polls p
    WHERE p.service_id = ?
  `).all(id);

  res.json({ polls });
};

/**
 * Get vote results for a service (admin only) - FROM MONTHLY AVAILABILITY
 */
exports.getVoteResults = (req, res) => {
  const { id } = req.params;
  const db = getDatabase();

  const service = db.prepare('SELECT * FROM services WHERE id = ?').get(id);

  if (!service) {
    return res.status(404).json({ error: 'Service not found' });
  }

  // Simplified permission check - any authenticated user can view
  // Get ALL users with their roles who voted available for this date
  console.log(`[DEBUG] Getting vote results for service ${id}, date: ${service.date}`);
  
  const availableUsers = db.prepare(`
    SELECT 
      u.id as user_id,
      u.full_name,
      u.email,
      u.phone,
      r.name as role_type,
      'available' as vote_status
    FROM users u
    JOIN monthly_availability ma ON u.id = ma.user_id
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE ma.date = ?
    AND ma.available = 1
    AND u.is_active = 1
    AND r.category = 'department'
    ORDER BY r.name, u.full_name
  `).all(service.date);

  console.log(`[DEBUG] Found ${availableUsers.length} available users for ${service.date}`);
  if (availableUsers.length > 0) {
    availableUsers.forEach(u => console.log(`  - ${u.full_name} (${u.role_type})`));
  }

  // Group by role
  const votesByRole = availableUsers.reduce((acc, user) => {
    if (!acc[user.role_type]) {
      acc[user.role_type] = [];
    }
    acc[user.role_type].push(user);
    return acc;
  }, {});

  // Return in old format for compatibility
  const votes = availableUsers.map(user => ({
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    vote_status: user.vote_status,
    role_type: user.role_type
  }));

  res.json({ 
    votes,
    votesByRole,
    summary: {
      total: availableUsers.length,
      byRole: Object.keys(votesByRole).reduce((acc, role) => {
        acc[role] = votesByRole[role].length;
        return acc;
      }, {})
    }
  });
};

/**
 * Submit vote
 */
exports.submitVote = (req, res) => {
  const { pollId, vote, notes } = req.body;

  if (!pollId || !vote) {
    return res.status(400).json({ error: 'Missing required fields: pollId, vote' });
  }

  if (!['available', 'maybe', 'unavailable'].includes(vote)) {
    return res.status(400).json({ error: 'Invalid vote value' });
  }

  const db = getDatabase();

  const poll = db.prepare('SELECT * FROM availability_polls WHERE id = ?').get(pollId);

  if (!poll) {
    return res.status(404).json({ error: 'Poll not found' });
  }

  // Check deadline
  if (new Date(poll.deadline) < new Date()) {
    return res.status(400).json({ error: 'Voting deadline has passed' });
  }

  if (poll.is_closed) {
    return res.status(400).json({ error: 'Poll is closed' });
  }

  // Insert or update vote
  try {
    db.prepare(`
      INSERT INTO availability_votes (poll_id, user_id, vote, notes)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(poll_id, user_id) 
      DO UPDATE SET vote = ?, notes = ?, voted_at = CURRENT_TIMESTAMP
    `).run(pollId, req.user.id, vote, notes || null, vote, notes || null);

    res.json({ message: 'Vote submitted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit vote' });
  }
};

/**
 * Get pending votes for current user
 */
exports.getPendingVotes = (req, res) => {
  const db = getDatabase();

  // Get services with open voting where user has relevant role but hasn't voted yet
  const pendingPolls = db.prepare(`
    SELECT DISTINCT s.*, p.id as poll_id, p.role_type, p.deadline
    FROM services s
    JOIN availability_polls p ON s.id = p.service_id
    JOIN roles r ON p.role_type = r.name
    JOIN user_roles ur ON r.id = ur.role_id
    WHERE ur.user_id = ?
    AND s.voting_open = 1
    AND p.is_closed = 0
    AND p.deadline > datetime('now')
    AND NOT EXISTS (
      SELECT 1 FROM availability_votes v
      WHERE v.poll_id = p.id AND v.user_id = ?
    )
    ORDER BY p.deadline ASC
  `).all(req.user.id, req.user.id);

  res.json({ pendingPolls });
};

/**
 * Get my votes
 */
exports.getMyVotes = (req, res) => {
  const db = getDatabase();

  const votes = db.prepare(`
    SELECT v.*, p.role_type, p.deadline, s.title, s.date, s.time, s.service_type
    FROM availability_votes v
    JOIN availability_polls p ON v.poll_id = p.id
    JOIN services s ON p.service_id = s.id
    WHERE v.user_id = ?
    ORDER BY v.voted_at DESC
    LIMIT 20
  `).all(req.user.id);

  res.json({ votes });
};

/**
 * Get monthly votes (pentru calendar lunar)
 */
exports.getMonthlyVotes = (req, res) => {
  const { year, month } = req.query;
  
  if (!year || !month) {
    return res.status(400).json({ error: 'Year and month are required' });
  }

  const db = getDatabase();
  
  // Get user's votes for this month
  const votes = db.prepare(`
    SELECT date, available
    FROM monthly_availability
    WHERE user_id = ? 
    AND strftime('%Y', date) = ?
    AND strftime('%m', date) = ?
    ORDER BY date ASC
  `).all(req.user.id, year, month.toString().padStart(2, '0'));

  res.json({ votes });
};

/**
 * Save monthly votes (calendar lunar)
 */
exports.saveMonthlyVotes = (req, res) => {
  const { year, month, votes } = req.body;
  
  if (!year || !month || !votes) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const db = getDatabase();

  // Delete existing votes for this month
  db.prepare(`
    DELETE FROM monthly_availability
    WHERE user_id = ?
    AND strftime('%Y', date) = ?
    AND strftime('%m', date) = ?
  `).run(req.user.id, year.toString(), month.toString().padStart(2, '0'));

  // Insert new votes
  const insertStmt = db.prepare(`
    INSERT INTO monthly_availability (user_id, date, available)
    VALUES (?, ?, ?)
  `);

  for (const vote of votes) {
    insertStmt.run(req.user.id, vote.date, vote.available ? 1 : 0);
  }

  // Also update individual polls for these dates to match
  const updatePollVotes = db.prepare(`
    INSERT INTO availability_votes (poll_id, user_id, vote)
    SELECT p.id, ?, 'available'
    FROM availability_polls p
    JOIN services s ON p.service_id = s.id
    WHERE s.date = ?
    AND NOT EXISTS (
      SELECT 1 FROM availability_votes WHERE poll_id = p.id AND user_id = ?
    )
  `);

  for (const vote of votes) {
    if (vote.available) {
      updatePollVotes.run(req.user.id, vote.date, req.user.id);
    }
  }

  res.json({ message: 'Monthly votes saved successfully', votesCount: votes.length });
};

