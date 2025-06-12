const express = require('express');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const session = require('express-session');
const path = require('path');
const puppeteer = require('puppeteer');

// Load environment variables
require('dotenv').config();

// MongoDB imports
const { connectDB } = require('./config/database');
const DatabaseService = require('./services/databaseService');

const app = express();

// Connect to MongoDB
connectDB().catch(err => {
  console.error('Failed to connect to MongoDB:', err);
  process.exit(1);
});

// Color mapping for tournament types
const tournamentTypes = {
  local: { color: 'green', label: 'Local' },
  state: { color: 'red', label: 'State' },
  national: { color: 'blue', label: 'National' },
  sarawak: { color: 'purple', label: 'Miscellaneous Pickleball Events in Sarawak' },
  wmalaysia: { color: 'orange', label: 'Miscellaneous Events in W. Malaysia' }
};

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'pickleball_secret_change_in_production',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: parseInt(process.env.SESSION_TIMEOUT) || 7200000 // 2 hours
  }
}));

// Enhanced admin authentication middleware
const adminAuth = async (req, res, next) => {
  if (!req.session.isAuthenticated || !req.session.adminId) {
    return res.redirect('/login');
  }
  
  try {
    const admin = await DatabaseService.getAdminByUsername(req.session.username);
    if (!admin || !admin.isActive) {
      req.session.destroy(() => {
        res.redirect('/login?reason=unauthorized');
      });
      return;
    }
    
    const now = Date.now();
    const loginTime = req.session.loginTime || 0;
    const sessionTimeout = 7200000; // 2 hours
    
    if (now - loginTime > sessionTimeout) {
      req.session.destroy(() => {
        res.redirect('/login?reason=timeout');
      });
      return;
    }
    
    if (req.session.userAgent && req.session.userAgent !== req.get('User-Agent')) {
      console.warn(`Session hijacking attempt detected - IP: ${req.ip}`);
      req.session.destroy(() => {
        res.redirect('/login?reason=security');
      });
      return;
    }
    
    req.session.lastActivity = now;
    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    req.session.destroy(() => {
      res.redirect('/login?reason=error');
    });
  }
};

// Routes
app.get('/', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    const popupMessage = await DatabaseService.getSetting('popup_message', '');
    
    res.render('pages/home', { 
      session: req.session, 
      backgroundImage,
      popupMessage: {
        active: !!popupMessage,
        title: 'Announcement',
        content: popupMessage,
        image: null
      }
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.render('pages/home', { 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png',
      popupMessage: { active: false, title: '', content: '', image: null }
    });
  }
});

app.get('/tournament', async (req, res) => {
  try {
    const tournaments = await DatabaseService.getAllTournaments();
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    
    const formattedTournaments = tournaments.map(t => ({
      ...t.toObject(),
      color: tournamentTypes[t.type]?.color || 'green'
    }));
    
    res.render('pages/tournament', { 
      tournaments: formattedTournaments, 
      session: req.session, 
      backgroundImage 
    });
  } catch (error) {
    console.error('Tournament page error:', error);
    res.render('pages/tournament', { 
      tournaments: [], 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png'
    });
  }
});

// Login Routes
app.get('/login', (req, res) => {
  let error = null;
  const reason = req.query.reason;
  
  if (reason === 'timeout') {
    error = 'Your session has expired. Please login again.';
  } else if (reason === 'security') {
    error = 'Security violation detected. Please login again.';
  } else if (reason === 'unauthorized') {
    error = 'You must be logged in to access that page.';
  }
  
  res.render('pages/login', { error, session: req.session });
});

const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const attempts = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
  
  if (now - attempts.lastAttempt > LOCKOUT_DURATION) {
    attempts.count = 0;
  }
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    const timeRemaining = LOCKOUT_DURATION - (now - attempts.lastAttempt);
    if (timeRemaining > 0) {
      return res.status(429).render('pages/login', { 
        error: `Too many failed attempts. Try again in ${Math.ceil(timeRemaining / 60000)} minutes.`,
        session: req.session 
      });
    }
  }
  
  req.clientIP = clientIP;
  next();
}

app.post('/login', checkRateLimit, [
  body('username').notEmpty().trim().isLength({ min: 3, max: 30 }),
  body('password').notEmpty().isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const clientIP = req.clientIP;
    const attempts = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    loginAttempts.set(clientIP, attempts);
    
    return res.render('pages/login', { error: 'Invalid input', session: req.session });
  }
  
  const { username, password } = req.body;
  
  try {
    const admin = await DatabaseService.getAdminByUsername(username);
    
    if (!admin) {
      const clientIP = req.clientIP;
      const attempts = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
      attempts.count++;
      attempts.lastAttempt = Date.now();
      loginAttempts.set(clientIP, attempts);
      
      return res.render('pages/login', { error: 'Invalid username or password', session: req.session });
    }
    
    if (admin.isLocked()) {
      return res.render('pages/login', { 
        error: 'Account is temporarily locked. Please try again later.',
        session: req.session 
      });
    }
    
    const isValidPassword = await admin.comparePassword(password);
    
    if (!isValidPassword) {
      await admin.incLoginAttempts();
      
      const clientIP = req.clientIP;
      const attempts = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
      attempts.count++;
      attempts.lastAttempt = Date.now();
      loginAttempts.set(clientIP, attempts);
      
      return res.render('pages/login', { error: 'Invalid username or password', session: req.session });
    }
    
    // Success
    loginAttempts.delete(req.clientIP);
    await admin.resetLoginAttempts();
    await DatabaseService.updateAdminLastLogin(admin._id);
    
    req.session.regenerate((err) => {
      if (err) {
        return res.render('pages/login', { error: 'Authentication error', session: req.session });
      }
      
      req.session.isAuthenticated = true;
      req.session.adminId = admin._id;
      req.session.username = admin.username;
      req.session.loginTime = Date.now();
      req.session.userAgent = req.get('User-Agent');
      req.session.ipAddress = req.clientIP;
      
      res.redirect('/admin/dashboard');
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.render('pages/login', { error: 'An error occurred during login', session: req.session });
  }
});

// Admin Routes
app.get('/admin/dashboard', adminAuth, async (req, res) => {
  try {
    const stats = await DatabaseService.getStatistics();
    const pendingRegistrations = await DatabaseService.getPendingPlayerRegistrations();
    
    res.render('pages/admin/dashboard', { 
      pendingRegistrations, 
      users: [], // Legacy compatibility
      session: req.session,
      stats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('pages/admin/dashboard', { 
      pendingRegistrations: [], 
      users: [], 
      session: req.session,
      stats: { totalPlayers: 0, activePlayers: 0, totalTournaments: 0, pendingRegistrations: 0 }
    });
  }
});

// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Access your application at: http://localhost:${PORT}`);
  console.log(`🔧 Admin panel: http://localhost:${PORT}/admin/dashboard`);
});

module.exports = app; 