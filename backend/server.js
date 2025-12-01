require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 3000;

const defaultAllowedOrigins = (process.env.CORS_ORIGIN && process.env.CORS_ORIGIN.length > 0)
  ? process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()).filter(Boolean)
  : ['http://localhost:5173', 'http://localhost:5174'];
const frameAncestors = ["'self'", ...defaultAllowedOrigins];

// Security: Helmet - Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      frameSrc: ["'self'", ...defaultAllowedOrigins],
      frameAncestors
    },
  },
  crossOriginResourcePolicy: {
    policy: 'cross-origin'
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  frameguard: false
}));

// Security: HTTPS Redirect in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}

// Middleware: CORS with strict origin
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/uploads/songs', express.static(path.join(__dirname, 'uploads', 'songs')));

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/services'));
app.use('/api', require('./routes/voting'));
app.use('/api', require('./routes/serviceItems'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/songs', require('./routes/songs'));
app.use('/api/song-files', require('./routes/songFiles'));
app.use('/api', require('./routes/files'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/users', require('./routes/users'));
app.use('/api/email', require('./routes/email'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Auto-generate services on startup
const { autoGenerateOnStartup } = require('./controllers/autoGenerateServices');
const { scheduleDailyTasks } = require('./cron/dailyTasks');
const { autoGenerateServices, scheduleAutoGeneration } = require('./utils/autoGenerateServices');

// Start server
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Planning Center Backend');
  console.log('==========================');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔐 JWT Secret: ${process.env.JWT_SECRET ? 'Configured' : 'NOT SET!'}`);
  console.log('');
  
  // Auto-generate services
  autoGenerateOnStartup();
  
  // Schedule daily tasks for auto-generation
  scheduleDailyTasks();
  
  // Check and auto-generate services if needed
  console.log('');
  console.log('📅 Checking service schedule...');
  autoGenerateServices();
  
  // Schedule periodic auto-generation
  scheduleAutoGeneration();
  
  console.log('');
  console.log('📡 Available endpoints:');
  console.log('   POST   /api/auth/login');
  console.log('   GET    /api/auth/me');
  console.log('   GET    /api/services');
  console.log('   POST   /api/votes');
  console.log('   GET    /api/notifications');
  console.log('');
  console.log(`🔗 API Documentation: http://localhost:${PORT}/api/health`);
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down gracefully...');
  const { closeDatabase } = require('./config/database');
  closeDatabase();
  process.exit(0);
});

module.exports = app;
