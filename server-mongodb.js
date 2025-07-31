const express = require('express');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const session = require('express-session');
const path = require('path');
const puppeteer = require('puppeteer');
require('dotenv').config(); // Load environment variables

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
  wmalaysia: { color: 'yellow', label: 'Miscellaneous Events in W. Malaysia' }
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
      frameSrc: [
        "'self'",
        "https://www.youtube.com",
        "https://youtube.com", 
        "https://player.vimeo.com",
        "https://vimeo.com",
        "https://www.dailymotion.com",
        "https://dailymotion.com",
        "https://www.twitch.tv",
        "https://player.twitch.tv"
      ],
    },
  },
  crossOriginEmbedderPolicy: false, // Disable COEP to allow third-party video embeds
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
    secure: process.env.NODE_ENV === 'production', // HTTPS in production
    maxAge: parseInt(process.env.SESSION_TIMEOUT) || 7200000 // 2 hours default
  }
}));

// Enhanced admin authentication middleware
const adminAuth = async (req, res, next) => {
  if (!req.session.isAuthenticated || !req.session.adminId) {
    return res.redirect('/login');
  }
  
  try {
    // Verify admin still exists and is active
    const admin = await DatabaseService.getAdminByUsername(req.session.username);
    if (!admin || !admin.isActive) {
      req.session.destroy(() => {
        res.redirect('/login?reason=unauthorized');
      });
      return;
    }
    
    // Enhanced security checks
    const now = Date.now();
    const loginTime = req.session.loginTime || 0;
    const sessionTimeout = parseInt(process.env.SESSION_TIMEOUT) || 7200000; // 2 hours
    
    // Check session timeout
    if (now - loginTime > sessionTimeout) {
      req.session.destroy(() => {
        res.redirect('/login?reason=timeout');
      });
      return;
    }
    
    // Check user agent consistency (basic session hijacking protection)
    if (req.session.userAgent && req.session.userAgent !== req.get('User-Agent')) {
      console.warn(`Session hijacking attempt detected - IP: ${req.ip}, Original UA: ${req.session.userAgent}, Current UA: ${req.get('User-Agent')}`);
      req.session.destroy(() => {
        res.redirect('/login?reason=security');
      });
      return;
    }
    
    // Update last activity time
    req.session.lastActivity = now;
    req.admin = admin; // Add admin info to request
    
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    req.session.destroy(() => {
      res.redirect('/login?reason=error');
    });
  }
};

// Player authentication middleware
const playerAuth = async (req, res, next) => {
  if (!req.session.isPlayerAuthenticated || !req.session.playerId) {
    return res.redirect('/player-login');
  }
  
  try {
    // Verify player still exists and is active
    const player = await DatabaseService.getPlayerById(req.session.playerId);
    if (!player || player.status !== 'active') {
      req.session.destroy(() => {
        res.redirect('/player-login?reason=unauthorized');
      });
      return;
    }
    
    req.player = player; // Add player info to request
    next();
  } catch (error) {
    console.error('Player auth error:', error);
    req.session.destroy(() => {
      res.redirect('/player-login?reason=error');
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

// Test PDF Template Route (for debugging)
app.get('/tournament/test-pdf-template', async (req, res) => {
  try {
    const tournaments = await DatabaseService.getAllTournaments();
    const formattedTournaments = tournaments.map(t => ({
      ...t.toObject(),
      color: tournamentTypes[t.type]?.color || 'green'
    }));
    
    res.render('templates/tournament-pdf', { tournaments: formattedTournaments });
  } catch (error) {
    console.error('Template test error:', error);
    res.status(500).json({ error: 'Template test failed', details: error.message });
  }
});

// Simple PDF Download (fallback method)
app.get('/tournament/download-pdf-simple', async (req, res) => {
  let browser = null;
  
  try {
    console.log('Starting simple PDF generation...');
    
    const tournaments = await DatabaseService.getAllTournaments();
    const formattedTournaments = tournaments.map(t => ({
      ...t.toObject(),
      color: tournamentTypes[t.type]?.color || 'green'
    }));
    
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-ipc-flooding-protection',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--no-first-run',
        '--no-default-browser-check',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-default-apps',
        '--disable-background-networking'
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
      timeout: 60000
    });
    
    const page = await browser.newPage();
    
    const htmlContent = await new Promise((resolve, reject) => {
      res.app.render('templates/tournament-pdf', { 
        tournaments: formattedTournaments 
      }, (err, html) => {
        if (err) reject(err);
        else resolve(html);
      });
    });
    
    await page.setContent(htmlContent);
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      landscape: true,
      printBackground: true
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="tournaments.pdf"');
    res.send(pdfBuffer);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ 
      error: 'PDF generation failed', 
      details: error.message 
    });
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Browser close error:', closeError);
      }
    }
  }
});

// Service pages
app.get('/services/registration', async (req, res) => {
  try {
    const tournaments = await DatabaseService.getAllTournaments();
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/services/registration', { tournaments, session: req.session, backgroundImage });
  } catch (error) {
    console.error('Registration page error:', error);
    res.render('pages/services/registration', { tournaments: [], session: req.session, backgroundImage: '/images/defaultbg.png' });
  }
});

app.get('/services/requirement-approval', async (req, res) => {
  const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
  res.render('pages/services/requirement-approval', { session: req.session, backgroundImage });
});

app.get('/services/requirement-bidding', async (req, res) => {
  const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
  res.render('pages/services/requirement-bidding', { session: req.session, backgroundImage });
});

app.get('/services/application-organizing', async (req, res) => {
  const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
  res.render('pages/services/application-organizing', { session: req.session, backgroundImage });
});

app.get('/services/application-bidding', async (req, res) => {
  const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
  res.render('pages/services/application-bidding', { session: req.session, backgroundImage });
});

app.get('/services/section-33', async (req, res) => {
  const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
  res.render('pages/services/section-33', { session: req.session, backgroundImage });
});

app.get('/services/section-34', async (req, res) => {
  const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
  res.render('pages/services/section-34', { session: req.session, backgroundImage });
});

app.get('/services/section-36', async (req, res) => {
  const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
  res.render('pages/services/section-36', { session: req.session, backgroundImage });
});

app.get('/services/ranking', async (req, res) => {
  const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
  // For now, return empty rankings - you can implement ranking logic later
  res.render('pages/services/ranking', { rankings: [], session: req.session, backgroundImage });
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
  } else if (reason === 'error') {
    error = 'An error occurred. Please try logging in again.';
  }
  
  res.render('pages/login', { error, session: req.session });
});

// Enhanced login security middleware
const loginAttempts = new Map(); // In production, use Redis or database
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
const LOCKOUT_DURATION = parseInt(process.env.LOCK_TIME) || 900000; // 15 minutes

function checkRateLimit(req, res, next) {
  const clientIP = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  const attempts = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
  
  // Reset attempts after lockout duration
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
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Track failed attempt for validation errors
    const clientIP = req.clientIP;
    const attempts = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    loginAttempts.set(clientIP, attempts);
    
    const errorMessages = errors.array().map(error => error.msg).join(', ');
    return res.render('pages/login', { error: errorMessages, session: req.session });
  }
  
  const { username, password } = req.body;
  
  try {
    // Get admin from database
    const admin = await DatabaseService.getAdminByUsername(username);
    
    if (!admin) {
      // Track failed attempt
      const clientIP = req.clientIP;
      const attempts = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
      attempts.count++;
      attempts.lastAttempt = Date.now();
      loginAttempts.set(clientIP, attempts);
      
      console.warn(`Failed login attempt from IP: ${clientIP}, Username: ${username}, Time: ${new Date().toISOString()}`);
      return res.render('pages/login', { error: 'Invalid username or password', session: req.session });
    }
    
    // Check if account is locked
    if (admin.isLocked()) {
      return res.render('pages/login', { 
        error: 'Account is temporarily locked due to too many failed attempts. Please try again later.',
        session: req.session 
      });
    }
    
    // Verify password
    const isValidPassword = await admin.comparePassword(password);
    
    if (!isValidPassword) {
      // Increment login attempts for this admin
      await admin.incLoginAttempts();
      
      // Track failed attempt
      const clientIP = req.clientIP;
      const attempts = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
      attempts.count++;
      attempts.lastAttempt = Date.now();
      loginAttempts.set(clientIP, attempts);
      
      console.warn(`Failed login attempt from IP: ${clientIP}, Username: ${username}, Time: ${new Date().toISOString()}`);
      return res.render('pages/login', { error: 'Invalid username or password', session: req.session });
    }
    
    // Success - reset attempts
    loginAttempts.delete(req.clientIP);
    await admin.resetLoginAttempts();
    await DatabaseService.updateAdminLastLogin(admin._id);
    
    // Enhanced session security
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
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

// Continue with more routes...
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Access your application at: http://localhost:${PORT}`);
  console.log(`🔧 Admin panel: http://localhost:${PORT}/admin/dashboard`);
});

module.exports = app; 