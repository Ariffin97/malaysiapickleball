const express = require('express');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
const session = require('express-session');
const path = require('path');
const pdf = require('html-pdf');
const cloudinary = require('cloudinary').v2;

// Load environment variables
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});


// MongoDB imports
const { connectDB } = require('./config/database');
const DatabaseService = require('./services/databaseService');
const EmailService = require('./services/emailService');
const Tournament = require('./models/Tournament');

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
      international: { color: 'orange', label: 'International' },

};

// Middleware

// Enhanced CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:3000', 'http://localhost:3001'];

app.use(cors({
  origin: function (origin, callback) {
    console.log('🌐 CORS Check - Origin:', origin);
    
    // Allow requests with no origin (mobile apps, curl, Postman, same-origin requests)
    if (!origin) {
      console.log('✅ CORS Allow - No origin (same-origin request)');
      return callback(null, true);
    }
    
    // Development - allow localhost and common dev ports
    if (process.env.NODE_ENV === 'development') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        console.log('✅ CORS Allow - Development localhost');
        return callback(null, true);
      }
    }
    
    // Allow same-origin requests for admin interface
    const requestHost = origin.replace(/^https?:\/\//, '');
    const allowedHosts = [
      'malaysiapickleball-fbab5112dbaf.herokuapp.com',
      'www.malaysiapickleball.my',
      'malaysiapickleball.my'
    ];
    
    console.log('🔍 CORS Check - Request host:', requestHost, 'Allowed hosts:', allowedHosts);
    
    if (allowedHosts.includes(requestHost)) {
      console.log('✅ CORS Allow - Matched allowed host');
      return callback(null, true);
    }
    
    // Check allowed origins from environment
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS Allow - Matched environment origin');
      return callback(null, true);
    }
    
    // For production, log and allow all origins temporarily for debugging
    console.log('⚠️ CORS Unknown origin - allowing temporarily:', origin);
    console.log('📋 Environment allowed origins:', allowedOrigins);
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

// Proper security headers with helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'", 
        "'unsafe-inline'",
        "'unsafe-hashes'",
        "https://cdn.jsdelivr.net",
        "https://cdnjs.cloudflare.com",
        "https://cdn.tailwindcss.com",
        "https://unpkg.com"
      ],
      'script-src-attr': ["'unsafe-inline'"],
      styleSrc: [
        "'self'", 
        "'unsafe-inline'", 
        "https://cdn.jsdelivr.net", 
        "https://cdnjs.cloudflare.com"
      ],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "data:"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: [
        "'self'",
        "https://www.youtube.com",
        "https://youtube.com",
        "https://player.vimeo.com"
      ]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// Enhanced middleware configuration
const morgan = require('morgan');

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Body parsing middleware
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.json({ limit: '10mb' }));

// File upload middleware with enhanced options
app.use(fileUpload({
  limits: { 
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    files: 20 // Maximum 20 files per request
  },
  abortOnLimit: false,
  useTempFiles: false, // Use memory instead of temp files for better reliability
  safeFileNames: true,
  preserveExtension: true,
  createParentPath: true
}));

// Static files middleware with explicit MIME types and cache busting
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
    }
  }
}));

// View engine configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'pickleball_secret_change_in_production',
  resave: true, // Force session save to ensure persistence
  saveUninitialized: true, // Save uninitialized sessions
  cookie: { 
    secure: false, // Temporarily disable secure cookies for debugging
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_TIMEOUT) || 7200000, // 2 hours
    sameSite: 'lax' // Allow cross-site cookies for redirects
  }
}));

// Enhanced admin authentication middleware
const adminAuth = async (req, res, next) => {
  console.log('🔍 Admin Auth Check:', {
    isAuthenticated: req.session.isAuthenticated,
    adminId: req.session.adminId,
    username: req.session.username,
    sessionId: req.sessionID,
    hasSession: !!req.session,
    sessionKeys: Object.keys(req.session || {})
  });
  
  if (!req.session.isAuthenticated || !req.session.adminId) {
    console.log('❌ Admin auth failed: No session or adminId');
    console.log('🔍 Full session object:', req.session);
    
    // Check if it's an AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        redirect: '/login'
      });
    }
    
    return res.redirect('/login');
  }
  
  try {
    const admin = await DatabaseService.getAdminByUsername(req.session.username);
    console.log('👤 Admin lookup result:', admin ? 'Found' : 'Not found', admin?.isActive);
    
    if (!admin || !admin.isActive) {
      console.log('❌ Admin auth failed: Admin not found or inactive');
      
      // Check if it's an AJAX request
      if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
        req.session.destroy();
        return res.status(401).json({
          success: false,
          message: 'Admin account not found or inactive',
          redirect: '/login?reason=unauthorized'
        });
      }
      
      req.session.destroy(() => {
        res.redirect('/login?reason=unauthorized');
      });
      return;
    }
    
    const now = Date.now();
    const loginTime = req.session.loginTime || 0;
    const sessionTimeout = 7200000; // 2 hours
    
    if (now - loginTime > sessionTimeout) {
      // Check if it's an AJAX request
      if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
        req.session.destroy();
        return res.status(401).json({
          success: false,
          message: 'Session expired',
          redirect: '/login?reason=timeout'
        });
      }
      
      req.session.destroy(() => {
        res.redirect('/login?reason=timeout');
      });
      return;
    }
    
    if (req.session.userAgent && req.session.userAgent !== req.get('User-Agent')) {
      console.warn(`Session hijacking attempt detected - IP: ${req.ip}`);
      
      // Check if it's an AJAX request
      if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
        req.session.destroy();
        return res.status(401).json({
          success: false,
          message: 'Security error detected',
          redirect: '/login?reason=security'
        });
      }
      
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
    
    // Check if it's an AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      req.session.destroy();
      return res.status(500).json({
        success: false,
        message: 'Authentication error occurred',
        redirect: '/login?reason=error'
      });
    }
    
    req.session.destroy(() => {
      res.redirect('/login?reason=error');
    });
  }
};

// Player authentication middleware
const playerAuth = async (req, res, next) => {
  if (!req.session.isPlayerAuthenticated || !req.session.playerId) {
    return res.redirect('/player/login');
  }
  
  try {
    const player = await DatabaseService.getPlayerById(req.session.playerId);
    if (!player || player.status !== 'active') {
      req.session.destroy(() => {
        res.redirect('/player/login?reason=unauthorized');
      });
      return;
    }
    
    req.player = player;
    next();
  } catch (error) {
    console.error('Player auth error:', error);
    req.session.destroy(() => {
      res.redirect('/player/login?reason=error');
    });
  }
};

// Import and use API routes
const apiRoutes = require('./routes/api');
const mobileRoutes = require('./routes/mobile');

app.use('/api', apiRoutes);
app.use('/api/mobile', mobileRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // File upload error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'File size too large',
      errorCode: 'FILE_TOO_LARGE'
    });
  }
  
  // CORS error
  if (err.message === 'Not allowed by CORS') {
    console.log('🚨 CORS Error Details:', {
      origin: req.headers.origin,
      referer: req.headers.referer,
      host: req.headers.host,
      userAgent: req.headers['user-agent']
    });
    return res.status(403).json({
      success: false,
      message: 'CORS policy violation',
      errorCode: 'CORS_ERROR'
    });
  }
  
  // Default error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
    errorCode: 'INTERNAL_ERROR'
  });
});

// Routes
app.get('/', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    
    // Get popup settings from database
    const popupActive = await DatabaseService.getSetting('popup_active', false);
    const popupTitle = await DatabaseService.getSetting('popup_title', '');
    const popupContent = await DatabaseService.getSetting('popup_content', '');
    const popupImage = await DatabaseService.getSetting('popup_image', null);
    
    // Get video URLs and types from database
    const video1 = await DatabaseService.getSetting('homepage_video_1', null);
    const video2 = await DatabaseService.getSetting('homepage_video_2', null);
    const video1Type = await DatabaseService.getSetting('homepage_video_1_type', 'Featured Video');
    const video2Type = await DatabaseService.getSetting('homepage_video_2_type', 'Featured Video');
    
    // Get homepage Quick Stats (admin-managed)
    const quickStats = await DatabaseService.getSetting('homepage_quick_stats', {
      players: 500,
      tournaments: 25,
      venues: 15,
      coaches: 50,
    });
    
    console.log('Homepage popup data:', { popupActive, popupTitle, popupContent, popupImage }); // Debug log
    console.log('Homepage video data:', { video1: video1 ? 'Present' : 'Null', video2: video2 ? 'Present' : 'Null' }); // Debug log
    console.log('Video types:', { video1Type, video2Type }); // Debug log
    
    res.render('pages/home', { 
      session: req.session, 
      backgroundImage,
      video1: video1,
      video2: video2,
      video1Type: video1Type,
      video2Type: video2Type,
      quickStats,
      popupMessage: {
        active: popupActive,
        title: popupTitle,
        content: popupContent,
        image: popupImage
      }
    });
  } catch (error) {
    console.error('Home page error:', error);
    res.render('pages/home', { 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png',
      video1: null,
      video2: null,
      video1Type: 'Featured Video',
      video2Type: 'Featured Video',
      quickStats: { players: 500, tournaments: 25, venues: 15, coaches: 50 },
      popupMessage: { active: false, title: '', content: '', image: null }
    });
  }
});

app.get('/tournament', async (req, res) => {
  try {
    console.log('🏆 Loading tournament calendar page...');
    
    const tournaments = await DatabaseService.getAllTournaments();
    console.log(`📊 Found ${tournaments ? tournaments.length : 0} tournaments in database`);
    
    const notices = await DatabaseService.getActiveTournamentNotices();
    console.log(`📢 Found ${notices ? notices.length : 0} tournament notices`);
    
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    
    const formattedTournaments = tournaments.map(t => {
      const tournamentObj = t.toObject ? t.toObject() : t;
      return {
        ...tournamentObj,
        color: tournamentTypes[tournamentObj.type]?.color || 'green'
      };
    });
    
    console.log(`✅ Rendering tournament page with ${formattedTournaments.length} formatted tournaments`);
    
    res.render('pages/tournament', { 
      tournaments: formattedTournaments, 
      notices: notices || [],
      session: req.session, 
      backgroundImage 
    });
  } catch (error) {
    console.error('❌ Tournament page error:', error);
    console.error('Stack trace:', error.stack);
    
    // Still try to get basic data even if there's an error
    let fallbackTournaments = [];
    let fallbackNotices = [];
    
    try {
      fallbackTournaments = await DatabaseService.getAllTournaments() || [];
      fallbackNotices = await DatabaseService.getActiveTournamentNotices() || [];
      console.log(`🔄 Fallback: ${fallbackTournaments.length} tournaments, ${fallbackNotices.length} notices`);
    } catch (fallbackError) {
      console.error('❌ Fallback also failed:', fallbackError);
    }
    
    res.render('pages/tournament', { 
      tournaments: fallbackTournaments.map(t => ({
        ...(t.toObject ? t.toObject() : t),
        color: tournamentTypes[t.type]?.color || 'green'
      })), 
      notices: fallbackNotices,
      session: req.session, 
      backgroundImage: '/images/defaultbg.png'
    });
  }
});

// API: Upcoming tournaments (same data source as tournament calendar)
app.get('/api/tournaments/upcoming', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 4;
    let all = await DatabaseService.getAllTournaments();
    const now = new Date();

    // Fallback to sample data if DB is empty (mirrors events page behavior)
    if (!all || all.length === 0) {
      all = [
        { name: 'KGM Autumn Tournament', startDate: '2025-01-15', endDate: '2025-01-17', type: 'local', city: 'Kuala Lumpur', venue: 'KGM Sports Complex' },
        { name: 'MPR@KL (SUKMA)', startDate: '2025-02-26', endDate: '2025-02-28', type: 'state', city: 'Selangor', venue: 'MPR Sports Center' },
        { name: 'SPA Grand Finals', startDate: '2025-03-10', endDate: '2025-03-12', type: 'national', city: 'Penang', venue: 'SPA Arena' },
        { name: 'IOP Johor', startDate: '2025-04-20', endDate: '2025-04-22', type: 'wmalaysia', city: 'Johor Bahru', venue: 'IOP Sports Complex' },
      ];
    }

    let upcoming = (all || [])
      // Include future and ongoing tournaments (endDate >= now)
      .filter(t => {
        const start = t.startDate ? new Date(t.startDate) : null;
        const end = t.endDate ? new Date(t.endDate) : start;
        return start && end && end >= now; 
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, limit)
      .map(t => ({
        id: t._id,
        name: t.name,
        type: t.type,
        startDate: t.startDate,
        endDate: t.endDate,
        location: t.location || t.city || '',
        venue: t.venue || '',
        status: 'upcoming'
      }));

    // Fallback: if no future/ongoing found, show the most recent 4 (so UI isn't empty)
    if (!upcoming || upcoming.length === 0) {
      upcoming = (all || [])
        .filter(t => t.startDate)
        .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
        .slice(0, limit)
        .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
        .map(t => ({
          id: t._id,
          name: t.name,
          type: t.type,
          startDate: t.startDate,
          endDate: t.endDate,
          location: t.location || t.city || '',
          venue: t.venue || '',
          status: 'completed'
        }));
    }

    res.json({
      success: true,
      message: 'Upcoming tournaments',
      data: { tournaments: upcoming }
    });
  } catch (error) {
    console.error('Upcoming tournaments API error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch upcoming tournaments' });
  }
});

// Events page route
app.get('/events', async (req, res) => {
  try {
    const tournaments = await DatabaseService.getAllTournaments();
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    
    let formattedTournaments = tournaments.map(t => ({
      ...t.toObject(),
      color: tournamentTypes[t.type]?.color || 'green'
    }));
    
    // If no tournaments in database, add sample data for demonstration
    if (formattedTournaments.length === 0) {
      formattedTournaments = [
        { name: 'KGM Autumn Tournament', startDate: '2025-01-15', endDate: '2025-01-17', type: 'local', color: 'green' },
        { name: 'MPR@KL (SUKMA)', startDate: '2025-02-26', endDate: '2025-02-28', type: 'state', color: 'red' },
        { name: 'SPA Grand Finals', startDate: '2025-03-10', endDate: '2025-03-12', type: 'national', color: 'blue' },
        { name: 'IOP Johor', startDate: '2025-04-20', endDate: '2025-04-22', type: 'wmalaysia', color: 'yellow' },
        { name: 'Sarawak Open Championship', startDate: '2025-05-15', endDate: '2025-05-17', type: 'sarawak', color: 'purple' },
        { name: 'Penang Masters Tournament', startDate: '2025-06-10', endDate: '2025-06-12', type: 'local', color: 'green' }
      ];
    }
    
    res.render('pages/events', { 
      tournaments: formattedTournaments, 
      session: req.session, 
      backgroundImage 
    });
  } catch (error) {
    console.error('Events page error:', error);
    // Fallback sample data in case of error
    const sampleTournaments = [
      { name: 'KGM Autumn Tournament', startDate: '2025-01-15', endDate: '2025-01-17', type: 'local', color: 'green' },
      { name: 'MPR@KL (SUKMA)', startDate: '2025-02-26', endDate: '2025-02-28', type: 'state', color: 'red' },
      { name: 'SPA Grand Finals', startDate: '2025-03-10', endDate: '2025-03-12', type: 'national', color: 'blue' },
      { name: 'IOP Johor', startDate: '2025-04-20', endDate: '2025-04-22', type: 'wmalaysia', color: 'orange' },
      { name: 'Sarawak Open Championship', startDate: '2025-05-15', endDate: '2025-05-17', type: 'sarawak', color: 'purple' },
      { name: 'Penang Masters Tournament', startDate: '2025-06-10', endDate: '2025-06-12', type: 'local', color: 'green' }
    ];
    
    res.render('pages/events', { 
      tournaments: sampleTournaments, 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png'
    });
  }
});

// Training page route
app.get('/training', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/training', { 
      session: req.session, 
      backgroundImage: backgroundImage 
    });
  } catch (error) {
    console.error('Training page error:', error);
    res.status(500).render('error', { error: 'Failed to load training page' });
  }
});

// Terms of Service page route
app.get('/terms', (req, res) => {
  res.render('pages/terms', { 
    session: req.session 
  });
});

// Privacy Policy page route
app.get('/privacy-policy', (req, res) => {
  res.render('pages/privacy-policy', { 
    session: req.session 
  });
});

// Cookie Policy page route
app.get('/cookies', (req, res) => {
  res.render('pages/cookies', { 
    session: req.session 
  });
});

// Live Tournament public page route
app.get('/live-tournament', async (req, res) => {
  try {
    // Get live tournament settings
    const liveStatus = await DatabaseService.getSetting('liveStatus', 'inactive');
    const tournamentTitle = await DatabaseService.getSetting('tournamentTitle', 'Live Tournament');
    const maxStreams = await DatabaseService.getSetting('maxStreams', 2);
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    
    // Get all live streams
    const liveStreams = [];
    for (let i = 1; i <= maxStreams; i++) {
      const stream = await DatabaseService.getSetting(`liveStream${i}`, null);
      const streamTitle = await DatabaseService.getSetting(`liveStream${i}Title`, `Live Stream ${i}`);
      const streamStatus = await DatabaseService.getSetting(`liveStream${i}Status`, 'offline');
      
      if (stream && streamStatus === 'live') {
        liveStreams.push({
          number: i,
          embed: stream,
          title: streamTitle,
          status: streamStatus
        });
      }
    }
    
    res.render('pages/live-tournament', {
      liveStatus,
      tournamentTitle,
      liveStreams,
      maxStreams,
      backgroundImage,
      session: req.session
    });
  } catch (error) {
    console.error('Live tournament page error:', error);
    res.render('pages/live-tournament', {
      liveStatus: 'inactive',
      tournamentTitle: 'Live Tournament',
      liveStreams: [],
      maxStreams: 2,
      backgroundImage: '/images/defaultbg.png',
      session: req.session
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

app.post('/login', [
  body('username').notEmpty().trim().isLength({ min: 3, max: 30 }),
  body('password').notEmpty().isLength({ min: 6 })
], async (req, res) => {
  console.log('🔍 Login attempt started');
  console.log('🔍 Request headers:', {
    origin: req.headers.origin,
    referer: req.headers.referer,
    host: req.headers.host,
    'user-agent': req.headers['user-agent']?.substring(0, 50) + '...',
    'content-type': req.headers['content-type']
  });
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Validation errors:', errors.array());
      return res.render('pages/login', { error: 'Invalid input', session: req.session });
    }
    
    const { username, password } = req.body;
    console.log('🔍 Login attempt for username:', username);
    
    const admin = await DatabaseService.getAdminByUsername(username);
    console.log('🔍 Admin found:', admin ? 'Yes' : 'No');
    
    if (!admin) {
      console.log('❌ Admin not found');
      return res.render('pages/login', { error: 'Invalid username or password', session: req.session });
    }
    
    console.log('🔍 Checking if admin is locked...');
    if (admin.isLocked && admin.isLocked()) {
      console.log('❌ Admin account is locked');
      return res.render('pages/login', { 
        error: 'Account is temporarily locked. Please try again later.',
        session: req.session 
      });
    }
    
    console.log('🔍 Comparing password...');
    const isValidPassword = await admin.comparePassword(password);
    console.log('🔍 Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      if (admin.incLoginAttempts) {
        await admin.incLoginAttempts();
      }
      return res.render('pages/login', { error: 'Invalid username or password', session: req.session });
    }
    
    console.log('✅ Login successful, setting up session...');
    
    // Reset login attempts on successful login
    if (admin.resetLoginAttempts) {
      await admin.resetLoginAttempts();
    }
    
    // Update last login
    await DatabaseService.updateAdminLastLogin(admin._id);
    
    // Set session directly without regeneration for now
    req.session.isAuthenticated = true;
    req.session.adminId = admin._id;
    req.session.username = admin.username;
    req.session.loginTime = Date.now();
    req.session.userAgent = req.get('User-Agent');
    
    console.log('✅ Session set:', {
      isAuthenticated: req.session.isAuthenticated,
      adminId: req.session.adminId,
      username: req.session.username,
      sessionId: req.sessionID
    });
    
    // Force session save before redirect
    req.session.save((err) => {
      if (err) {
        console.error('❌ Session save error:', err);
        return res.render('pages/login', { error: 'Session error occurred', session: req.session });
      }
      console.log('✅ Session saved, redirecting to dashboard');
      res.redirect('/admin/dashboard');
    });
    
  } catch (error) {
    console.error('❌ Login error:', error);
    console.error('❌ Error stack:', error.stack);
    res.render('pages/login', { error: 'An error occurred during login', session: req.session });
  }
});


// REMOVED: Old polling-based sync functions replaced by webhook system
// Functions savePortalTournamentsToDatabase() and mapPortalTypeToDbType() 
// have been removed as part of implementing webhook-based bi-directional sync

// ===========================
// WEBHOOK SYSTEM FOR BI-DIRECTIONAL SYNC
// ===========================

// Webhook endpoint to receive tournament updates from portal
app.post('/api/webhooks/tournament-updated', express.json(), async (req, res) => {
  console.log('🔔 Webhook received: Tournament updated from portal');
  
  try {
    const { tournament, action } = req.body;
    
    if (!tournament || !action) {
      console.error('❌ Invalid webhook payload:', req.body);
      return res.status(400).json({ error: 'Invalid webhook payload' });
    }

    const Tournament = require('./models/Tournament');

    if (action === 'created' || action === 'updated') {
      // Map portal tournament data to database format
      const tournamentData = {
        name: tournament.eventTitle || tournament.name,
        startDate: tournament.startDate || tournament.eventStartDate,
        endDate: tournament.endDate || tournament.eventEndDate,
        type: mapPortalTypeToDbType(tournament.tournamentType || tournament.type),
        venue: tournament.venue,
        city: tournament.city,
        state: tournament.state,
        organizer: tournament.organizer,
        personInCharge: tournament.personInCharge,
        phoneNumber: tournament.telContact || tournament.phoneNumber,
        contactEmail: tournament.contactEmail,
        description: tournament.description || tournament.eventSummary,
        registrationOpen: tournament.registrationOpen !== false,
        maxParticipants: tournament.maxParticipants,
        managedByPortal: true,
        portalApplicationId: tournament.applicationId,
        portalTournamentId: tournament.id,
        source: 'portal',
        lastModifiedBy: 'portal-webhook',
        status: 'upcoming'
      };

      // Find existing tournament
      const existingTournament = await Tournament.findOne({
        $or: [
          { portalApplicationId: tournament.applicationId },
          { portalTournamentId: tournament.id }
        ]
      });

      if (existingTournament) {
        // Store original data for change detection
        const originalData = {
          name: existingTournament.name,
          startDate: existingTournament.startDate,
          endDate: existingTournament.endDate,
          venue: existingTournament.venue,
          city: existingTournament.city,
          organizer: existingTournament.organizer,
          personInCharge: existingTournament.personInCharge,
          phoneNumber: existingTournament.phoneNumber
        };

        // Update the tournament
        await Tournament.findByIdAndUpdate(existingTournament._id, tournamentData);
        console.log(`🔄 Updated tournament via webhook: ${tournamentData.name}`);

        // Generate automatic notices for changes from portal
        try {
          const TournamentNoticeService = require('./services/tournamentNoticeService');
          await TournamentNoticeService.generateAutomaticNotices(
            existingTournament._id,
            originalData,
            tournamentData,
            'portal-webhook'
          );
        } catch (noticeError) {
          console.error('Error generating automatic notices for portal update:', noticeError);
        }
      } else {
        await Tournament.create(tournamentData);
        console.log(`✅ Created new tournament via webhook: ${tournamentData.name}`);
      }

    } else if (action === 'deleted') {
      // Find tournament before deletion to generate cancellation notice
      const tournamentToDelete = await Tournament.findOne({
        $or: [
          { portalApplicationId: tournament.applicationId },
          { portalTournamentId: tournament.id }
        ]
      });

      if (tournamentToDelete) {
        // Generate cancellation notice before deletion
        try {
          const TournamentNoticeService = require('./services/tournamentNoticeService');
          await TournamentNoticeService.createCancellationNotice(
            tournamentToDelete,
            'Tournament cancelled by MPA Portal',
            'portal-webhook'
          );
        } catch (noticeError) {
          console.error('Error generating cancellation notice for portal deletion:', noticeError);
        }

        // Remove tournament from database
        const result = await Tournament.deleteOne({
          $or: [
            { portalApplicationId: tournament.applicationId },
            { portalTournamentId: tournament.id }
          ]
        });

        if (result.deletedCount > 0) {
          console.log(`🗑️  Deleted tournament via webhook: ${tournament.name || tournamentToDelete.name}`);
        }
      } else {
        console.log(`⚠️  Tournament not found for deletion: ${tournament.name}`);
      }
    }

    res.json({ success: true, message: `Tournament ${action} processed successfully` });

  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    res.status(500).json({ error: 'Webhook processing failed', details: error.message });
  }
});

// Webhook endpoint to send tournament updates to portal
app.post('/api/webhooks/send-to-portal', adminAuth, async (req, res) => {
  console.log('🔔 Sending tournament update to portal');
  
  try {
    const { tournament, action } = req.body;
    
    if (!tournament || !action) {
      return res.status(400).json({ error: 'Invalid request payload' });
    }

    // Send webhook to portal if it's not a portal-managed tournament
    if (!tournament.managedByPortal) {
      const portalApiService = new (require('./services/portalApiService'))();
      
      // Transform tournament data for portal
      const portalTournament = {
        eventTitle: tournament.name,
        eventStartDate: tournament.startDate,
        eventEndDate: tournament.endDate,
        tournamentType: tournament.type,
        venue: tournament.venue,
        city: tournament.city,
        state: tournament.state,
        organizer: tournament.organizer,
        personInCharge: tournament.personInCharge,
        telContact: tournament.phoneNumber,
        contactEmail: tournament.contactEmail,
        description: tournament.description,
        maxParticipants: tournament.maxParticipants,
        source: 'main-site'
      };

      if (action === 'created' || action === 'updated') {
        await portalApiService.createApplication(portalTournament);
        console.log(`✅ Sent ${action} tournament to portal: ${tournament.name}`);
      }
    }

    res.json({ success: true, message: `Tournament ${action} sent to portal successfully` });

  } catch (error) {
    console.error('❌ Portal webhook error:', error);
    res.status(500).json({ error: 'Portal webhook failed', details: error.message });
  }
});

// Helper function for mapping tournament types (recreated for webhooks)
function mapPortalTypeToDbType(portalType) {
  const typeMap = {
    'local': 'local',
    'state': 'state', 
    'national': 'national',
    'international': 'international',
    'sarawak': 'sarawak',
    'west malaysia': 'wmalaysia',
    'regional': 'state', // fallback
    'district': 'local'  // fallback
  };
  
  if (!portalType) return 'local'; // default
  return typeMap[portalType.toLowerCase()] || 'local';
}

// Admin Routes
app.get('/admin/dashboard', adminAuth, async (req, res) => {
  try {
    const stats = await DatabaseService.getStatistics();
    const pendingRegistrations = await DatabaseService.getPendingPlayerRegistrations();
    
    // Get unregistered players count
    const UnregisteredPlayer = require('./models/UnregisteredPlayer');
    const unregisteredPlayers = await UnregisteredPlayer.find({});
    
    res.render('pages/admin/dashboard', { 
      pendingRegistrations, 
      users: [], // Legacy compatibility
      unregisteredPlayers,
      session: req.session,
      stats
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.render('pages/admin/dashboard', { 
      pendingRegistrations: [], 
      users: [], 
      unregisteredPlayers: [],
      session: req.session,
      stats: { totalPlayers: 0, activePlayers: 0, totalTournaments: 0, pendingRegistrations: 0 }
    });
  }
});

// Admin Registrations Routes
app.get('/admin/registrations', adminAuth, async (req, res) => {
  try {
    const pendingRegistrations = await DatabaseService.getPendingPlayerRegistrations();
    res.render('pages/admin/registrations', { 
      pendingRegistrations, 
      session: req.session 
    });
  } catch (error) {
    console.error('Registrations page error:', error);
    res.render('pages/admin/registrations', { 
      pendingRegistrations: [], 
      session: req.session 
    });
  }
});

app.get('/admin/registrations/:id', adminAuth, async (req, res) => {
  try {
    const registrationId = req.params.id;
    const registration = await DatabaseService.getPlayerRegistrationById(registrationId);
    
    if (!registration) {
      return res.render('pages/admin/registration-detail', { 
        registration: null, 
        session: req.session 
      });
    }
    
    res.render('pages/admin/registration-detail', { 
      registration, 
      session: req.session 
    });
  } catch (error) {
    console.error('Registration detail error:', error);
    res.render('pages/admin/registration-detail', { 
      registration: null, 
      session: req.session 
    });
  }
});

// Registration approval/rejection routes
app.post('/admin/registrations/accept/:id', adminAuth, async (req, res) => {
  try {
    const registrationId = req.params.id;
    const processedBy = req.session.username || 'admin';
    
    const result = await DatabaseService.approvePlayerRegistration(registrationId, processedBy);
    
    res.redirect('/admin/registrations?success=approved&playerId=' + result.player.playerId);
  } catch (error) {
    console.error('Error accepting registration:', error);
    res.redirect('/admin/registrations?error=approval_failed');
  }
});

app.post('/admin/registrations/reject/:id', adminAuth, async (req, res) => {
  try {
    const registrationId = req.params.id;
    const processedBy = req.session.username || 'admin';
    const notes = req.body.notes || 'Registration rejected by admin';
    
    await DatabaseService.rejectPlayerRegistration(registrationId, processedBy, notes);
    
    res.redirect('/admin/registrations?success=rejected');
  } catch (error) {
    console.error('Error rejecting registration:', error);
    res.redirect('/admin/registrations?error=rejection_failed');
  }
});

app.get('/admin/tournaments', adminAuth, async (req, res) => {
  try {
    res.render('pages/admin/manage-tournaments-react', {
      session: req.session,
      errors: [],
      formData: {}
    });
  } catch (error) {
    console.error('Error loading tournaments:', error);
    res.render('pages/admin/manage-tournaments-react', {
      session: req.session,
      errors: [{ msg: 'Failed to load tournaments.' }],
      formData: {}
    });
  }
});

// API endpoint for React component to fetch tournament data
// API endpoint for React component to fetch tournament data (Webhook-based)
app.get('/api/admin/tournaments-data', adminAuth, async (req, res) => {
  console.log('🔗 ADMIN TOURNAMENTS DATA - Webhook-based system');
  console.log('🎯 User session:', req.session?.username || 'No session');
  
  try {
    // Only fetch from local database (synced via webhooks from portal)
    const tournaments = await DatabaseService.getAllTournaments();
    console.log(`📊 Found ${tournaments ? tournaments.length : 0} tournaments in local database`);
    
    // Mark tournaments with their sources and format for admin display
    const formattedTournaments = tournaments.map(tournament => {
      const tournamentObj = tournament.toObject ? tournament.toObject() : tournament;
      return {
        ...tournamentObj,
        // Determine source based on managedByPortal flag
        source: tournamentObj.managedByPortal ? 'portal' : 'local-db',
        sourceLabel: tournamentObj.managedByPortal ? 'Portal (Webhook Sync)' : 'Local Database',
        inMainDatabase: true, // All are in main database now
        dbCheckStatus: 'confirmed', // All confirmed in local DB
        // Preserve portal IDs if available
        id: tournamentObj.portalTournamentId || tournamentObj._id || tournamentObj.id,
        applicationId: tournamentObj.portalApplicationId,
        name: tournamentObj.name || tournamentObj.eventTitle
      };
    });
    
    const portalTournaments = formattedTournaments.filter(t => t.managedByPortal);
    const localTournaments = formattedTournaments.filter(t => !t.managedByPortal);
    
    console.log(`✅ Returning ${portalTournaments.length} portal + ${localTournaments.length} local tournaments`);
    
    res.json({
      tournaments: formattedTournaments,
      stats: {
        total: formattedTournaments.length,
        local: localTournaments.length,
        portal: portalTournaments.length,
        localDb: formattedTournaments.length, // All are in local DB
        inMainDb: formattedTournaments.length,
        likelyInMainDb: formattedTournaments.length
      },
      portalStatus: 'webhook', // Webhook-based system
      portalError: null,
      syncMethod: 'webhook',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching tournament data:', error);
    res.status(500).json({
      error: 'Failed to load tournaments',
      message: error.message
    });
  }
});

// Test portal API connection (no auth required)
app.get('/api/portal/test', async (req, res) => {
  try {
    const PortalApiService = require('./services/portalApiService');
    const portalApi = new PortalApiService();
    const result = await portalApi.testConnection();
    
    res.json({
      success: true,
      portal: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Manual sync endpoint to pull tournaments from portal
app.post('/api/portal/sync-tournaments', async (req, res) => {
  try {
    console.log('🔄 Manual sync requested - pulling tournaments from portal...');
    
    const PortalApiService = require('./services/portalApiService');
    const portalApi = new PortalApiService();
    
    // Fetch tournaments from portal
    const portalResult = await portalApi.getTournaments();
    
    if (!portalResult.success) {
      throw new Error('Failed to fetch tournaments from portal');
    }
    
    let syncedCount = 0;
    let updatedCount = 0;
    const errors = [];
    
    // Process each tournament from portal
    for (const portalTournament of portalResult.tournaments) {
      try {
        // Check if tournament already exists in local database (same logic as webhook)
        const Tournament = require('./models/Tournament');
        const existingTournament = await Tournament.findOne({
          $or: [
            { portalApplicationId: portalTournament.applicationId },
            { portalTournamentId: portalTournament.applicationId },
            { applicationId: portalTournament.applicationId } // Backward compatibility
          ]
        });
        
        // Map portal classification to local type
        let localType = 'local'; // default
        if (portalTournament.classification) {
          const classification = portalTournament.classification.toLowerCase();
          if (classification.includes('international')) localType = 'international';
          else if (classification.includes('national')) localType = 'national';
          else if (classification.includes('state') || classification.includes('divisional')) localType = 'state';
          else localType = 'local';
        }
        
        // Prepare tournament data for local database (matching webhook field names)
        const tournamentData = {
          name: portalTournament.eventTitle,
          eventTitle: portalTournament.eventTitle,
          applicationId: portalTournament.applicationId,
          startDate: portalTournament.eventStartDate,
          endDate: portalTournament.eventEndDate,
          location: portalTournament.city,
          state: portalTournament.state,
          venue: portalTournament.venue,
          type: localType, // Required field
          classification: portalTournament.classification,
          organiserName: portalTournament.organiserName,
          personInCharge: portalTournament.personInCharge,
          email: portalTournament.email,
          telContact: portalTournament.telContact,
          expectedParticipants: portalTournament.expectedParticipants,
          eventSummary: portalTournament.eventSummary,
          description: portalTournament.eventSummary,
          status: 'upcoming',
          source: 'portal',
          managedByPortal: true,
          portalApplicationId: portalTournament.applicationId, // Match webhook field names
          portalTournamentId: portalTournament.applicationId,   // Match webhook field names
          lastModifiedBy: 'manual-sync',
          portalData: portalTournament
        };
        
        if (existingTournament) {
          // Update existing tournament
          await Tournament.findByIdAndUpdate(existingTournament._id, tournamentData);
          updatedCount++;
          console.log(`🔄 Updated tournament: ${portalTournament.eventTitle}`);
        } else {
          // Create new tournament
          await Tournament.create(tournamentData);
          syncedCount++;
          console.log(`✅ Created new tournament: ${portalTournament.eventTitle}`);
        }
      } catch (error) {
        console.error(`❌ Error processing tournament ${portalTournament.eventTitle}:`, error.message);
        errors.push(`${portalTournament.eventTitle}: ${error.message}`);
      }
    }
    
    console.log(`🎯 Sync completed: ${syncedCount} new, ${updatedCount} updated`);
    
    res.json({
      success: true,
      message: `Sync completed successfully`,
      stats: {
        totalFromPortal: portalResult.tournaments.length,
        newTournaments: syncedCount,
        updatedTournaments: updatedCount,
        errors: errors.length
      },
      errors: errors,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    res.json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

app.get('/admin/tournaments/view-all', adminAuth, async (req, res) => {
  try {
    const tournaments = await DatabaseService.getAllTournaments();
    const notices = await DatabaseService.getActiveTournamentNotices();
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    
    const formattedTournaments = tournaments.map(t => ({
      ...t.toObject(),
      color: tournamentTypes[t.type]?.color || 'green'
    }));
    
    res.render('pages/admin/view-all-tournaments', {
      tournaments: formattedTournaments || [],
      notices: notices || [],
      session: req.session,
      backgroundImage: backgroundImage
    });
  } catch (error) {
    console.error('Error loading all tournaments:', error);
    res.render('pages/admin/view-all-tournaments', {
      tournaments: [],
      notices: [],
      session: req.session,
      backgroundImage: '/images/defaultbg.png'
    });
  }
});

app.post('/admin/tournaments', adminAuth, [
  body('name').notEmpty().trim().withMessage('Tournament name is required'),
  body('startDate').notEmpty().withMessage('Start date is required'),
  body('endDate').notEmpty().withMessage('End date is required'),
  body('type').notEmpty().withMessage('Tournament type is required'),
  body('venue').optional().trim(),
  body('city').optional().trim(),
  body('organizer').optional().trim(),
  body('personInCharge').optional().trim(),
  body('phoneNumber').optional().trim().matches(/^[0-9+\-\s\(\)]+$/).withMessage('Phone number contains invalid characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Check if it's an AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const tournaments = await DatabaseService.getAllTournaments();
    return res.render('pages/admin/manage-tournaments', { 
      tournaments: tournaments || [], 
      session: req.session, 
      errors: errors.array(), 
      formData: req.body 
    });
  }
  
  try {
    const tournament = await DatabaseService.createTournament(req.body);
    
    // Trigger webhook to sync with portal (bi-directional sync)
    try {
      const axios = require('axios');
      await axios.post('http://localhost:5000/api/webhooks/send-to-portal', {
        tournament: tournament,
        action: 'created'
      }, {
        headers: {
          'Cookie': req.headers.cookie // Forward admin session
        },
        timeout: 5000
      });
      console.log('🔔 Tournament creation webhook triggered successfully');
    } catch (webhookError) {
      console.error('⚠️  Webhook trigger failed (tournament still created):', webhookError.message);
    }
    
    // Check if it's an AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.json({
        success: true,
        message: 'Tournament created successfully!',
        tournament: tournament,
        reload: true
      });
    }
    
    res.redirect('/admin/tournaments?success=tournament_added');
  } catch (error) {
    console.error('Add tournament error:', error);
    
    // Check if it's an AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to create tournament'
      });
    }
    
    res.redirect('/admin/tournaments?error=add_failed');
  }
});

app.post('/admin/tournaments/delete/:id', adminAuth, async (req, res) => {
  try {
    // Check if tournament is managed by portal
    const tournament = await Tournament.findById(req.params.id);
    if (tournament && tournament.managedByPortal) {
      return res.status(403).json({
        success: false,
        message: 'This tournament is managed by MPA Portal and cannot be deleted here. Changes must be made in the MPA Portal system.'
      });
    }
    
    const reason = req.body.reason || 'Tournament cancelled by admin';
    const modifiedBy = req.session.username || 'admin';
    
    // Store tournament data before deletion for webhook
    const tournamentBeforeDeletion = tournament;
    
    await DatabaseService.deleteTournament(req.params.id, reason, modifiedBy);
    
    // Trigger webhook to sync with portal (bi-directional sync)
    try {
      const axios = require('axios');
      await axios.post('http://localhost:5000/api/webhooks/send-to-portal', {
        tournament: tournamentBeforeDeletion,
        action: 'deleted'
      }, {
        headers: {
          'Cookie': req.headers.cookie // Forward admin session
        },
        timeout: 5000
      });
      console.log('🔔 Tournament deletion webhook triggered successfully');
    } catch (webhookError) {
      console.error('⚠️  Webhook trigger failed (tournament still deleted):', webhookError.message);
    }
    
    res.json({
      success: true,
      message: 'Tournament deleted successfully and cancellation notice created'
    });
  } catch (error) {
    console.error('Delete tournament error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete tournament'
    });
  }
});



// Tournament update route
app.post('/admin/tournaments/update/:id', adminAuth, [
  body('name').notEmpty().trim().withMessage('Tournament name is required'),
  body('type').isIn(['local', 'state', 'national', 'international', 'sarawak', 'wmalaysia']).withMessage('Valid tournament type is required'),
  body('startDate').optional({ checkFalsy: true }).isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional({ checkFalsy: true }).isISO8601().withMessage('Valid end date is required'),
  body('venue').optional().trim(),
  body('city').optional().trim(),
  body('organizer').optional().trim(),
  body('personInCharge').optional().trim(),
  body('phoneNumber').optional().trim().matches(/^[0-9+\-\s\(\)]+$|^Not Available$/).withMessage('Valid phone number format required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.error('🚫 Tournament update validation failed:', errors.array());
    console.error('📋 Request body:', req.body);
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const tournamentId = req.params.id;
    
    // Check if tournament is managed by portal
    const existingTournament = await Tournament.findById(tournamentId);
    if (existingTournament && existingTournament.managedByPortal) {
      return res.status(403).json({
        success: false,
        message: 'This tournament is managed by MPA Portal and cannot be edited here. Changes must be made in the MPA Portal system.'
      });
    }
    
    const updateData = {
      name: req.body.name,
      type: req.body.type,
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
      venue: req.body.venue || null,
      city: req.body.city || null,
      organizer: req.body.organizer || null,
      personInCharge: req.body.personInCharge || null,
      phoneNumber: req.body.phoneNumber || null
    };

    // Calculate months if dates are provided
    if (updateData.startDate && updateData.endDate) {
      const start = new Date(updateData.startDate);
      const end = new Date(updateData.endDate);
      const months = [];
      
      const current = new Date(start);
      while (current <= end) {
        months.push(current.getMonth());
        current.setMonth(current.getMonth() + 1);
      }
      
      updateData.months = [...new Set(months)]; // Remove duplicates
    } else if (updateData.startDate) {
      updateData.months = [new Date(updateData.startDate).getMonth()];
    }

    // Get current version for conflict detection
    const currentVersion = req.body.version ? parseInt(req.body.version) : null;
    const modifiedBy = req.session.username || 'admin';

    const updatedTournament = await DatabaseService.updateTournament(tournamentId, updateData, currentVersion, modifiedBy);
    
    // Trigger webhook to sync with portal (bi-directional sync)
    try {
      const axios = require('axios');
      await axios.post('http://localhost:5000/api/webhooks/send-to-portal', {
        tournament: updatedTournament,
        action: 'updated'
      }, {
        headers: {
          'Cookie': req.headers.cookie // Forward admin session
        },
        timeout: 5000
      });
      console.log('🔔 Tournament update webhook triggered successfully');
    } catch (webhookError) {
      console.error('⚠️  Webhook trigger failed (tournament still updated):', webhookError.message);
    }
    
    res.json({
      success: true,
      message: 'Tournament updated successfully'
    });
  } catch (error) {
    console.error('Update tournament error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update tournament'
    });
  }
});

app.get('/admin/players', adminAuth, async (req, res) => {
  try {
    const players = await DatabaseService.getAllPlayers();
    const allPlayerRegistrations = await DatabaseService.getAllPlayerRegistrations();
    
    // Filter players by status for the template
    const approvedPlayers = players.filter(player => player.status === 'active');
    const pendingRegistrations = allPlayerRegistrations.filter(reg => reg.status === 'pending');
    
    res.render('pages/admin/manage-players', {
      players: players || [],
      playerRegistrations: pendingRegistrations || [], // Only show pending registrations
      approvedPlayers: approvedPlayers || [],
      pendingRegistrations: pendingRegistrations || [],
      session: req.session,
      errors: [],
      success: null
    });
  } catch (error) {
    console.error('Error loading players:', error);
    res.render('pages/admin/manage-players', {
      players: [],
      playerRegistrations: [],
      approvedPlayers: [],
      pendingRegistrations: [],
      session: req.session,
      errors: [{ msg: 'Failed to load players.' }],
      success: null
    });
  }
});

// Player approval routes
app.post('/admin/players/approve/:id', adminAuth, async (req, res) => {
  try {
    const registrationId = req.params.id;
    const processedBy = req.session.username || 'admin';
    
    const result = await DatabaseService.approvePlayerRegistration(registrationId, processedBy);
    
    // Send welcome email to approved player
    try {
      const emailResult = await EmailService.sendWelcomeEmail({
        fullName: result.player.fullName,
        email: result.player.email,
        playerId: result.player.playerId
      });
      
      if (emailResult.success) {
        console.log('✅ Welcome email sent to approved player:', result.player.email);
      } else {
        console.log('⚠️ Failed to send welcome email:', emailResult.message || emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Error sending welcome email:', emailError);
      // Don't fail the approval if email fails
    }
    
    res.json({ 
      success: true, 
      message: `Player registration approved successfully! Player ID: ${result.player.playerId}. Welcome email sent to ${result.player.email}.`,
      player: result.player,
      playerId: result.player.playerId
    });
  } catch (error) {
    console.error('Error approving player:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to approve player registration' 
    });
  }
});

app.post('/admin/players/reject/:id', adminAuth, async (req, res) => {
  try {
    const registrationId = req.params.id;
    const processedBy = req.session.username || 'admin';
    const notes = req.body.notes || '';
    
    await DatabaseService.rejectPlayerRegistration(registrationId, processedBy, notes);
    
    res.json({ 
      success: true, 
      message: 'Player registration rejected successfully' 
    });
  } catch (error) {
    console.error('Error rejecting player:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Failed to reject player registration' 
    });
  }
});

// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

app.get('/player/login', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/player-login', {
      error: null,
      session: req.session,
      backgroundImage
    });
  } catch (error) {
    console.error('Player login page error:', error);
    res.render('pages/player-login', {
      error: 'Failed to load login page',
      session: req.session,
      backgroundImage: '/images/defaultbg.png'
    });
  }
});

app.get('/player/register', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/player-register', {
      error: null,
      success: null,
      session: req.session,
      backgroundImage
    });
  } catch (error) {
    console.error('Player register page error:', error);
    res.render('pages/player-register', {
      error: 'Failed to load registration page',
      success: null,
      session: req.session,
      backgroundImage: '/images/defaultbg.png'
    });
  }
});

// Player Registration POST
app.post('/player/register', [
  body('fullName').notEmpty().trim().withMessage('Full name is required'),
  body('icNumber').notEmpty().trim().matches(/^[0-9]{6}-[0-9]{2}-[0-9]{4}$/).withMessage('Valid IC number is required'),
  body('age').isInt({ min: 12, max: 100 }).withMessage('Age must be between 12 and 100'),
  body('phoneNumber').notEmpty().trim().withMessage('Phone number is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('address').notEmpty().trim().withMessage('Address is required'),
  body('username').notEmpty().trim().isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Username must be 3-20 characters, letters, numbers, and underscores only'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('terms').equals('on').withMessage('You must accept the terms and conditions')
], async (req, res) => {
  console.log('🔍 Player registration attempt:', {
    fullName: req.body.fullName,
    icNumber: req.body.icNumber,
    age: req.body.age,
    email: req.body.email
  });
  
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('❌ Validation errors:', errors.array());
    const errorMessages = errors.array().map(err => err.msg).join(', ');
    return res.render('pages/player-register', {
      error: `Please correct the following: ${errorMessages}`,
      success: null,
      session: req.session,
      backgroundImage: await DatabaseService.getSetting('background_image', '/images/defaultbg.png')
    });
  }
  
  try {
    // Check if IC number is already registered or in the system
    const icAvailability = await DatabaseService.checkIcNumberAvailability(req.body.icNumber);
    if (!icAvailability.available) {
      let errorMessage = '';
      if (icAvailability.isPlayerRegistered) {
        errorMessage = 'This IC number is already registered as an active player. Each IC number can only be registered once.';
      } else if (icAvailability.isInRegistrationSystem) {
        errorMessage = 'This IC number already has a registration in the system. Please check your registration status or contact admin.';
      }
      return res.render('pages/player-register', {
        error: errorMessage,
        success: null,
        session: req.session,
        backgroundImage: await DatabaseService.getSetting('background_image', '/images/defaultbg.png')
      });
    }

    // Check if username or email already exists
    const existingPlayer = await DatabaseService.getPlayerByUsername(req.body.username);
    if (existingPlayer) {
      return res.render('pages/player-register', {
        error: 'Username already exists. Please choose a different username.',
        success: null,
        session: req.session,
        backgroundImage: await DatabaseService.getSetting('background_image', '/images/defaultbg.png')
      });
    }

    const existingEmail = await DatabaseService.getPlayerByEmail(req.body.email);
    if (existingEmail) {
      return res.render('pages/player-register', {
        error: 'Email already registered. Please use a different email.',
        success: null,
        session: req.session,
        backgroundImage: await DatabaseService.getSetting('background_image', '/images/defaultbg.png')
      });
    }

    // Prepare registration data
    const registrationData = {
      fullName: req.body.fullName,
      icNumber: req.body.icNumber,
      age: parseInt(req.body.age),
      phoneNumber: req.body.phoneNumber,
      email: req.body.email,
      address: req.body.address,
      username: req.body.username,
      password: req.body.password,
      profilePicture: req.files && req.files.profilePicture ? req.files.profilePicture.name : null,
      status: 'pending',
      submittedAt: new Date()
    };

    // Handle profile picture upload to Cloudinary
    if (req.files && req.files.profilePicture) {
      const profilePicture = req.files.profilePicture;
      
      try {
        const cloudinaryResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              public_id: `registration_${Date.now()}`,
              folder: 'player_registrations',
              transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto:good' },
                { format: 'auto' }
              ],
              tags: ['registration', 'profile_picture']
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(profilePicture.data);
        });
        
        registrationData.profilePicture = cloudinaryResult.secure_url;
      } catch (error) {
        console.error('Failed to upload registration profile picture to Cloudinary:', error);
        registrationData.profilePicture = null;
      }
    }

    // Save registration to database
    const registration = await DatabaseService.createPlayerRegistration(registrationData);

    // Send registration success email
    try {
      const emailResult = await EmailService.sendRegistrationSuccessEmail({
        fullName: registrationData.fullName,
        email: registrationData.email,
        username: registrationData.username,
        password: registrationData.password
      });
      
      if (emailResult.success) {
        console.log('✅ Registration success email sent to:', registrationData.email);
      } else {
        console.log('⚠️ Failed to send registration email:', emailResult.message || emailResult.error);
      }
    } catch (emailError) {
      console.error('❌ Error sending registration email:', emailError);
      // Don't fail the registration if email fails
    }

    res.render('pages/player-register', {
      error: null,
      success: 'Registration submitted successfully! Your application has been received and will be reviewed by our admin team within 24-48 hours. A confirmation email with your login credentials has been sent to your email address. Once approved, you will receive a unique 5-character Player ID linked to your IC number.',
      session: req.session,
      backgroundImage: await DatabaseService.getSetting('background_image', '/images/defaultbg.png')
    });

  } catch (error) {
    console.error('Player registration error:', error);
    
    // Handle specific error messages
    let errorMessage = 'Registration failed. Please try again later.';
    if (error.message.includes('IC number')) {
      errorMessage = error.message;
    } else if (error.message.includes('duplicate key')) {
      if (error.message.includes('email')) {
        errorMessage = 'Email address is already registered. Please use a different email.';
      } else if (error.message.includes('username')) {
        errorMessage = 'Username is already taken. Please choose a different username.';
      } else if (error.message.includes('icNumber')) {
        errorMessage = 'This IC number is already registered. Each IC number can only be registered once.';
      }
    }
    
    res.render('pages/player-register', {
      error: errorMessage,
      success: null,
      session: req.session,
      backgroundImage: await DatabaseService.getSetting('background_image', '/images/defaultbg.png')
    });
  }
});

app.post('/player/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    console.log('Player login attempt:', username);
    const player = await DatabaseService.getPlayerByUsername(username);

    if (!player) {
      console.log('Player not found:', username);
      return res.render('pages/player-login', {
        error: 'Invalid username or password',
        session: req.session,
        backgroundImage: await DatabaseService.getSetting('background_image', '/images/defaultbg.png')
      });
    }

    console.log('Player found:', player.username, 'Status:', player.status);
    const passwordMatch = await player.comparePassword(password);
    console.log('Password match:', passwordMatch);

    if (!passwordMatch) {
      return res.render('pages/player-login', {
        error: 'Invalid username or password',
        session: req.session,
        backgroundImage: await DatabaseService.getSetting('background_image', '/images/defaultbg.png')
      });
    }

    if (player.status !== 'active') {
      console.log('Player account not active:', player.status);
      return res.render('pages/player-login', {
        error: 'Your account is not active. Please contact an administrator.',
        session: req.session,
        backgroundImage: await DatabaseService.getSetting('background_image', '/images/defaultbg.png')
      });
    }

    // Set session
    req.session.isPlayerAuthenticated = true;
    req.session.playerId = player._id;
    req.session.playerUsername = player.username;
    req.session.playerLoginTime = Date.now();

    console.log('Player login successful:', player.username);
    res.redirect('/player/dashboard');
  } catch (error) {
    console.error('Player login error:', error);
    res.render('pages/player-login', {
      error: 'Login failed. Please try again.',
      session: req.session,
      backgroundImage: await DatabaseService.getSetting('background_image', '/images/defaultbg.png')
    });
  }
});

app.get('/player/dashboard', playerAuth, async (req, res) => {
  try {
    const player = await DatabaseService.getPlayerById(req.session.playerId);
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    const unreadCount = await DatabaseService.getUnreadMessageCount(player.playerId);
    
    res.render('pages/player/dashboard', {
      player: player,
      unreadCount: unreadCount,
      session: req.session,
      backgroundImage
    });
  } catch (error) {
    console.error('Player dashboard error:', error);
    res.redirect('/player/login?error=dashboard_failed');
  }
});

// Player inbox routes
app.get('/player/inbox', playerAuth, async (req, res) => {
  try {
    const player = await DatabaseService.getPlayerById(req.session.playerId);
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    
    const messagesData = await DatabaseService.getPlayerMessages(player.playerId, page, limit);
    const unreadCount = await DatabaseService.getUnreadMessageCount(player.playerId);
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    
    res.render('pages/player/inbox', {
      player: player,
      messages: messagesData.messages,
      pagination: {
        page: messagesData.page,
        pages: messagesData.pages,
        total: messagesData.total,
        hasNext: messagesData.hasNext,
        hasPrev: messagesData.hasPrev
      },
      unreadCount: unreadCount,
      session: req.session,
      backgroundImage
    });
  } catch (error) {
    console.error('Player inbox error:', error);
    res.redirect('/player/dashboard?error=inbox_failed');
  }
});

app.get('/player/message/:id', playerAuth, async (req, res) => {
  try {
    const player = await DatabaseService.getPlayerById(req.session.playerId);
    const message = await DatabaseService.getMessageById(req.params.id);
    
    if (!message || message.recipientId !== player.playerId) {
      return res.redirect('/player/inbox?error=message_not_found');
    }
    
    // Mark message as read
    await DatabaseService.markMessageAsRead(req.params.id);
    
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    
    res.render('pages/player/message', {
      player: player,
      message: message,
      session: req.session,
      backgroundImage
    });
  } catch (error) {
    console.error('Player message view error:', error);
    res.redirect('/player/inbox?error=message_failed');
  }
});

app.post('/player/message/:id/mark-read', playerAuth, async (req, res) => {
  try {
    const player = await DatabaseService.getPlayerById(req.session.playerId);
    const message = await DatabaseService.getMessageById(req.params.id);
    
    if (!message || message.recipientId !== player.playerId) {
      return res.json({ success: false, message: 'Message not found' });
    }
    
    await DatabaseService.markMessageAsRead(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.json({ success: false, message: 'Failed to mark message as read' });
  }
});

// Player profile update route
app.post('/player/update-profile', playerAuth, async (req, res) => {
  try {
    const { fullName, age, address, phoneNumber, email } = req.body;
    
    // Validate required fields
    if (!fullName || !age || !address || !phoneNumber || !email) {
      return res.json({ success: false, message: 'All fields are required' });
    }
    
    // Validate age
    const numAge = parseInt(age);
    if (isNaN(numAge) || numAge < 12 || numAge > 100) {
      return res.json({ success: false, message: 'Age must be between 12 and 100' });
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.json({ success: false, message: 'Please enter a valid email address' });
    }
    
    const player = await DatabaseService.getPlayerById(req.session.playerId);
    if (!player) {
      return res.json({ success: false, message: 'Player not found' });
    }
    
    // Update player profile
    const updateData = {
      fullName: fullName.trim(),
      age: numAge,
      address: address.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email.trim().toLowerCase()
    };
    
    // Handle profile picture upload if provided
    if (req.files && req.files.profilePicture) {
      const file = req.files.profilePicture;
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.mimetype)) {
        return res.json({ success: false, message: 'Only JPEG, PNG and GIF images are allowed' });
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        return res.json({ success: false, message: 'Image size must be less than 5MB' });
      }
      
      // Upload to Cloudinary instead of local storage
      try {
        const cloudinaryResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              public_id: `profile_${req.session.playerId}_${Date.now()}`,
              folder: 'player_profiles',
              transformation: [
                { width: 400, height: 400, crop: 'fill', gravity: 'face' },
                { quality: 'auto:good' },
                { format: 'auto' }
              ],
              tags: ['profile_picture', `user_${req.session.playerId}`]
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(file.data);
        });
        
        updateData.profilePicture = cloudinaryResult.secure_url;
      } catch (error) {
        console.error('Failed to upload profile picture to Cloudinary:', error);
        return res.json({ success: false, message: 'Failed to upload profile picture' });
      }
    }
    
    await DatabaseService.updatePlayer(req.session.playerId, updateData);
    
    res.json({ success: true, message: 'Profile updated successfully!' });
  } catch (error) {
    console.error('Player profile update error:', error);
    res.json({ success: false, message: 'Failed to update profile. Please try again.' });
  }
});

// Player logout route
app.post('/player/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Admin message routes
app.get('/admin/messages', adminAuth, async (req, res) => {
  try {
    const players = await DatabaseService.getAllPlayers();
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    
    res.render('pages/admin/messages', {
      players: players,
      session: req.session,
      backgroundImage
    });
  } catch (error) {
    console.error('Admin messages error:', error);
    res.redirect('/admin/dashboard?error=messages_failed');
  }
});

app.post('/admin/messages/send', adminAuth, async (req, res) => {
  try {
    const { recipients, subject, content, type, priority } = req.body;
    
    if (!recipients || !subject || !content) {
      return res.json({ success: false, message: 'Missing required fields' });
    }

    const recipientList = Array.isArray(recipients) ? recipients : [recipients];
    const messagePromises = [];

    for (const recipientId of recipientList) {
      if (recipientId === 'all') {
        // Send to all players
        const allPlayers = await DatabaseService.getAllPlayers();
        for (const player of allPlayers) {
          messagePromises.push(
            DatabaseService.createMessage({
              recipientId: player.playerId,
              recipientType: 'player',
              senderType: 'admin',
              senderName: req.session.adminName || 'Admin',
              subject: subject,
              content: content,
              type: type || 'general',
              priority: priority || 'normal'
            })
          );
        }
      } else {
        // Send to specific player
        messagePromises.push(
          DatabaseService.createMessage({
            recipientId: recipientId,
            recipientType: 'player',
            senderType: 'admin',
            senderName: req.session.adminName || 'Admin',
            subject: subject,
            content: content,
            type: type || 'general',
            priority: priority || 'normal'
          })
        );
      }
    }

    await Promise.all(messagePromises);
    
    res.json({ 
      success: true, 
      message: `Message sent to ${recipientList.includes('all') ? 'all players' : recipientList.length + ' player(s)'}` 
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.json({ success: false, message: 'Failed to send message' });
  }
});

// Admin Home Management Routes
app.get('/admin/home', adminAuth, async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', null);
    const popupImage = await DatabaseService.getSetting('popup_image', null);
    const video1 = await DatabaseService.getSetting('homepage_video_1', null);
    const video2 = await DatabaseService.getSetting('homepage_video_2', null);
    const video1Original = await DatabaseService.getSetting('homepage_video_1_original', null);
    const video2Original = await DatabaseService.getSetting('homepage_video_2_original', null);
    const video1Type = await DatabaseService.getSetting('homepage_video_1_type', 'Featured Video');
    const video2Type = await DatabaseService.getSetting('homepage_video_2_type', 'Featured Video');
    
    res.render('pages/admin/manage-home', { 
      backgroundImage: backgroundImage,
      popupImage: popupImage,
      video1: video1,
      video2: video2,
      video1Original: video1Original,
      video2Original: video2Original,
      video1Type: video1Type,
      video2Type: video2Type,
      session: req.session 
    });
  } catch (error) {
    console.error('Admin home page error:', error);
    res.render('pages/admin/manage-home', {
      backgroundImage: null,
      popupImage: null,
      video1: null,
      video2: null,
      video1Original: null,
      video2Original: null,
      video1Type: 'Featured Video',
      video2Type: 'Featured Video',
      session: req.session
    });
  }
});

// Admin: Manage Quick Stats (for homepage)
app.get('/admin/home-stats', adminAuth, async (req, res) => {
  try {
    const quickStats = await DatabaseService.getSetting('homepage_quick_stats', {
      players: 500,
      tournaments: 25,
      venues: 15,
      coaches: 50,
    });
    res.render('pages/admin/manage-stats', { quickStats, session: req.session });
  } catch (error) {
    console.error('Admin home-stats page error:', error);
    res.render('pages/admin/manage-stats', { quickStats: { players: 500, tournaments: 25, venues: 15, coaches: 50 }, session: req.session });
  }
});

app.post('/admin/home-stats', adminAuth, async (req, res) => {
  try {
    const parseNum = (v, def) => {
      const n = parseInt(v, 10);
      return Number.isFinite(n) && n >= 0 ? n : def;
    };

    const updated = {
      players: parseNum(req.body.players, 500),
      tournaments: parseNum(req.body.tournaments, 25),
      venues: parseNum(req.body.venues, 15),
      coaches: parseNum(req.body.coaches, 50),
    };

    await DatabaseService.setSetting('homepage_quick_stats', updated, 'Homepage quick stats', 'appearance', req.session?.username || 'admin');
    res.redirect('/admin/home-stats?success=1');
  } catch (error) {
    console.error('Saving home-stats failed:', error);
    res.redirect('/admin/home-stats?error=1');
  }
});

// Admin: Manage Referees
app.get('/admin/referees', adminAuth, async (req, res) => {
  try {
    // For now, render with empty data - can be expanded later
    res.render('pages/admin/manage-referees', { 
      referees: [],
      session: req.session 
    });
  } catch (error) {
    console.error('Admin referees page error:', error);
    res.render('pages/admin/manage-referees', { 
      referees: [], 
      session: req.session 
    });
  }
});

// Admin: View Organisers
app.get('/admin/organisers', adminAuth, async (req, res) => {
  try {
    res.render('pages/admin/organisers', { session: req.session });
  } catch (error) {
    console.error('Admin organisers page error:', error);
    res.render('pages/admin/organisers', { session: req.session });
  }
});

// Admin: Manage Venues
app.get('/admin/venues', adminAuth, async (req, res) => {
  try {
    const venues = await DatabaseService.listVenues();
    res.render('pages/admin/manage-venue', { venues: venues || [], session: req.session });
  } catch (error) {
    console.error('Admin venues page error:', error);
    res.render('pages/admin/manage-venue', { venues: [], session: req.session });
  }
});

app.post('/admin/venues', adminAuth, async (req, res) => {
  try {
    const { name, address, bookingUrl, totalCourts, owner, phone, mapsUrl, description, tournamentLevels } = req.body;

    // Handle multiple image uploads

    let imageUrls = [];
    if (req.files && req.files.imageFiles) {
      const files = Array.isArray(req.files.imageFiles) ? req.files.imageFiles : [req.files.imageFiles];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const cloudinaryResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                public_id: `venue_${Date.now()}_${i}`,
                folder: 'venues',
                transformation: [
                  { width: 1200, height: 800, crop: 'limit' },
                  { quality: 'auto:good' },
                  { format: 'auto' }
                ],
                tags: ['venue', `venue_${name.replace(/\s+/g, '_').toLowerCase()}`]
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(file.data);
          });
          
          imageUrls.push(cloudinaryResult.secure_url);
        } catch (error) {
          console.error('Failed to upload venue image to Cloudinary:', error);
          // Continue with other images, don't fail the entire request
        }
      }
    }

    const levels = (tournamentLevels || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    await DatabaseService.createVenue({ name, address, bookingUrl, imageUrls, totalCourts, owner, phone, mapsUrl, description, tournamentLevels: levels });
    res.redirect('/admin/venues');
  } catch (error) {
    console.error('Create venue failed:', error);
    res.redirect('/admin/venues?error=1');
  }
});

app.get('/admin/venues/:id/edit', adminAuth, async (req, res) => {
  try {
    const venues = await DatabaseService.listVenues();
    const venue = venues.find(v => String(v._id) === String(req.params.id));
    if (!venue) {
      return res.redirect('/admin/venues');
    }
    res.render('pages/admin/edit-venue', { venue, session: req.session });
  } catch (error) {
    console.error('Edit venue page error:', error);
    res.redirect('/admin/venues?error=1');
  }
});

app.post('/admin/venues/:id', adminAuth, async (req, res) => {
  try {
    const { name, address, bookingUrl, totalCourts, owner, phone, mapsUrl, description, tournamentLevels } = req.body;

    // Handle additional image uploads (append)
    const pathModule = require('path');
    const fs = require('fs');
    const uploadsDir = pathModule.join(__dirname, 'public', 'uploads', 'venues');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    let newImages = [];
    if (req.files && req.files.imageFiles) {
      const files = Array.isArray(req.files.imageFiles) ? req.files.imageFiles : [req.files.imageFiles];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        try {
          const cloudinaryResult = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              {
                public_id: `venue_update_${req.params.id}_${Date.now()}_${i}`,
                folder: 'venues',
                transformation: [
                  { width: 1200, height: 800, crop: 'limit' },
                  { quality: 'auto:good' },
                  { format: 'auto' }
                ],
                tags: ['venue', 'venue_update']
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(file.data);
          });
          
          newImages.push(cloudinaryResult.secure_url);
        } catch (error) {
          console.error('Failed to upload venue update image to Cloudinary:', error);
          // Continue with other images, don't fail the entire request
        }
      }
    }

    const levels = (tournamentLevels || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const existing = await DatabaseService.getVenueBySlug(undefined); // placeholder to avoid linter issues
    // Fetch existing by id directly via mongoose to merge images
    const VenueModel = require('./models/Venue');
    const current = await VenueModel.findById(req.params.id);
    const mergedImages = [...(current?.imageUrls || []), ...newImages];

    await DatabaseService.updateVenue(req.params.id, { name, address, bookingUrl, imageUrls: mergedImages, totalCourts, owner, phone, mapsUrl, description, tournamentLevels: levels });
    res.redirect('/admin/venues');
  } catch (error) {
    console.error('Update venue failed:', error);
    res.redirect('/admin/venues?error=1');
  }
});

app.post('/admin/venues/:id/delete', adminAuth, async (req, res) => {
  try {
    await DatabaseService.deleteVenue(req.params.id);
    res.redirect('/admin/venues');
  } catch (error) {
    console.error('Delete venue failed:', error);
    res.redirect('/admin/venues?error=1');
  }
});

app.post('/admin/home', adminAuth, async (req, res) => {
  try {
    if (req.files && req.files.backgroundImage) {
      const backgroundImage = req.files.backgroundImage;
      
      try {
        const cloudinaryResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              public_id: `background_${Date.now()}`,
              folder: 'backgrounds',
              transformation: [
                { width: 1920, height: 1080, crop: 'limit' },
                { quality: 'auto:good' },
                { format: 'auto' }
              ],
              tags: ['background_image']
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(backgroundImage.data);
        });
        
        // Save Cloudinary URL to database
        await DatabaseService.setSetting('background_image', cloudinaryResult.secure_url);
      } catch (error) {
        console.error('Failed to upload background image to Cloudinary:', error);
        throw error;
      }
    }
    
    // Check if it's an AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.json({
        success: true,
        message: 'Background image updated successfully!'
      });
    }
    
    res.redirect('/admin/home');
  } catch (error) {
    console.error('Background image upload error:', error);
    
    // Check if it's an AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to update background image'
      });
    }
    
    res.redirect('/admin/home');
  }
});

// Popup Image Upload Route
app.post('/admin/popup-image', adminAuth, async (req, res) => {
  try {
    if (req.files && req.files.popupImage) {
      const popupImage = req.files.popupImage;
      
      try {
        const cloudinaryResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              public_id: `popup_${Date.now()}`,
              folder: 'popups',
              transformation: [
                { width: 600, height: 400, crop: 'limit' },
                { quality: 'auto:good' },
                { format: 'auto' }
              ],
              tags: ['popup_image']
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(popupImage.data);
        });
        
        // Save Cloudinary URL to database
        await DatabaseService.setSetting('popup_image', cloudinaryResult.secure_url);
      } catch (error) {
        console.error('Failed to upload popup image to Cloudinary:', error);
        throw error;
      }
    }
    
    // Check if it's an AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.json({
        success: true,
        message: 'Popup image updated successfully!'
      });
    }
    
    res.redirect('/admin/home');
  } catch (error) {
    console.error('Popup image upload error:', error);
    
    // Check if it's an AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to update popup image'
      });
    }
    
    res.redirect('/admin/home');
  }
});

// Popup Management Routes
app.post('/admin/popup/start', adminAuth, async (req, res) => {
  try {
    const { title, content } = req.body;
    await DatabaseService.setSetting('popup_active', true);
    await DatabaseService.setSetting('popup_title', title);
    await DatabaseService.setSetting('popup_content', content);
    res.json({ success: true });
  } catch (error) {
    console.error('Error starting popup:', error);
    res.status(500).json({ success: false, error: 'Failed to start popup' });
  }
});

app.post('/admin/popup/end', adminAuth, async (req, res) => {
  try {
    await DatabaseService.setSetting('popup_active', false);
    res.json({ success: true });
  } catch (error) {
    console.error('Error ending popup:', error);
    res.status(500).json({ success: false, error: 'Failed to end popup' });
  }
});

app.get('/admin/popup/status', adminAuth, async (req, res) => {
  try {
    const active = await DatabaseService.getSetting('popup_active', false);
    const title = await DatabaseService.getSetting('popup_title', '');
    const content = await DatabaseService.getSetting('popup_content', '');
    const image = await DatabaseService.getSetting('popup_image', null);
    
    res.json({
      active: active,
      title: title,
      content: content,
      image: image
    });
  } catch (error) {
    console.error('Error getting popup status:', error);
    res.status(500).json({ success: false, error: 'Failed to get popup status' });
  }
});

app.post('/admin/popup/remove-image', adminAuth, async (req, res) => {
  try {
    await DatabaseService.setSetting('popup_image', null);
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing popup image:', error);
    res.status(500).json({ success: false, error: 'Failed to remove image' });
  }
});

// Video Embed Code Management Routes
app.post('/admin/video-urls', adminAuth, async (req, res) => {
  try {
    const { videoNumber, embedCode, videoType } = req.body;
    
    if (!videoNumber || !embedCode) {
      throw new Error('Video number and embed code are required');
    }
    
    // Basic validation for embed code (should contain iframe)
    if (!embedCode.includes('<iframe') || !embedCode.includes('</iframe>')) {
      throw new Error('Please provide a valid embed code with iframe tags');
    }
    
    // Sanitize embed code - ensure it's safe
    const sanitizedEmbedCode = sanitizeEmbedCode(embedCode);
    
    // Save to database
    const settingKey = `homepage_video_${videoNumber}`;
    await DatabaseService.setSetting(settingKey, sanitizedEmbedCode);
    await DatabaseService.setSetting(`${settingKey}_original`, embedCode);
    await DatabaseService.setSetting(`${settingKey}_type`, videoType || 'Featured Video');
    
    // Check if it's an AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.json({
        success: true,
        message: `Video ${videoNumber} updated successfully!`,
        embedCode: sanitizedEmbedCode,
        videoType: videoType || 'Featured Video'
      });
    }
    
    res.redirect('/admin/home?success=video_updated');
  } catch (error) {
    console.error('Video embed code update error:', error);
    
    // Check if it's an AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to update video embed code'
      });
    }
    
    res.redirect('/admin/home?error=video_update_failed');
  }
});

// Function to sanitize embed code
function sanitizeEmbedCode(embedCode) {
  // Remove any script tags for security
  let sanitized = embedCode.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Handle YouTube specific fixes
  if (sanitized.includes('youtube.com/embed/')) {
    // Extract video ID
    const videoIdMatch = sanitized.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (videoIdMatch) {
      const videoId = videoIdMatch[1];
      
      // Create a new embed URL with all necessary parameters to bypass restrictions and enable interaction
      const embedParams = [
        'autoplay=0',
        'controls=1',
        'rel=0',
        'modestbranding=1',
        'playsinline=1',
        'enablejsapi=1',
        'fs=1', // Enable fullscreen
        'cc_load_policy=0', // Don't show captions by default
        'iv_load_policy=3', // Hide video annotations
        'origin=' + encodeURIComponent(process.env.SITE_URL || 'http://localhost:3000'),
        'widget_referrer=' + encodeURIComponent(process.env.SITE_URL || 'http://localhost:3000')
      ].join('&');
      
      // Replace the entire src with optimized URL
      const newSrc = `https://www.youtube.com/embed/${videoId}?${embedParams}`;
      sanitized = sanitized.replace(/src="[^"]*"/i, `src="${newSrc}"`);
    }
  }
  
  // Ensure iframe has proper attributes for responsive design, security, and interaction
  sanitized = sanitized.replace(/<iframe/gi, '<iframe class="w-full h-full" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"');
  
  // Add allowfullscreen if not present
  if (!sanitized.includes('allowfullscreen')) {
    sanitized = sanitized.replace('></iframe>', ' allowfullscreen></iframe>');
  }
  
  // Ensure proper sandbox permissions for YouTube/Vimeo
  // If CSP allows it and you want to silence security errors, include allow-same-origin; otherwise, fall back without it
  const sandboxAttrs = (process.env.IFRAME_RELAXED === 'true')
    ? 'allow-same-origin allow-scripts allow-presentation allow-forms'
    : 'allow-scripts allow-presentation allow-forms';
  if (!sanitized.includes('sandbox')) {
    sanitized = sanitized.replace('<iframe', `<iframe sandbox="${sandboxAttrs}"`);
  } else {
    sanitized = sanitized.replace(/sandbox="[^"]*"/gi, `sandbox="${sandboxAttrs}"`);
  }
  
  // Remove any potentially dangerous attributes
  sanitized = sanitized.replace(/on\w+="[^"]*"/gi, ''); // Remove onclick, onload, etc.
  sanitized = sanitized.replace(/javascript:/gi, ''); // Remove javascript: protocols
  
  return sanitized;
}

// One-time cleanup function to fix existing iframe sandbox attributes
async function cleanupExistingEmbedCodes() {
  try {
    console.log('🔧 Starting iframe sandbox cleanup...');

    // Homepage featured videos (current keys)
    const video1 = await DatabaseService.getSetting('homepage_video_1', null);
    const video2 = await DatabaseService.getSetting('homepage_video_2', null);

    if (video1) {
      const sanitized = sanitizeEmbedCode(video1);
      if (sanitized !== video1) {
        await DatabaseService.setSetting(
          'homepage_video_1',
          sanitized,
          'Homepage featured video 1 (sanitized)',
          'appearance',
          'system'
        );
        console.log('✅ Fixed homepage video 1');
      }
    }

    if (video2) {
      const sanitized = sanitizeEmbedCode(video2);
      if (sanitized !== video2) {
        await DatabaseService.setSetting(
          'homepage_video_2',
          sanitized,
          'Homepage featured video 2 (sanitized)',
          'appearance',
          'system'
        );
        console.log('✅ Fixed homepage video 2');
      }
    }

    // Live streams (support both new and legacy keys)
    const maxStreams = await DatabaseService.getSetting(
      'live_tournament_max_streams',
      await DatabaseService.getSetting('maxStreams', 4)
    );

    for (let i = 1; i <= maxStreams; i++) {
      const newKey = `live_stream_${i}`;      // new convention
      const legacyKey = `liveStream${i}`;     // legacy convention

      // Prefer new key, fall back to legacy
      const current = await DatabaseService.getSetting(
        newKey,
        await DatabaseService.getSetting(legacyKey, null)
      );

      if (current) {
        const sanitized = sanitizeEmbedCode(current);
        if (sanitized !== current) {
          // Write back using the new canonical key
          await DatabaseService.setSetting(
            newKey,
            sanitized,
            `Live stream ${i} embed code (sanitized)`,
            'tournament',
            'system'
          );
          console.log(`✅ Fixed live stream ${i}`);
        }
      }
    }

    console.log('✅ Iframe sandbox cleanup completed');
  } catch (error) {
    console.error('❌ Error during iframe cleanup:', error);
  }
}

// Run cleanup on server start (only once)
if (process.env.NODE_ENV !== 'test') {
  setTimeout(cleanupExistingEmbedCodes, 2000);
}

// Get current video embed codes for admin page
app.get('/admin/video-urls', adminAuth, async (req, res) => {
  try {
    const video1 = await DatabaseService.getSetting('homepage_video_1', null);
    const video2 = await DatabaseService.getSetting('homepage_video_2', null);
    const video1Original = await DatabaseService.getSetting('homepage_video_1_original', null);
    const video2Original = await DatabaseService.getSetting('homepage_video_2_original', null);
    const video1Type = await DatabaseService.getSetting('homepage_video_1_type', 'Featured Video');
    const video2Type = await DatabaseService.getSetting('homepage_video_2_type', 'Featured Video');
    
    res.json({
      success: true,
      videos: {
        video1: {
          embedCode: video1,
          originalCode: video1Original,
          type: video1Type
        },
        video2: {
          embedCode: video2,
          originalCode: video2Original,
          type: video2Type
        }
      }
    });
  } catch (error) {
    console.error('Error getting video embed codes:', error);
    res.status(500).json({ success: false, error: 'Failed to get video embed codes' });
  }
});

// Live Tournament Management Routes
app.get('/admin/live-tournament', adminAuth, async (req, res) => {
  try {
    // Get live tournament settings
    const maxStreams = await DatabaseService.getSetting('live_tournament_max_streams', 2);
    const liveStatus = await DatabaseService.getSetting('live_tournament_status', 'inactive');
    const tournamentTitle = await DatabaseService.getSetting('live_tournament_title', '');
    
    // Get all live streams data
    const streamData = {};
    for (let i = 1; i <= maxStreams; i++) {
      streamData[`liveStream${i}`] = await DatabaseService.getSetting(`live_stream_${i}`, null);
      streamData[`liveStream${i}Original`] = await DatabaseService.getSetting(`live_stream_${i}_original`, '');
      streamData[`liveStream${i}Title`] = await DatabaseService.getSetting(`live_stream_${i}_title`, `Live Stream ${i}`);
      streamData[`liveStream${i}Status`] = await DatabaseService.getSetting(`live_stream_${i}_status`, 'offline');
    }
    
    res.render('pages/admin/manage-live-tournament', { 
      maxStreams: maxStreams,
      liveStatus: liveStatus,
      tournamentTitle: tournamentTitle,
      ...streamData,
      session: req.session 
    });
  } catch (error) {
    console.error('Live tournament page error:', error);
    res.render('pages/admin/manage-live-tournament', {
      maxStreams: 2,
      liveStatus: 'inactive',
      tournamentTitle: '',
      session: req.session
    });
  }
});

// Live Tournament Settings Update
app.post('/admin/live-tournament/settings', adminAuth, async (req, res) => {
  try {
    const { maxStreams, liveStatus, tournamentTitle } = req.body;
    
    await DatabaseService.setSetting('live_tournament_max_streams', parseInt(maxStreams) || 2);
    await DatabaseService.setSetting('live_tournament_status', liveStatus || 'inactive');
    await DatabaseService.setSetting('live_tournament_title', tournamentTitle || '');
    
    // Check if it's an AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.json({
        success: true,
        message: 'Live tournament settings updated successfully!'
      });
    }
    
    res.redirect('/admin/live-tournament?success=settings_updated');
  } catch (error) {
    console.error('Live tournament settings update error:', error);
    
    // Check if it's an AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to update live tournament settings'
      });
    }
    
    res.redirect('/admin/live-tournament?error=settings_update_failed');
  }
});

// Live Stream Update
app.post('/admin/live-tournament/streams', adminAuth, async (req, res) => {
  try {
    const { streamNumber, embedCode, streamTitle, streamStatus } = req.body;
    
    if (!streamNumber) {
      throw new Error('Stream number is required');
    }
    
    if (embedCode && (!embedCode.includes('<iframe') || !embedCode.includes('</iframe>'))) {
      throw new Error('Please provide a valid embed code with iframe tags');
    }
    
    // Sanitize embed code if provided
    let sanitizedEmbedCode = null;
    if (embedCode && embedCode.trim()) {
      sanitizedEmbedCode = sanitizeEmbedCode(embedCode);
    }
    
    // Save to database
    const streamKey = `live_stream_${streamNumber}`;
    await DatabaseService.setSetting(streamKey, sanitizedEmbedCode);
    await DatabaseService.setSetting(`${streamKey}_original`, embedCode || '');
    await DatabaseService.setSetting(`${streamKey}_title`, streamTitle || `Live Stream ${streamNumber}`);
    await DatabaseService.setSetting(`${streamKey}_status`, streamStatus || 'offline');
    
    // Check if it's an AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.json({
        success: true,
        message: `Stream ${streamNumber} updated successfully!`,
        embedCode: sanitizedEmbedCode,
        streamTitle: streamTitle,
        streamStatus: streamStatus
      });
    }
    
    res.redirect('/admin/live-tournament?success=stream_updated');
  } catch (error) {
    console.error('Live stream update error:', error);
    
    // Check if it's an AJAX request
    if (req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.status(400).json({
        success: false,
        message: error.message || 'Failed to update live stream'
      });
    }
    
    res.redirect('/admin/live-tournament?error=stream_update_failed');
  }
});

// Get live tournament data API endpoint
app.get('/admin/live-tournament/api', adminAuth, async (req, res) => {
  try {
    const maxStreams = await DatabaseService.getSetting('live_tournament_max_streams', 2);
    const liveStatus = await DatabaseService.getSetting('live_tournament_status', 'inactive');
    const tournamentTitle = await DatabaseService.getSetting('live_tournament_title', '');
    
    const streams = {};
    for (let i = 1; i <= maxStreams; i++) {
      streams[`stream${i}`] = {
        embedCode: await DatabaseService.getSetting(`live_stream_${i}`, null),
        originalCode: await DatabaseService.getSetting(`live_stream_${i}_original`, ''),
        title: await DatabaseService.getSetting(`live_stream_${i}_title`, `Live Stream ${i}`),
        status: await DatabaseService.getSetting(`live_stream_${i}_status`, 'offline')
      };
    }
    
    res.json({
      success: true,
      maxStreams: maxStreams,  
      liveStatus: liveStatus,
      tournamentTitle: tournamentTitle,
      streams: streams
    });
  } catch (error) {
    console.error('Error getting live tournament data:', error);
    res.status(500).json({ success: false, error: 'Failed to get live tournament data' });
  }
});

// Public Pages Routes (Coming Soon Pages)
app.get('/referee', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/referee', { 
      referees: [], // Empty array since it's coming soon
      session: req.session, 
      backgroundImage 
    });
  } catch (error) {
    console.error('Referee page error:', error);
    res.render('pages/referee', { 
      referees: [], 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png' 
    });
  }
});

app.get('/coaches', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/coaches', { 
      coaches: [], // Empty array since it's coming soon
      session: req.session, 
      backgroundImage 
    });
  } catch (error) {
    console.error('Coaches page error:', error);
    res.render('pages/coaches', { 
      coaches: [], 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png' 
    });
  }
});

app.get('/venue', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    const venues = await DatabaseService.listVenues();
    res.render('pages/venue', { 
      venues: venues || [],
      session: req.session, 
      backgroundImage 
    });
  } catch (error) {
    console.error('Venue page error:', error);
    res.render('pages/venue', { 
      venues: [], 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png' 
    });
  }
});

// Venue detail page
app.get('/venue/:slug', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    const venue = await DatabaseService.getVenueBySlug(req.params.slug);
    if (!venue) {
      return res.status(404).render('pages/404', { session: req.session });
    }
    res.render('pages/venue-detail', { venue, session: req.session, backgroundImage });
  } catch (error) {
    console.error('Venue detail error:', error);
    res.status(500).render('pages/404', { session: req.session });
  }
});

app.get('/services/ranking', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/services/ranking', { 
      rankings: [], // Empty array since it's coming soon
      session: req.session, 
      backgroundImage 
    });
  } catch (error) {
    console.error('Ranking page error:', error);
    res.render('pages/services/ranking', { 
      rankings: [], 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png' 
    });
  }
});

app.get('/shop', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/shop', { 
      session: req.session, 
      backgroundImage 
    });
  } catch (error) {
    console.error('Shop page error:', error);
    res.render('pages/shop', { 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png' 
    });
  }
});

// Sarawak Pickleball Association Route
app.get('/sarawak-pickleball-association', async (req, res) => {
  try {
    // Fetch all announcements
    const result = await DatabaseService.getAnnouncements('all', 1, 50); // Increase limit if needed
    // Filter news and tournament announcements
    const newsList = result.announcements.filter(a => a.type === 'news');
    const tournamentAnnouncements = result.announcements.filter(a => a.type === 'event' && a.isActive && a.metadata && a.metadata.link === 'homepage');
    res.render('pages/sarawak-pickleball-association', { 
      session: req.session,
      newsList,
      tournamentAnnouncements
    });
  } catch (error) {
    console.error('Sarawak Pickleball Association page error:', error);
    res.render('pages/sarawak-pickleball-association', { 
      session: req.session,
      newsList: [],
      tournamentAnnouncements: []
    });
  }
});

// Sarawak Admin Authentication Middleware
const sarawakAdminAuth = (req, res, next) => {
  if (req.session && req.session.sarawakAdmin) {
    return next();
  } else {
    return res.redirect('/sarawak-admin-login?reason=unauthorized');
  }
};

// Sarawak Admin Login Routes
app.get('/sarawak-admin-login', (req, res) => {
  let error = null;
  const reason = req.query.reason;
  
  if (reason === 'unauthorized') {
    error = 'You must be logged in to access the admin dashboard.';
  } else if (reason === 'invalid') {
    error = 'Invalid username or password.';
  }
  
  res.render('pages/sarawak-admin-login', { 
    error, 
    session: req.session 
  });
});

app.post('/sarawak-admin-login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Simple hardcoded admin credentials for demo
    // In production, this should use proper authentication with hashed passwords
    const validCredentials = [
      { username: 'sarawak_admin', password: 'sarawak123', name: 'Sarawak Administrator' },
      { username: 'admin', password: 'admin123', name: 'System Admin' }
    ];
    
    const admin = validCredentials.find(cred => 
      cred.username === username && cred.password === password
    );
    
    if (admin) {
      // Set session
      req.session.sarawakAdmin = {
        username: admin.username,
        name: admin.name,
        loginTime: new Date()
      };
      
      console.log('Sarawak admin login successful:', admin.username);
      res.redirect('/sarawak-admin-dashboard');
    } else {
      console.log('Sarawak admin login failed:', username);
      res.redirect('/sarawak-admin-login?reason=invalid');
    }
  } catch (error) {
    console.error('Sarawak admin login error:', error);
    res.redirect('/sarawak-admin-login?reason=invalid');
  }
});

// Sarawak Admin Dashboard
app.get('/sarawak-admin-dashboard', sarawakAdminAuth, async (req, res) => {
  try {
    // Fetch all announcements (not just news)
    const result = await DatabaseService.getAnnouncements('all', 1, 50); // Increase limit if needed
    const newsList = result.announcements; // Pass all announcements
    res.render('pages/sarawak-admin-dashboard', { 
      admin: req.session.sarawakAdmin,
      session: req.session,
      newsList
    });
  } catch (error) {
    console.error('Sarawak admin dashboard error:', error);
    res.redirect('/sarawak-admin-login?reason=unauthorized');
  }
});

// Sarawak Admin Logout
app.get('/sarawak-admin-logout', (req, res) => {
  if (req.session.sarawakAdmin) {
    console.log('Sarawak admin logout:', req.session.sarawakAdmin.username);
    delete req.session.sarawakAdmin;
  }
  res.redirect('/sarawak-admin-login');
});

// Additional Services Routes
app.get('/services/sponsorship', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/services/sponsorship', { 
      sponsorships: [], 
      session: req.session, 
      backgroundImage 
    });
  } catch (error) {
    console.error('Sponsorship page error:', error);
    res.render('pages/services/sponsorship', { 
      sponsorships: [], 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png' 
    });
  }
});

// Official Partnership Route
app.get('/official-partnership', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/official-partnership', { 
      session: req.session, 
      backgroundImage 
    });
  } catch (error) {
    console.error('Official Partnership page error:', error);
    res.render('pages/official-partnership', { 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png' 
    });
  }
});

// Test route to verify images are accessible
app.get('/test-images', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Image Test</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .image-test { margin: 20px 0; padding: 10px; border: 1px solid #ccc; }
        img { max-width: 200px; height: auto; margin: 10px; }
        .success { color: green; }
        .error { color: red; }
      </style>
    </head>
    <body>
      <h1>Image Accessibility Test</h1>
      
      <div class="image-test">
        <h3>MPA Logo</h3>
        <img src="/images/mpa.png" alt="MPA Logo" onload="this.nextElementSibling.textContent='✅ Loaded successfully'" onerror="this.nextElementSibling.textContent='❌ Failed to load'">
        <div id="mpa-status">Loading...</div>
      </div>
      
      <div class="image-test">
        <h3>PG Logo</h3>
        <img src="/images/pglogo.png" alt="PG Logo" onload="this.nextElementSibling.textContent='✅ Loaded successfully'" onerror="this.nextElementSibling.textContent='❌ Failed to load'">
        <div id="pg-status">Loading...</div>
      </div>
      
      <div class="image-test">
        <h3>WPC Logo</h3>
        <img src="/images/wpclogo.png" alt="WPC Logo" onload="this.nextElementSibling.textContent='✅ Loaded successfully'" onerror="this.nextElementSibling.textContent='❌ Failed to load'">
        <div id="wpc-status">Loading...</div>
      </div>
      
      <div class="image-test">
        <h3>SPA Logo</h3>
        <img src="/images/spa.png" alt="SPA Logo" onload="this.nextElementSibling.textContent='✅ Loaded successfully'" onerror="this.nextElementSibling.textContent='❌ Failed to load'">
        <div id="spa-status">Loading...</div>
      </div>
      
      <div class="image-test">
        <h3>Fenix Digital Logo</h3>
        <img src="/images/FenixDigitalLogo.png" alt="Fenix Digital Logo" onload="this.nextElementSibling.textContent='✅ Loaded successfully'" onerror="this.nextElementSibling.textContent='❌ Failed to load'">
        <div id="fenix-status">Loading...</div>
      </div>
      
      <script>
        // Additional JavaScript to check image loading
        const images = ['/images/mpa.png', '/images/pglogo.png', '/images/wpclogo.png', '/images/spa.png', '/images/FenixDigitalLogo.png'];
        images.forEach(src => {
          const img = new Image();
          img.onload = () => console.log('✅', src, 'loaded successfully');
          img.onerror = () => console.log('❌', src, 'failed to load');
          img.src = src;
        });
      </script>
    </body>
    </html>
  `);
});



app.get('/services/application-organizing', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/services/application-organizing', { 
      session: req.session, 
      backgroundImage 
    });
  } catch (error) {
    console.error('Application organizing page error:', error);
    res.render('pages/services/application-organizing', { 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png' 
    });
  }
});

app.get('/services/application-bidding', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/services/application-bidding', { 
      session: req.session, 
      backgroundImage 
    });
  } catch (error) {
    console.error('Application bidding page error:', error);
    res.render('pages/services/application-bidding', { 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png' 
    });
  }
});



// Guideline pages
app.get('/services/tournament-guidelines', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/services/tournament-guidelines', { 
      session: req.session, 
      backgroundImage: backgroundImage 
    });
  } catch (error) {
    console.error('Error loading tournament guidelines page:', error);
    res.render('pages/services/tournament-guidelines', { 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png' 
    });
  }
});

app.get('/services/venue-guidelines', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/services/venue-guidelines', { 
      session: req.session, 
      backgroundImage: backgroundImage 
    });
  } catch (error) {
    console.error('Error loading venue guidelines page:', error);
    res.render('pages/services/venue-guidelines', { 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png' 
    });
  }
});

app.get('/services/club-guidelines', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/services/club-guidelines', { 
      session: req.session, 
      backgroundImage: backgroundImage 
    });
  } catch (error) {
    console.error('Error loading club guidelines page:', error);
    res.render('pages/services/club-guidelines', { 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png' 
    });
  }
});

// Organization Chart
app.get('/organization-chart', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    
    // Get organization chart data from database
    console.log('🔍 Loading organization chart display page...');
    let orgChartDataString = await DatabaseService.getSetting('organization_chart_data', null);
    let orgChartData = null;
    let dataSource = 'default';
    
    if (orgChartDataString) {
      try {
        orgChartData = JSON.parse(orgChartDataString);
        dataSource = 'database';
        console.log('🔍 Organization chart data loaded from database');
        console.log('🔍 VP2 photo:', orgChartData.vicePresidents?.[1]?.photo || 'Not found');
        console.log('🔍 Secretary photo:', orgChartData.secretary?.photo || 'Not found');
        console.log('🔍 Treasurer photo:', orgChartData.treasurer?.photo || 'Not found');
        console.log('🔍 Dev Committee photo:', orgChartData.committees?.[0]?.photo || 'Not found');
      } catch (parseError) {
        console.error('Error parsing organization chart data from database:', parseError);
        orgChartData = null;
      }
    }
    
    // If no data from database, try local storage
    if (!orgChartData) {
      console.log('🔍 No valid data from database, checking local storage...');
      try {
        const LocalStorageService = require('./services/localStorageService');
        orgChartDataString = LocalStorageService.getSetting('organization_chart_data', null);
        if (orgChartDataString) {
          orgChartData = JSON.parse(orgChartDataString);
          dataSource = 'local_storage';
          console.log('🔍 Organization chart data loaded from local storage');
          console.log('🔍 VP2 photo:', orgChartData.vicePresidents?.[1]?.photo || 'Not found');
          console.log('🔍 Secretary photo:', orgChartData.secretary?.photo || 'Not found');
          console.log('🔍 Treasurer photo:', orgChartData.treasurer?.photo || 'Not found');
        } else {
          console.log('🔍 No organization chart data found in local storage either, using defaults');
        }
      } catch (localError) {
        console.error('Error loading from local storage:', localError);
      }
    }
    
    console.log('🔍 Data source:', dataSource);
    
    // Default data if none exists in database
    const defaultOrgChartData = {
      acting_president: { name: "Puan Delima Ibrahim", photo: "/images/DelimaIbrahim.jpeg" },
      secretary: { name: "Puan Sally Jong Siew Nyuk", photo: "/images/Sally.jpg" },
      disciplinary_chair: { name: "Cik Jenny Ting Hua Hung", photo: "/images/Jenny.jpeg" },
      dev_committee_chair: { name: "Prof. Dr. Mohamad Rahizam Abdul Rahim", photo: "/images/rahizam.jpeg" },
      dev_member1: { name: "En. Thor Meng Tatt", photo: "/images/thor.jpg" },
      dev_member2: { name: "En. Mohammad @ Razali bin Ibrahim", photo: "/images/Mohammad.jpeg" },
      committee_member: { name: "Cik Choong Wai Li", photo: "/images/Waili.jpg" }
    };
    
    // Get past presidents data
    const pastPresidents = await DatabaseService.getActivePastPresidents();
    
    res.render('pages/organization-chart', { 
      session: req.session, 
      backgroundImage: backgroundImage,
      orgChartData: orgChartData || defaultOrgChartData,
      pastPresidents: pastPresidents || []
    });
  } catch (error) {
    console.error('Error loading organization chart page:', error);
    res.render('pages/organization-chart', { 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png',
      orgChartData: null,
      pastPresidents: []
    });
  }
});

// Admin Login Routes
app.get('/admin/login', (req, res) => {
  try {
    const backgroundImage = '/images/bg1.png';
    res.render('pages/login', { 
      session: req.session, 
      backgroundImage: backgroundImage,
      error: req.query.error,
      success: req.query.success
    });
  } catch (error) {
    console.error('Error loading admin login page:', error);
    res.render('pages/login', { 
      session: req.session, 
      backgroundImage: '/images/bg1.png',
      error: 'An error occurred',
      success: null
    });
  }
});

app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.redirect('/admin/login?error=Please provide both username and password');
    }

    // Find admin by username
    const admin = await DatabaseService.getAdminByUsername(username);
    
    if (!admin) {
      console.log('Admin login failed: Invalid username:', username);
      return res.redirect('/admin/login?error=Invalid username or password');
    }

    // Check if account is locked
    if (admin.isLocked) {
      console.log('Admin login failed: Account locked:', username);
      return res.redirect('/admin/login?error=Account is locked. Please contact administrator.');
    }

    // Verify password
    const isValidPassword = await admin.comparePassword(password);
    
    if (!isValidPassword) {
      // Increment login attempts
      if (admin.incLoginAttempts) {
        await admin.incLoginAttempts();
      }
      
      console.log('Admin login failed: Invalid password for:', username);
      return res.redirect('/admin/login?error=Invalid username or password');
    }

    // Reset login attempts on successful login
    if (admin.resetLoginAttempts) {
      await admin.resetLoginAttempts();
    }
    
    // Update last login
    await DatabaseService.updateAdminLastLogin(admin._id);

    // Set session - both patterns for compatibility
    req.session.isAuthenticated = true;
    req.session.adminId = admin._id;
    req.session.username = admin.username;
    req.session.admin = {
      id: admin._id,
      username: admin.username,
      email: admin.email,
      role: admin.role || 'admin'
    };

    console.log('Admin login successful:', admin.username);
    res.redirect('/admin');
  } catch (error) {
    console.error('Admin login error:', error);
    res.redirect('/admin/login?error=An error occurred during login');
  }
});

// Admin Logout
app.get('/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/admin/login');
  });
});

// Admin Dashboard
app.get('/admin', async (req, res) => {
  try {
    if (!req.session.admin) {
      return res.redirect('/admin/login');
    }

    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    
    // Get admin data
    const admin = await DatabaseService.getAdminByUsername(req.session.admin.username);
    
    // Get quick stats
    const quickStats = await DatabaseService.getSetting('homepage_quick_stats', null);
    let parsedQuickStats = null;
    if (quickStats) {
      try {
        parsedQuickStats = JSON.parse(quickStats);
      } catch (parseError) {
        console.error('Error parsing quick stats:', parseError);
      }
    }

    // Get counts for dashboard
    const tournamentCount = await DatabaseService.getTournamentCount();
    const playerCount = await DatabaseService.getPlayerCount();
    const venueCount = await DatabaseService.getVenueCount();

    res.render('pages/admin/dashboard', { 
      session: req.session, 
      backgroundImage: backgroundImage,
      admin: admin,
      quickStats: parsedQuickStats,
      tournamentCount: tournamentCount,
      playerCount: playerCount,
      venueCount: venueCount
    });
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
    res.redirect('/admin/login');
  }
});











// ===== PAST PRESIDENTS ROUTES =====

// Display Past Presidents (public route for organization chart)
app.get('/api/past-presidents', async (req, res) => {
  try {
    const pastPresidents = await DatabaseService.getActivePastPresidents();
    res.json({ success: true, pastPresidents });
  } catch (error) {
    console.error('Error fetching past presidents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Admin: Manage Past Presidents page
app.get('/admin/past-presidents', adminAuth, async (req, res) => {
  try {
    console.log('🔍 Loading admin past presidents management page...');
    
    const pastPresidents = await DatabaseService.getAllPastPresidents();
    const message = req.query.success ? 'Operation completed successfully!' : 
                   req.query.error ? 'An error occurred. Please try again.' : null;
    
    res.render('pages/admin/manage-past-presidents', { 
      title: 'Manage Past Presidents',
      pastPresidents: pastPresidents || [],
      message,
      adminUsername: req.session.adminUsername
    });
  } catch (error) {
    console.error('Error loading admin past presidents page:', error);
    res.render('pages/admin/manage-past-presidents', { 
      title: 'Manage Past Presidents',
      pastPresidents: [],
      message: 'Error loading past presidents data',
      adminUsername: req.session.adminUsername
    });
  }
});

// Admin: Create new past president
app.post('/admin/past-presidents/create', adminAuth, fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  abortOnLimit: true,
  createParentPath: true
}), async (req, res) => {
  try {
    const { name, startYear, endYear, contribution, achievements } = req.body;
    
    // Validation
    if (!name || !startYear || !endYear || !contribution) {
      return res.redirect('/admin/past-presidents?error=missing_fields');
    }
    
    let imageUrl = null;
    let imageAlt = null;
    
    // Handle image upload
    if (req.files && req.files.image) {
      try {
        const imageFile = req.files.image;
        
        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(imageFile.tempFilePath || Buffer.from(imageFile.data).toString('base64'), {
          folder: 'past_presidents',
          transformation: [
            { width: 300, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' }
          ],
          tags: ['past_president', name.toLowerCase().replace(/\s+/g, '_')]
        });
        
        imageUrl = uploadResult.secure_url;
        imageAlt = `Photo of ${name}`;
        
        console.log(`📸 Past President image uploaded: ${imageUrl}`);
      } catch (uploadError) {
        console.error('Error uploading past president image:', uploadError);
        return res.redirect('/admin/past-presidents?error=image_upload');
      }
    }
    
    // Parse achievements if provided
    let achievementsArray = [];
    if (achievements) {
      achievementsArray = achievements.split('\n').filter(a => a.trim().length > 0).map(a => a.trim());
    }
    
    const pastPresidentData = {
      name: name.trim(),
      startYear: parseInt(startYear),
      endYear: parseInt(endYear),
      contribution: contribution.trim(),
      achievements: achievementsArray,
      image: imageUrl,
      imageAlt: imageAlt,
      status: 'active',
      createdBy: req.session.adminUsername || 'admin'
    };
    
    const newPastPresident = await DatabaseService.createPastPresident(pastPresidentData);
    console.log(`✅ Past President created: ${newPastPresident.name}`);
    
    res.redirect('/admin/past-presidents?success=created');
  } catch (error) {
    console.error('Error creating past president:', error);
    res.redirect('/admin/past-presidents?error=create_failed');
  }
});

// Admin: Update past president
app.post('/admin/past-presidents/update/:id', adminAuth, fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  abortOnLimit: true,
  createParentPath: true
}), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, startYear, endYear, contribution, achievements } = req.body;
    
    // Get existing past president
    const existingPastPresident = await DatabaseService.getPastPresidentById(id);
    if (!existingPastPresident) {
      return res.redirect('/admin/past-presidents?error=not_found');
    }
    
    let imageUrl = existingPastPresident.image;
    let imageAlt = existingPastPresident.imageAlt;
    
    // Handle image upload
    if (req.files && req.files.image) {
      try {
        const imageFile = req.files.image;
        
        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(imageFile.tempFilePath || Buffer.from(imageFile.data).toString('base64'), {
          folder: 'past_presidents',
          transformation: [
            { width: 300, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto' }
          ],
          tags: ['past_president', name.toLowerCase().replace(/\s+/g, '_')]
        });
        
        imageUrl = uploadResult.secure_url;
        imageAlt = `Photo of ${name}`;
        
        console.log(`📸 Past President image updated: ${imageUrl}`);
      } catch (uploadError) {
        console.error('Error uploading past president image:', uploadError);
        return res.redirect('/admin/past-presidents?error=image_upload');
      }
    }
    
    // Parse achievements if provided
    let achievementsArray = [];
    if (achievements) {
      achievementsArray = achievements.split('\n').filter(a => a.trim().length > 0).map(a => a.trim());
    }
    
    const updateData = {
      name: name.trim(),
      startYear: parseInt(startYear),
      endYear: parseInt(endYear),
      contribution: contribution.trim(),
      achievements: achievementsArray,
      image: imageUrl,
      imageAlt: imageAlt,
      updatedBy: req.session.adminUsername || 'admin'
    };
    
    const updatedPastPresident = await DatabaseService.updatePastPresident(id, updateData);
    console.log(`✅ Past President updated: ${updatedPastPresident.name}`);
    
    res.redirect('/admin/past-presidents?success=updated');
  } catch (error) {
    console.error('Error updating past president:', error);
    res.redirect('/admin/past-presidents?error=update_failed');
  }
});

// Admin: Delete past president
app.post('/admin/past-presidents/delete/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deletedPastPresident = await DatabaseService.deletePastPresident(id);
    if (!deletedPastPresident) {
      return res.redirect('/admin/past-presidents?error=not_found');
    }
    
    console.log(`🗑️ Past President deleted: ${deletedPastPresident.name}`);
    res.redirect('/admin/past-presidents?success=deleted');
  } catch (error) {
    console.error('Error deleting past president:', error);
    res.redirect('/admin/past-presidents?error=delete_failed');
  }
});

// Admin: Toggle past president status (active/archived)
app.post('/admin/past-presidents/toggle-status/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const updatedPastPresident = await DatabaseService.togglePastPresidentStatus(id);
    if (!updatedPastPresident) {
      return res.redirect('/admin/past-presidents?error=not_found');
    }
    
    console.log(`🔄 Past President status toggled: ${updatedPastPresident.name} - ${updatedPastPresident.status}`);
    res.redirect('/admin/past-presidents?success=status_updated');
  } catch (error) {
    console.error('Error toggling past president status:', error);
    res.redirect('/admin/past-presidents?error=toggle_failed');
  }
});

// Admin: Get past president details (API endpoint for editing)
app.get('/api/admin/past-presidents/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const pastPresident = await DatabaseService.getPastPresidentById(id);
    if (!pastPresident) {
      return res.status(404).json({ success: false, error: 'Past president not found' });
    }
    
    res.json({ success: true, pastPresident });
  } catch (error) {
    console.error('Error getting past president details:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Tournament PDF Download Routes
app.get('/tournament/download-pdf', async (req, res) => {
  // Redirect to enhanced version with fallback
  res.redirect('/tournament/download-pdf-enhanced');
});

app.get('/tournament/download-pdf-enhanced', async (req, res) => {
  try {
    console.log('Enhanced PDF download requested - redirecting to print version');
    
    // For now, redirect to the print version as a fallback
    // In the future, you can implement full PDF generation with puppeteer
    res.redirect('/tournament/print-pdf');
    
  } catch (error) {
    console.error('Enhanced PDF generation error:', error);
    
    // Final fallback - redirect to print version
    if (!res.headersSent) {
      console.log('Redirecting to print version as final fallback');
      res.redirect('/tournament/print-pdf');
    }
  }
});

app.get('/tournament/download-pdf-simple', async (req, res) => {
  try {
    console.log('Simple PDF download requested - redirecting to print version');
    res.redirect('/tournament/print-pdf');
  } catch (error) {
    console.error('Simple PDF generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate PDF', 
      details: error.message 
    });
  }
});

// Tournament PDF Print Route
app.get('/tournament/print-pdf', async (req, res) => {
  try {
    console.log('Serving printable HTML version...');
    
    // Get tournaments from database
    const tournaments = await DatabaseService.getAllTournaments();
    // Define tournament types with colors (matching actual database types)
    const tournamentTypes = {
      'local': { color: 'green' },
      'state': { color: 'red' },
      'national': { color: 'blue' },
      'international': { color: 'orange' },
      'sarawak': { color: 'purple' },
      'wmalaysia': { color: 'yellow' }
    };
    
    // Format tournaments for PDF
    const formattedTournaments = tournaments.map(t => ({
      ...t.toObject(),
      color: tournamentTypes[t.type]?.color || 'green'
    }));
    
    // Render printable HTML template
    res.render('templates/tournament-pdf', { 
      tournaments: formattedTournaments 
    });
  } catch (error) {
    console.error('Print template error:', error);
    res.status(500).json({ 
      error: 'Failed to generate printable version', 
      details: error.message 
    });
  }
});

// API endpoint to check IC number availability
app.get('/api/check-ic/:icNumber', async (req, res) => {
  try {
    const icNumber = req.params.icNumber;
    console.log('🔍 IC Check API called for:', icNumber);
    
    // Validate IC number format
    const icRegex = /^[0-9]{6}-[0-9]{2}-[0-9]{4}$/;
    if (!icRegex.test(icNumber)) {
      console.log('❌ IC format invalid:', icNumber);
      return res.status(200).json({
        available: false,
        message: 'Invalid IC number format. Please use format: 123456-78-9012'
      });
    }
    
    console.log('✅ IC format valid, checking availability...');

    const availability = await DatabaseService.checkIcNumberAvailability(icNumber);
    
    let message = '';
    if (availability.available) {
      message = 'IC number is available for registration';
    } else if (availability.isPlayerRegistered) {
      message = 'This IC number is already registered as an active player';
    } else if (availability.isInRegistrationSystem) {
      message = 'This IC number already has a pending registration';
    }

    console.log('✅ IC availability check result:', {
      available: availability.available,
      message: message,
      isPlayerRegistered: availability.isPlayerRegistered,
      isInRegistrationSystem: availability.isInRegistrationSystem
    });

    res.status(200).json({
      available: availability.available,
      message: message,
      isPlayerRegistered: availability.isPlayerRegistered,
      isInRegistrationSystem: availability.isInRegistrationSystem
    });
  } catch (error) {
    console.error('❌ Error checking IC availability:', error);
    res.status(500).json({
      available: false,
      message: 'Error checking IC number availability'
    });
  }
});

// ========================
// TOURNAMENT API ENDPOINTS
// ========================

// Get all tournaments - Public API endpoint
app.get('/api/tournaments', async (req, res) => {
  try {
    // Get query parameters for filtering
    const { 
      type, 
      upcoming, 
      active, 
      limit, 
      offset,
      sortBy = 'startDate',
      sortOrder = 'asc'
    } = req.query;

    let tournaments = await DatabaseService.getAllTournaments();

    // Define tournament types with colors
    const tournamentTypes = {
      'local': { color: 'green', displayName: 'Local Tournament' },
      'state': { color: 'red', displayName: 'State Tournament' },
      'national': { color: 'blue', displayName: 'National Tournament' },
      'international': { color: 'orange', displayName: 'International Tournament' },
      'sarawak': { color: 'purple', displayName: 'Sarawak Tournament' },
      'wmalaysia': { color: 'yellow', displayName: 'West Malaysia Tournament' }
    };

    // Apply filters
    if (type) {
      tournaments = tournaments.filter(t => t.type === type);
    }

    if (upcoming === 'true') {
      const now = new Date();
      tournaments = tournaments.filter(t => t.startDate && new Date(t.startDate) > now);
    }

    if (active === 'true') {
      const now = new Date();
      tournaments = tournaments.filter(t => {
        if (!t.startDate || !t.endDate) return false;
        const start = new Date(t.startDate);
        const end = new Date(t.endDate);
        return start <= now && now <= end;
      });
    }

    // Sort tournaments
    tournaments.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name || '';
          bValue = b.name || '';
          break;
        case 'type':
          aValue = a.type || '';
          bValue = b.type || '';
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0);
          bValue = new Date(b.createdAt || 0);
          break;
        default: // startDate
          aValue = new Date(a.startDate || 0);
          bValue = new Date(b.startDate || 0);
      }

      if (sortOrder === 'desc') {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      } else {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
    });

    // Apply pagination
    const totalCount = tournaments.length;
    let paginatedTournaments = tournaments;
    
    if (limit) {
      const limitNum = parseInt(limit);
      const offsetNum = parseInt(offset) || 0;
      paginatedTournaments = tournaments.slice(offsetNum, offsetNum + limitNum);
    }

    // Format tournaments for API response
    const formattedTournaments = paginatedTournaments.map(tournament => {
      const tournamentObj = tournament.toObject ? tournament.toObject() : tournament;
      const typeInfo = tournamentTypes[tournamentObj.type] || { color: 'gray', displayName: 'Unknown' };
      
      return {
        id: tournamentObj._id,
        name: tournamentObj.name,
        type: tournamentObj.type,
        typeDisplayName: typeInfo.displayName,
        color: typeInfo.color,
        startDate: tournamentObj.startDate,
        endDate: tournamentObj.endDate,
        venue: tournamentObj.venue,
        city: tournamentObj.city,
        organizer: tournamentObj.organizer,
        personInCharge: tournamentObj.personInCharge,
        phoneNumber: tournamentObj.phoneNumber,
        description: tournamentObj.description,
        registrationOpen: tournamentObj.registrationOpen !== false, // Default to true
        months: tournamentObj.months || [],
        createdAt: tournamentObj.createdAt,
        updatedAt: tournamentObj.updatedAt,
        // Status based on dates
        status: (() => {
          if (!tournamentObj.startDate) return 'draft';
          const now = new Date();
          const start = new Date(tournamentObj.startDate);
          const end = tournamentObj.endDate ? new Date(tournamentObj.endDate) : null;
          
          if (start > now) return 'upcoming';
          if (end && now > end) return 'completed';
          return 'active';
        })()
      };
    });

    // Response with metadata
    res.json({
      success: true,
      data: formattedTournaments,
      meta: {
        total: totalCount,
        count: formattedTournaments.length,
        offset: parseInt(offset) || 0,
        limit: limit ? parseInt(limit) : null,
        hasMore: limit ? (parseInt(offset) || 0) + parseInt(limit) < totalCount : false
      },
      filters: {
        availableTypes: Object.keys(tournamentTypes),
        typeDefinitions: tournamentTypes
      }
    });

  } catch (error) {
    console.error('Tournament API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tournaments',
      message: error.message
    });
  }
});

// Get upcoming tournaments - Public API endpoint (MUST be before /:id route)
app.get('/api/tournaments/upcoming', async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const tournaments = await DatabaseService.getAllTournaments();
    
    const now = new Date();
    const upcomingTournaments = tournaments
      .filter(t => t.startDate && new Date(t.startDate) > now)
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
      .slice(0, parseInt(limit));

    const tournamentTypes = {
      'local': { color: 'green', displayName: 'Local Tournament' },
      'state': { color: 'red', displayName: 'State Tournament' },
      'national': { color: 'blue', displayName: 'National Tournament' },
      'international': { color: 'orange', displayName: 'International Tournament' },
      'sarawak': { color: 'purple', displayName: 'Sarawak Tournament' },
      'wmalaysia': { color: 'yellow', displayName: 'West Malaysia Tournament' }
    };

    const formattedTournaments = upcomingTournaments.map(tournament => {
      const tournamentObj = tournament.toObject();
      const typeInfo = tournamentTypes[tournamentObj.type] || { color: 'gray', displayName: 'Unknown' };
      
      return {
        id: tournamentObj._id,
        name: tournamentObj.name,
        type: tournamentObj.type,
        typeDisplayName: typeInfo.displayName,
        color: typeInfo.color,
        startDate: tournamentObj.startDate,
        endDate: tournamentObj.endDate,
        venue: tournamentObj.venue,
        city: tournamentObj.city,
        organizer: tournamentObj.organizer,
        registrationOpen: tournamentObj.registrationOpen !== false,
        status: 'upcoming'
      };
    });

    res.json({
      success: true,
      data: formattedTournaments,
      meta: {
        total: formattedTournaments.length,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Upcoming tournaments API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upcoming tournaments',
      message: error.message
    });
  }
});

// Get single tournament by ID - Public API endpoint
app.get('/api/tournaments/:id', async (req, res) => {
  try {
    const tournament = await DatabaseService.getTournamentById(req.params.id);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        error: 'Tournament not found'
      });
    }

    const tournamentTypes = {
      'local': { color: 'green', displayName: 'Local Tournament' },
      'state': { color: 'red', displayName: 'State Tournament' },
      'national': { color: 'blue', displayName: 'National Tournament' },
      'international': { color: 'orange', displayName: 'International Tournament' },
      'sarawak': { color: 'purple', displayName: 'Sarawak Tournament' },
      'wmalaysia': { color: 'yellow', displayName: 'West Malaysia Tournament' }
    };

    const tournamentObj = tournament.toObject();
    const typeInfo = tournamentTypes[tournamentObj.type] || { color: 'gray', displayName: 'Unknown' };

    // Calculate status
    const status = (() => {
      if (!tournamentObj.startDate) return 'draft';
      const now = new Date();
      const start = new Date(tournamentObj.startDate);
      const end = tournamentObj.endDate ? new Date(tournamentObj.endDate) : null;
      
      if (start > now) return 'upcoming';
      if (end && now > end) return 'completed';
      return 'active';
    })();

    res.json({
      success: true,
      data: {
        id: tournamentObj._id,
        name: tournamentObj.name,
        type: tournamentObj.type,
        typeDisplayName: typeInfo.displayName,
        color: typeInfo.color,
        startDate: tournamentObj.startDate,
        endDate: tournamentObj.endDate,
        venue: tournamentObj.venue,
        city: tournamentObj.city,
        organizer: tournamentObj.organizer,
        personInCharge: tournamentObj.personInCharge,
        phoneNumber: tournamentObj.phoneNumber,
        description: tournamentObj.description,
        registrationOpen: tournamentObj.registrationOpen !== false,
        months: tournamentObj.months || [],
        status: status,
        createdAt: tournamentObj.createdAt,
        updatedAt: tournamentObj.updatedAt,
        version: tournamentObj.version
      }
    });

  } catch (error) {
    console.error('Tournament API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch tournament',
      message: error.message
    });
  }
});

// API endpoint to check for conflicts before updates
app.get('/api/admin/check-conflicts/:type/:id', adminAuth, async (req, res) => {
  try {
    const { type, id } = req.params;
    const { version } = req.query;

    let result = { hasConflict: false, currentData: null };

    if (type === 'tournament') {
      const tournament = await DatabaseService.getTournamentById(id);
      if (!tournament) {
        return res.status(404).json({ error: 'Tournament not found' });
      }

      if (version && parseInt(version) !== tournament.version) {
        result.hasConflict = true;
        result.conflictInfo = {
          lastModifiedBy: tournament.lastModifiedBy,
          lastModifiedAt: tournament.updatedAt,
          currentVersion: tournament.version
        };
      }
      result.currentData = tournament;
    }

    res.json(result);
  } catch (error) {
    console.error('Error checking conflicts:', error);
    res.status(500).json({ error: 'Failed to check conflicts' });
  }
});

// API endpoint to get current admin activity
app.get('/api/admin/activity', adminAuth, async (req, res) => {
  try {
    // This would typically come from a session store or Redis
    // For now, return basic info
    res.json({
      activeAdmins: [
        {
          username: req.session.username,
          lastActivity: new Date(),
          currentPage: req.headers.referer || 'dashboard'
        }
      ],
      totalSessions: 1 // In production, count active sessions
    });
  } catch (error) {
    console.error('Error getting admin activity:', error);
    res.status(500).json({ error: 'Failed to get activity data' });
  }
});

// PDF Generation Route for Pending Registrations
app.get('/admin/players/pdf', adminAuth, async (req, res) => {
  try {
    console.log('Starting PDF generation...');
    const pendingRegistrations = await DatabaseService.getPendingPlayerRegistrations();
    console.log(`Found ${pendingRegistrations.length} pending registrations`);
    
    // Generate HTML content for PDF
    const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Pending Player Registrations Report</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px;
          font-size: 12px;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #333;
          padding-bottom: 15px;
        }
        .header h1 {
          margin: 0;
          color: #333;
          font-size: 24px;
        }
        .header p {
          margin: 5px 0;
          color: #666;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
          vertical-align: top;
        }
        th {
          background-color: #f5f5f5;
          font-weight: bold;
          text-align: center;
        }
        .no-data {
          text-align: center;
          padding: 40px;
          color: #666;
          font-style: italic;
        }
        .footer {
          margin-top: 30px;
          border-top: 1px solid #ddd;
          padding-top: 15px;
          font-size: 10px;
          color: #666;
        }
        .approval-section {
          margin-top: 40px;
          border: 1px solid #ddd;
          padding: 15px;
          background-color: #f9f9f9;
        }
        .approval-section h3 {
          margin-top: 0;
          color: #333;
        }
        .approval-fields {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-top: 15px;
        }
        .approval-field {
          flex: 1;
          min-width: 200px;
        }
        .approval-field label {
          display: block;
          font-weight: bold;
          margin-bottom: 5px;
        }
        .approval-field .line {
          border-bottom: 1px solid #333;
          height: 20px;
          min-width: 150px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Malaysia Pickleball Association</h1>
        <p>Pending Player Registrations Report</p>
        <p>Generated on: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}</p>
        <p>Total Pending Registrations: ${pendingRegistrations.length}</p>
      </div>

      ${pendingRegistrations.length === 0 ? `
        <div class="no-data">
          <h3>No Pending Registrations</h3>
          <p>All player registrations have been processed.</p>
        </div>
      ` : `
        <table>
          <thead>
            <tr>
              <th style="width: 5%;">No.</th>
              <th style="width: 25%;">Full Name</th>
              <th style="width: 15%;">IC Number</th>
              <th style="width: 8%;">Age</th>
              <th style="width: 15%;">Phone</th>
              <th style="width: 20%;">Email</th>
              <th style="width: 12%;">Submitted Date</th>
            </tr>
          </thead>
          <tbody>
            ${pendingRegistrations.map((registration, index) => `
              <tr>
                <td style="text-align: center;">${index + 1}</td>
                <td><strong>${registration.fullName || 'N/A'}</strong></td>
                <td>${registration.icNumber || 'N/A'}</td>
                <td style="text-align: center;">${registration.age || 'N/A'}</td>
                <td>${registration.phoneNumber || 'N/A'}</td>
                <td style="font-size: 10px;">${registration.email || 'N/A'}</td>
                <td style="text-align: center;">${registration.submittedAt ? new Date(registration.submittedAt).toLocaleDateString('en-GB') : 'N/A'}</td>
              </tr>
              <tr>
                <td></td>
                <td colspan="6" style="font-size: 10px; color: #666; padding-left: 15px;">
                  <strong>Username:</strong> ${registration.username || 'N/A'} | 
                  <strong>Address:</strong> ${registration.address || 'N/A'}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}

      <div class="approval-section">
        <h3>Approval Section</h3>
        <table style="margin-top: 0;">
          <thead>
            <tr>
              <th style="width: 5%;">No.</th>
              <th style="width: 35%;">List Name Pending Registration</th>
              <th style="width: 15%;">Accept</th>
              <th style="width: 15%;">Reject</th>
              <th style="width: 30%;">Remark</th>
            </tr>
          </thead>
          <tbody>
            ${Array.from({length: Math.max(5, pendingRegistrations.length)}, (_, i) => `
              <tr style="height: 40px;">
                <td style="text-align: center;">${i < pendingRegistrations.length ? i + 1 : ''}</td>
                <td>${i < pendingRegistrations.length ? (pendingRegistrations[i].fullName || '') : ''}</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="approval-fields">
          <div class="approval-field">
            <label>Approve By:</label>
            <div class="line"></div>
          </div>
          <div class="approval-field">
            <label>Sign:</label>
            <div class="line"></div>
          </div>
          <div class="approval-field">
            <label>Name:</label>
            <div class="line"></div>
          </div>
          <div class="approval-field">
            <label>Position:</label>
            <div class="line"></div>
          </div>
          <div class="approval-field">
            <label>Date:</label>
            <div class="line"></div>
          </div>
        </div>
      </div>

      <div class="footer">
        <p>This report was generated automatically by the Malaysia Pickleball Association Management System.</p>
        <p>For any queries, please contact the administration team.</p>
      </div>
    </body>
    </html>
    `;

    console.log('Generating PDF with html-pdf...');
    
    // PDF generation options
    const options = {
      format: 'A4',
      orientation: 'portrait',
      border: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      },
      timeout: 30000
    };

    // Generate PDF using html-pdf (more reliable on Windows)
    pdf.create(htmlContent, options).toBuffer((err, buffer) => {
      if (err) {
        console.error('Error generating PDF:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to generate PDF report: ' + err.message 
        });
      }

      console.log('PDF generated successfully, size:', buffer.length);

      // Set response headers for PDF download
      const filename = `Pending_Registrations_${new Date().toISOString().split('T')[0]}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', buffer.length);
      
      res.send(buffer);
    });

  } catch (error) {
    console.error('Error in PDF generation route:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to generate PDF report: ' + error.message 
    });
  }
});

// Fallback HTML Report Route (printable version)
app.get('/admin/players/report', adminAuth, async (req, res) => {
  try {
    const pendingRegistrations = await DatabaseService.getPendingPlayerRegistrations();
    
    res.render('pages/admin/players-report', {
      pendingRegistrations,
      generatedAt: new Date(),
      session: req.session
    });
  } catch (error) {
    console.error('Error generating HTML report:', error);
    res.status(500).send('Failed to generate report');
  }
});

// Admin Settings Routes
app.get('/admin/settings', adminAuth, async (req, res) => {
  try {
    const admin = await DatabaseService.getAdminByUsername(req.session.username);
    
    // Get pending admin count for super admins
    let pendingCount = 0;
    if (admin.role === 'super_admin') {
      const pendingAdmins = await DatabaseService.getAllPendingAdmins();
      pendingCount = pendingAdmins.length;
    }
    
    res.render('pages/admin/admin-settings', {
      admin: admin,
      session: req.session,
      success: req.query.success,
      error: req.query.error,
      pendingCount: pendingCount
    });
  } catch (error) {
    console.error('Admin settings page error:', error);
    res.redirect('/admin/dashboard?error=settings_failed');
  }
});

app.post('/admin/settings/change-username', adminAuth, [
  body('newUsername')
    .notEmpty()
    .withMessage('New username is required')
    .trim()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3-30 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ success: false, message: errors.array()[0].msg });
  }

  const { newUsername, currentPassword } = req.body;

  try {
    await DatabaseService.updateAdminUsername(req.session.adminId, newUsername, currentPassword);
    
    // Log security event
    console.log(`Admin username changed: ${req.session.username} -> ${newUsername} from IP: ${req.ip}`);
    
    res.json({ success: true, message: 'Username updated successfully' });
  } catch (error) {
    console.error('Change username error:', error);
    res.json({ success: false, message: error.message });
  }
});

app.post('/admin/settings/change-password', adminAuth, [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ success: false, message: errors.array()[0].msg });
  }

  const { currentPassword, newPassword } = req.body;

  try {
    await DatabaseService.updateAdminPassword(req.session.adminId, currentPassword, newPassword);
    
    // Log security event
    console.log(`Admin password changed for: ${req.session.username} from IP: ${req.ip}`);
    
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.json({ success: false, message: error.message });
  }
});

app.post('/admin/settings/update-profile', adminAuth, [
  body('email')
    .optional()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('fullName')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Full name cannot exceed 100 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ success: false, message: errors.array()[0].msg });
  }

  const { fullName, email } = req.body;

  try {
    await DatabaseService.updateAdminProfile(req.session.adminId, { fullName, email });
    
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.json({ success: false, message: error.message });
  }
});

// Admin Registration Routes (Only accessible by any admin, but approval requires super_admin)
app.post('/admin/settings/register-admin', adminAuth, [
  body('username')
    .notEmpty()
    .withMessage('Username is required')
    .isLength({ min: 3 })
    .withMessage('Username must be at least 3 characters'),
  body('fullName')
    .notEmpty()
    .withMessage('Full name is required'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters'),
  body('role')
    .isIn(['admin', 'moderator'])
    .withMessage('Invalid role selected')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ success: false, message: errors.array()[0].msg });
  }

  const { username, fullName, email, password, role, permissions, reason } = req.body;

  try {
    await DatabaseService.createPendingAdmin(
      { username, fullName, email, password, role, permissions, reason },
      req.session.adminId,
      req.session.username
    );
    
    console.log(`New admin registration submitted by ${req.session.username} for user ${username}`);
    
    res.json({ success: true, message: 'Admin registration submitted successfully' });
  } catch (error) {
    console.error('Register admin error:', error);
    res.json({ success: false, message: error.message });
  }
});

// Get pending admin registrations (Super Admin only)
app.get('/admin/settings/pending-admins', adminAuth, async (req, res) => {
  try {
    const admin = await DatabaseService.getAdminByUsername(req.session.username);
    
    if (admin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied. Super Admin role required.' });
    }
    
    const pendingAdmins = await DatabaseService.getAllPendingAdmins();
    res.json(pendingAdmins);
  } catch (error) {
    console.error('Get pending admins error:', error);
    res.status(500).json({ error: 'Failed to load pending admin registrations' });
  }
});

// Approve pending admin (Super Admin only)
app.post('/admin/settings/approve-admin/:id', adminAuth, async (req, res) => {
  try {
    const admin = await DatabaseService.getAdminByUsername(req.session.username);
    
    if (admin.role !== 'super_admin') {
      return res.json({ success: false, message: 'Access denied. Super Admin role required.' });
    }
    
    await DatabaseService.approvePendingAdmin(req.params.id, req.session.adminId);
    
    console.log(`Admin registration approved by ${req.session.username} for pending admin ID: ${req.params.id}`);
    
    res.json({ success: true, message: 'Admin registration approved successfully' });
  } catch (error) {
    console.error('Approve admin error:', error);
    res.json({ success: false, message: error.message });
  }
});

// Reject pending admin (Super Admin only)
app.post('/admin/settings/reject-admin/:id', adminAuth, async (req, res) => {
  try {
    const admin = await DatabaseService.getAdminByUsername(req.session.username);
    
    if (admin.role !== 'super_admin') {
      return res.json({ success: false, message: 'Access denied. Super Admin role required.' });
    }
    
    const { reason } = req.body;
    await DatabaseService.rejectPendingAdmin(req.params.id, req.session.adminId, reason);
    
    console.log(`Admin registration rejected by ${req.session.username} for pending admin ID: ${req.params.id}`);
    
    res.json({ success: true, message: 'Admin registration rejected' });
  } catch (error) {
    console.error('Reject admin error:', error);
    res.json({ success: false, message: error.message });
  }
});

// Portal API Configuration Routes
let apiConfig = {
  portalUrl: 'http://localhost:5001/api',
  apiKey: '',
  timeout: 10
};

// Get current API configuration
app.get('/admin/settings/api-config', adminAuth, (req, res) => {
  res.json(apiConfig);
});

// Get API connection status
app.get('/admin/settings/api-status', adminAuth, async (req, res) => {
  try {
    const axios = require('axios');
    const response = await axios.get(`${apiConfig.portalUrl}/health`, {
      timeout: apiConfig.timeout * 1000,
      headers: apiConfig.apiKey ? { 'Authorization': `Bearer ${apiConfig.apiKey}` } : {}
    });
    
    res.json({
      connected: response.status === 200,
      portalUrl: apiConfig.portalUrl
    });
  } catch (error) {
    res.json({
      connected: false,
      portalUrl: apiConfig.portalUrl,
      error: error.message
    });
  }
});

// Test API connection
app.post('/admin/settings/test-api-connection', adminAuth, async (req, res) => {
  try {
    const { portalUrl, apiKey, timeout } = req.body;
    const axios = require('axios');
    
    const response = await axios.get(`${portalUrl}/health`, {
      timeout: (timeout || 10) * 1000,
      headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
    });
    
    res.json({
      success: true,
      status: response.status,
      data: response.data
    });
  } catch (error) {
    res.json({
      success: false,
      error: error.message
    });
  }
});

// Save API configuration
app.post('/admin/settings/save-api-config', adminAuth, (req, res) => {
  try {
    const { portalUrl, apiKey, timeout } = req.body;
    
    // Validate inputs
    if (!portalUrl) {
      return res.json({ success: false, message: 'Portal URL is required' });
    }
    
    // Update configuration
    apiConfig = {
      portalUrl: portalUrl.trim(),
      apiKey: apiKey ? apiKey.trim() : '',
      timeout: timeout || 10
    };
    
    console.log('🔧 API Configuration updated:', {
      portalUrl: apiConfig.portalUrl,
      hasApiKey: !!apiConfig.apiKey,
      timeout: apiConfig.timeout
    });
    
    res.json({ success: true, message: 'API configuration saved successfully' });
  } catch (error) {
    console.error('Save API config error:', error);
    res.json({ success: false, message: error.message });
  }
});

// Training Events API Routes
app.get('/api/training/events', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Default to current month if no dates provided
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
    
    const Course = require('./models/Course');
    const Clinic = require('./models/Clinic');
    
    // Get courses and clinics in the date range
    const courses = await Course.findByDateRange(start, end);
    const clinics = await Clinic.findByDateRange(start, end);
    
    // Create a map of dates with their events
    const events = {};
    
    // Process courses
    courses.forEach(course => {
      course.schedule.forEach(session => {
        const dateKey = session.date.toISOString().split('T')[0];
        if (!events[dateKey]) {
          events[dateKey] = { courses: [], clinics: [] };
        }
        events[dateKey].courses.push({
          id: course._id,
          title: course.title,
          level: course.level,
          levelRange: course.levelRange,
          startTime: session.startTime,
          endTime: session.endTime,
          duration: session.duration,
          instructor: course.instructor.name,
          venue: course.venue.name,
          availableSpots: course.availableSpots,
          price: course.price
        });
      });
    });
    
    // Process clinics
    clinics.forEach(clinic => {
      const dateKey = clinic.date.toISOString().split('T')[0];
      if (!events[dateKey]) {
        events[dateKey] = { courses: [], clinics: [] };
      }
      events[dateKey].clinics.push({
        id: clinic._id,
        title: clinic.title,
        type: clinic.type,
        level: clinic.level,
        levelRange: clinic.levelRange,
        startTime: clinic.startTime,
        endTime: clinic.endTime,
        duration: clinic.duration,
        instructor: clinic.instructor.name,
        venue: clinic.venue.name,
        availableSpots: clinic.availableSpots,
        price: clinic.price,
        dropInAllowed: clinic.dropInAllowed
      });
    });
    
    res.json({ success: true, events });
  } catch (error) {
    console.error('❌ Error fetching training events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch training events' });
  }
});

// Get specific course details
app.get('/api/training/courses/:id', async (req, res) => {
  try {
    const Course = require('./models/Course');
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }
    
    res.json({ success: true, course });
  } catch (error) {
    console.error('❌ Error fetching course:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch course details' });
  }
});

// Get specific clinic details
app.get('/api/training/clinics/:id', async (req, res) => {
  try {
    const Clinic = require('./models/Clinic');
    const clinic = await Clinic.findById(req.params.id);
    
    if (!clinic) {
      return res.status(404).json({ success: false, message: 'Clinic not found' });
    }
    
    res.json({ success: true, clinic });
  } catch (error) {
    console.error('❌ Error fetching clinic:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch clinic details' });
  }
});

// Admin API to create course
app.post('/api/admin/training/courses', adminAuth, async (req, res) => {
  try {
    const Course = require('./models/Course');
    const courseData = { ...req.body, createdBy: req.session.user.id };
    const course = new Course(courseData);
    await course.save();
    
    res.json({ success: true, course, message: 'Course created successfully' });
  } catch (error) {
    console.error('❌ Error creating course:', error);
    res.status(500).json({ success: false, message: 'Failed to create course' });
  }
});

// Admin API to create clinic
app.post('/api/admin/training/clinics', adminAuth, async (req, res) => {
  try {
    const Clinic = require('./models/Clinic');
    const clinicData = { ...req.body, createdBy: req.session.user.id };
    const clinic = new Clinic(clinicData);
    await clinic.save();
    
    res.json({ success: true, clinic, message: 'Clinic created successfully' });
  } catch (error) {
    console.error('❌ Error creating clinic:', error);
    res.status(500).json({ success: false, message: 'Failed to create clinic' });
  }
});

// API routes already added at the top of the file
console.log('✅ API routes enabled at /api endpoint');


// Unregistered Players Management Routes
app.get('/admin/unregistered-players', adminAuth, async (req, res) => {
  try {
    res.render('pages/admin/manage-unregistered-players', { 
      session: req.session 
    });
  } catch (error) {
    console.error('Error loading unregistered players admin page:', error);
    res.render('pages/admin/manage-unregistered-players', { 
      session: req.session,
      error: 'Failed to load unregistered players management page' 
    });
  }
});

// Server startup moved to bottom of file with proper database initialization

module.exports = app; 

// ========================
// NEWS MANAGEMENT ROUTES
// ========================

// Public News Routes
app.get('/news', async (req, res) => {
  try {
    const news = await DatabaseService.getPublishedNews();
    const featuredNews = await DatabaseService.getFeaturedNews();
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    
    res.render('pages/news', {
      news,
      featuredNews,
      session: req.session,
      backgroundImage
    });
  } catch (error) {
    console.error('News page error:', error);
    res.render('pages/news', {
      news: [],
      featuredNews: [],
      session: req.session,
      backgroundImage: '/images/defaultbg.png'
    });
  }
});

// View Single News Article
app.get('/news/:id', async (req, res) => {
  try {
    const news = await DatabaseService.getNewsById(req.params.id);
    if (!news || news.status !== 'published') {
      return res.status(404).render('pages/404', {
        session: req.session,
        backgroundImage: await DatabaseService.getSetting('background_image', '/images/defaultbg.png')
      });
    }

    // Increment view count
    await DatabaseService.incrementNewsViews(req.params.id);

    // Get related news
    const relatedNews = await DatabaseService.getNewsByCategory(news.category);
    const filteredRelatedNews = relatedNews.filter(n => n._id.toString() !== news._id.toString()).slice(0, 3);

    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');

    // Construct base URL for social sharing
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const articleUrl = `${baseUrl}/news/${news._id}`;

    res.render('pages/news-detail', {
      news,
      relatedNews: filteredRelatedNews,
      session: req.session,
      backgroundImage,
      baseUrl,
      articleUrl
    });
  } catch (error) {
    console.error('News detail error:', error);
    res.status(500).render('pages/404', {
      session: req.session,
      backgroundImage: '/images/defaultbg.png'
    });
  }
});

// API endpoint for latest news (for homepage)
app.get('/api/news/latest', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const news = await DatabaseService.getLatestNews(limit);
    
    res.json({
      success: true,
      news
    });
  } catch (error) {
    console.error('Latest news API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest news'
    });
  }
});

// Admin News Management Routes
app.get('/admin/news', adminAuth, async (req, res) => {
  try {
    const news = await DatabaseService.getAllNews();
    res.render('pages/admin/manage-news', {
      news,
      session: req.session
    });
  } catch (error) {
    console.error('Manage news page error:', error);
    res.render('pages/admin/manage-news', {
      news: [],
      session: req.session
    });
  }
});

// Create News
app.post('/admin/news/create', adminAuth, [
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('summary').notEmpty().trim().isLength({ max: 300 }).withMessage('Summary is required and must be under 300 characters'),
  body('content').notEmpty().trim().withMessage('Content is required'),
  body('category').isIn(['tournament', 'announcement', 'general', 'achievement', 'event']).withMessage('Valid category is required'),
  body('status').isIn(['draft', 'published', 'archived']).withMessage('Valid status is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const { title, summary, content, category, status, tags, featured } = req.body;
    const author = req.session.username || 'Admin';
    const createdBy = req.session.username || 'admin';

    // Handle file upload if present
    let featuredImage = null;
    let featuredVideo = null;
    let mediaType = 'none';

    if (req.files && req.files.mediaFile) {
      const mediaFile = req.files.mediaFile;

      try {
        const cloudinaryResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              public_id: `news_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              folder: 'news',
              resource_type: mediaFile.mimetype.startsWith('video/') ? 'video' : 'image',
              transformation: mediaFile.mimetype.startsWith('image/') ? [
                { width: 1200, height: 800, crop: 'limit' },
                { quality: 'auto:good' },
                { format: 'auto' }
              ] : [
                { quality: 'auto:good' }
              ],
              tags: ['news_media']
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(mediaFile.data);
        });

        if (mediaFile.mimetype.startsWith('image/')) {
          featuredImage = cloudinaryResult.secure_url;
          mediaType = 'image';
        } else if (mediaFile.mimetype.startsWith('video/')) {
          featuredVideo = cloudinaryResult.secure_url;
          mediaType = 'video';
        }
      } catch (error) {
        console.error('Failed to upload news media to Cloudinary:', error);
        throw error;
      }
    }

    // Process tags
    const tagArray = tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [];

    const newsData = {
      title,
      summary,
      content,
      author,
      category,
      status,
      featuredImage,
      featuredVideo,
      mediaType,
      tags: tagArray,
      featured: featured === 'on' || featured === true,
      createdBy
    };

    const news = await DatabaseService.createNews(newsData);

    res.json({
      success: true,
      message: 'News article created successfully',
      news
    });

  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create news article'
    });
  }
});

// Update News
app.put('/admin/news/:id', adminAuth, [
  body('title').notEmpty().trim().withMessage('Title is required'),
  body('summary').notEmpty().trim().isLength({ max: 300 }).withMessage('Summary is required and must be under 300 characters'),
  body('content').notEmpty().trim().withMessage('Content is required'),
  body('category').isIn(['tournament', 'announcement', 'general', 'achievement', 'event']).withMessage('Valid category is required'),
  body('status').isIn(['draft', 'published', 'archived']).withMessage('Valid status is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  try {
    const { title, summary, content, category, status, tags, featured } = req.body;
    const updatedBy = req.session.username || 'admin';

    let updateData = {
      title,
      summary,
      content,
      category,
      status,
      tags: tags ? tags.split(',').map(tag => tag.trim()).filter(tag => tag) : [],
      featured: featured === 'on' || featured === true,
      updatedBy
    };

    // Handle file upload if present
    if (req.files && req.files.mediaFile) {
      const mediaFile = req.files.mediaFile;

      try {
        const cloudinaryResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              public_id: `news_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              folder: 'news',
              resource_type: mediaFile.mimetype.startsWith('video/') ? 'video' : 'image',
              transformation: mediaFile.mimetype.startsWith('image/') ? [
                { width: 1200, height: 800, crop: 'limit' },
                { quality: 'auto:good' },
                { format: 'auto' }
              ] : [
                { quality: 'auto:good' }
              ],
              tags: ['news_media', 'update']
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(mediaFile.data);
        });

        if (mediaFile.mimetype.startsWith('image/')) {
          updateData.featuredImage = cloudinaryResult.secure_url;
          updateData.featuredVideo = null;
          updateData.mediaType = 'image';
        } else if (mediaFile.mimetype.startsWith('video/')) {
          updateData.featuredVideo = cloudinaryResult.secure_url;
          updateData.featuredImage = null;
          updateData.mediaType = 'video';
        }
      } catch (error) {
        console.error('Failed to upload news media update to Cloudinary:', error);
        throw error;
      }
    }

    const news = await DatabaseService.updateNews(req.params.id, updateData);

    res.json({
      success: true,
      message: 'News article updated successfully',
      news
    });

  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update news article'
    });
  }
});

// Delete News
app.delete('/admin/news/:id', adminAuth, async (req, res) => {
  try {
    await DatabaseService.deleteNews(req.params.id);
    res.json({
      success: true,
      message: 'News article deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete news article'
    });
  }
});

// Get News by ID (for editing)
app.get('/admin/news/:id', adminAuth, async (req, res) => {
  try {
    const news = await DatabaseService.getNewsById(req.params.id);
    if (!news) {
      return res.status(404).json({
        success: false,
        message: 'News article not found'
      });
    }
    res.json({
      success: true,
      news
    });
  } catch (error) {
    console.error('Error getting news:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get news article'
    });
  }
});



// Add Tournament Announcement (GET)
app.get('/sarawak-admin-add-announcement', sarawakAdminAuth, (req, res) => {
  res.render('pages/sarawak-admin-add-announcement', { session: req.session, admin: req.session.sarawakAdmin });
});

// Add Tournament Announcement (POST)
app.post('/sarawak-admin-add-announcement', sarawakAdminAuth, async (req, res) => {
  try {
    const { title, startDate, endDate, registrationDeadline, status, homepageLink, content, venue, cityState, organizer, personInCharge, phoneNumber } = req.body;
    const publishedBy = req.session.sarawakAdmin?.username || 'sarawak_admin';
    const publishedByName = req.session.sarawakAdmin?.name || 'Sarawak Admin';
    const announcementData = {
      title,
      content,
      type: 'event',
      isActive: status === 'Published',
      publishedAt: new Date(),
      publishedBy,
      publishedByName,
      metadata: {
        link: homepageLink === 'Linked' ? 'homepage' : '',
        startDate,
        endDate,
        registrationDeadline,
        venue,
        cityState,
        organizer,
        personInCharge,
        phoneNumber
      },
      targetAudience: 'all',
    };
    await DatabaseService.createAnnouncement(announcementData);
    res.redirect('/sarawak-admin-dashboard');
  } catch (error) {
    console.error('Error adding tournament announcement:', error);
    res.redirect('/sarawak-admin-dashboard?error=add_announcement');
  }
});

// Edit Tournament Announcement (GET)
app.get('/sarawak-admin-edit-announcement/:id', sarawakAdminAuth, async (req, res) => {
  try {
    const Announcement = require('./models/Announcement');
    const announcement = await Announcement.findById(req.params.id);
    if (!announcement) return res.redirect('/sarawak-admin-dashboard?error=notfound');
    res.render('pages/sarawak-admin-edit-announcement', { announcement, session: req.session, admin: req.session.sarawakAdmin });
  } catch (error) {
    console.error('Error loading edit announcement page:', error);
    res.redirect('/sarawak-admin-dashboard?error=edit_load');
  }
});

// Edit Tournament Announcement (POST)
app.post('/sarawak-admin-edit-announcement/:id', sarawakAdminAuth, async (req, res) => {
  try {
    const Announcement = require('./models/Announcement');
    const { title, startDate, endDate, registrationDeadline, status, homepageLink, content, venue, cityState, organizer, personInCharge, phoneNumber } = req.body;
    const update = {
      title,
      content,
      isActive: status === 'Published',
      metadata: {
        link: homepageLink === 'Linked' ? 'homepage' : '',
        startDate,
        endDate,
        registrationDeadline,
        venue,
        cityState,
        organizer,
        personInCharge,
        phoneNumber
      }
    };
    await Announcement.findByIdAndUpdate(req.params.id, update);
    res.redirect('/sarawak-admin-dashboard');
  } catch (error) {
    console.error('Error editing tournament announcement:', error);
    res.redirect('/sarawak-admin-dashboard?error=edit_announcement');
  }
});

// Delete Tournament Announcement (POST)
app.post('/sarawak-admin-delete-announcement/:id', sarawakAdminAuth, async (req, res) => {
  try {
    const Announcement = require('./models/Announcement');
    await Announcement.findByIdAndDelete(req.params.id);
    if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.json({ success: true });
    }
    res.redirect('/sarawak-admin-dashboard');
  } catch (error) {
    console.error('Error deleting tournament announcement:', error);
    if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest') {
      return res.json({ success: false });
    }
    res.redirect('/sarawak-admin-dashboard?error=delete_announcement');
  }
});

// Tournament Notice API Routes

// Get all tournament notices (for admin)
app.get('/admin/tournament-notices', adminAuth, async (req, res) => {
  try {
    const notices = await DatabaseService.getAllTournamentNotices();
    res.json({ success: true, notices });
  } catch (error) {
    console.error('Error getting tournament notices:', error);
    res.status(500).json({ success: false, message: 'Failed to get tournament notices' });
  }
});

// Get active tournament notices (for public)
app.get('/api/tournament-notices', async (req, res) => {
  try {
    const notices = await DatabaseService.getActiveTournamentNotices();
    res.json({ success: true, notices });
  } catch (error) {
    console.error('Error getting active tournament notices:', error);
    res.status(500).json({ success: false, message: 'Failed to get tournament notices' });
  }
});


// Get organisers data from portal and tournaments
app.get('/api/admin/organisers', adminAuth, async (req, res) => {
  try {
    // Get all tournaments to extract organiser information
    const tournaments = await Tournament.find({}, 'name organizer personInCharge phoneNumber contactEmail portalApplicationId managedByPortal createdAt updatedAt').sort({ updatedAt: -1 });
    
    // Extract unique organisers from tournament data
    const organiserMap = new Map();
    
    tournaments.forEach(tournament => {
      // Check both organizer and personInCharge fields
      const organiserName = tournament.organizer || tournament.personInCharge;
      
      if (organiserName) {
        const key = organiserName.toLowerCase();
        
        
        if (!organiserMap.has(key)) {
          organiserMap.set(key, {
            name: organiserName,
            organization: tournament.organizer || organiserName,
            email: tournament.contactEmail || null,
            phone: tournament.phoneNumber || null,
            portalId: tournament.portalApplicationId || null,
            isActive: true,
            tournamentsCount: 1,
            lastActive: tournament.updatedAt || tournament.createdAt,
            createdAt: tournament.createdAt,
            source: tournament.managedByPortal ? 'portal' : 'local'
          });
        } else {
          // Update existing organiser data
          const existing = organiserMap.get(key);
          existing.tournamentsCount += 1;
          
          // Update with more recent data if available
          if (tournament.updatedAt > new Date(existing.lastActive)) {
            existing.lastActive = tournament.updatedAt;
            if (tournament.contactEmail && !existing.email) {
              existing.email = tournament.contactEmail;
            }
            if (tournament.phoneNumber && !existing.phone) {
              existing.phone = tournament.phoneNumber;
            }
          }
        }
      }
    });
    
    // Convert map to array and add additional info
    const organisers = Array.from(organiserMap.values()).map(organiser => {
      // Determine if organiser is active (has activity in last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      organiser.isActive = new Date(organiser.lastActive) > sixMonthsAgo;
      
      return organiser;
    });
    
    // Sort by most recent activity
    organisers.sort((a, b) => new Date(b.lastActive) - new Date(a.lastActive));
    
    
    res.json({
      success: true,
      organisers: organisers,
      totalCount: organisers.length,
      activeCount: organisers.filter(o => o.isActive).length,
      portalCount: organisers.filter(o => o.source === 'portal').length
    });
    
  } catch (error) {
    console.error('Error getting organisers data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get organisers data',
      error: error.message 
    });
  }
});

// Test endpoint to verify automatic notice generation
app.post('/api/test/tournament-notices', adminAuth, async (req, res) => {
  try {
    const { action, tournamentId, testData } = req.body;
    
    if (!action || !tournamentId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Action and tournamentId are required' 
      });
    }

    const TournamentNoticeService = require('./services/tournamentNoticeService');
    const Tournament = require('./models/Tournament');
    
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ 
        success: false, 
        message: 'Tournament not found' 
      });
    }

    let notices = [];
    
    switch (action) {
      case 'date_change':
        const originalData = {
          startDate: testData.originalStartDate || tournament.startDate,
          endDate: testData.originalEndDate || tournament.endDate
        };
        const updatedData = {
          startDate: testData.newStartDate,
          endDate: testData.newEndDate
        };
        notices = await TournamentNoticeService.generateAutomaticNotices(
          tournamentId, 
          originalData, 
          updatedData, 
          'test-admin'
        );
        break;
        
      case 'venue_change':
        const originalVenueData = {
          venue: testData.originalVenue || tournament.venue,
          city: testData.originalCity || tournament.city
        };
        const updatedVenueData = {
          venue: testData.newVenue,
          city: testData.newCity
        };
        notices = await TournamentNoticeService.generateAutomaticNotices(
          tournamentId, 
          originalVenueData, 
          updatedVenueData, 
          'test-admin'
        );
        break;
        
      case 'cancellation':
        const notice = await TournamentNoticeService.createCancellationNotice(
          tournament, 
          testData.reason || 'Test cancellation', 
          'test-admin'
        );
        notices = notice ? [notice] : [];
        break;
        
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid action. Use: date_change, venue_change, or cancellation' 
        });
    }

    res.json({ 
      success: true, 
      message: `Generated ${notices.length} test notice(s)`,
      notices: notices
    });
  } catch (error) {
    console.error('Error testing tournament notices:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to test tournament notices',
      error: error.message 
    });
  }
});

// Create tournament notice
app.post('/admin/tournament-notices', adminAuth, [
  body('title').notEmpty().trim().escape().withMessage('Title is required'),
  body('tournamentName').notEmpty().trim().escape().withMessage('Tournament name is required'),
  body('type').isIn(['date_change', 'cancellation', 'venue_change', 'registration_deadline', 'general']).withMessage('Invalid notice type'),
  body('message').notEmpty().trim().escape().withMessage('Message is required'),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }

  try {
    const noticeData = {
      ...req.body,
      createdBy: req.session.username || 'admin',
      details: {
        originalDate: req.body.originalDate || '',
        newDate: req.body.newDate || '',
        originalVenue: req.body.originalVenue || '',
        newVenue: req.body.newVenue || '',
        reason: req.body.reason || '',
        deadline: req.body.deadline || ''
      }
    };

    const notice = await DatabaseService.createTournamentNotice(noticeData);
    res.json({ success: true, notice });
  } catch (error) {
    console.error('Error creating tournament notice:', error);
    res.status(500).json({ success: false, message: 'Failed to create tournament notice' });
  }
});

// Update tournament notice
app.put('/admin/tournament-notices/:id', adminAuth, [
  body('title').notEmpty().trim().escape().withMessage('Title is required'),
  body('tournamentName').notEmpty().trim().escape().withMessage('Tournament name is required'),
  body('type').isIn(['date_change', 'cancellation', 'venue_change', 'registration_deadline', 'general']).withMessage('Invalid notice type'),
  body('message').notEmpty().trim().escape().withMessage('Message is required'),
  body('priority').isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }

  try {
    const { id } = req.params;
    const currentVersion = req.body.version ? parseInt(req.body.version) : null;
    
    const updateData = {
      ...req.body,
      details: {
        originalDate: req.body.originalDate || '',
        newDate: req.body.newDate || '',
        originalVenue: req.body.originalVenue || '',
        newVenue: req.body.newVenue || '',
        reason: req.body.reason || '',
        deadline: req.body.deadline || ''
      }
    };

    const notice = await DatabaseService.updateTournamentNotice(
      id, 
      updateData, 
      currentVersion, 
      req.session.username || 'admin'
    );
    
    res.json({ success: true, notice });
  } catch (error) {
    console.error('Error updating tournament notice:', error);
    if (error.message.includes('Conflict detected')) {
      res.status(409).json({ success: false, message: error.message });
    } else {
      res.status(500).json({ success: false, message: 'Failed to update tournament notice' });
    }
  }
});

// Delete tournament notice
app.delete('/admin/tournament-notices/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await DatabaseService.deleteTournamentNotice(id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting tournament notice:', error);
    res.status(500).json({ success: false, message: 'Failed to delete tournament notice' });
  }
});

// Get tournament notice by ID
app.get('/admin/tournament-notices/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await DatabaseService.getTournamentNoticeById(id);
    
    if (!notice) {
      return res.status(404).json({ success: false, message: 'Tournament notice not found' });
    }
    
    res.json({ success: true, notice });
  } catch (error) {
    console.error('Error getting tournament notice:', error);
    res.status(500).json({ success: false, message: 'Failed to get tournament notice' });
  }
});

// =============================================
// MILESTONE ADMIN ROUTES
// =============================================

// Admin Milestone Management Page
app.get('/admin/milestones', adminAuth, async (req, res) => {
  try {
    const milestones = await DatabaseService.getAllMilestones();
    res.render('pages/admin/manage-milestones', { 
      milestones, 
      session: req.session 
    });
  } catch (error) {
    console.error('Error loading milestones admin page:', error);
    res.render('pages/admin/manage-milestones', { 
      milestones: [], 
      session: req.session,
      error: 'Failed to load milestones' 
    });
  }
});

// API Routes for Milestones

// Get all milestones (for admin)
app.get('/api/milestones', adminAuth, async (req, res) => {
  try {
    const milestones = await DatabaseService.getAllMilestones();
    res.json({ success: true, milestones });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch milestones' });
  }
});

// Get published milestones (public)
app.get('/api/milestones/published', async (req, res) => {
  try {
    const milestones = await DatabaseService.getPublishedMilestones();
    res.json({ success: true, milestones });
  } catch (error) {
    console.error('Error fetching published milestones:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch milestones' });
  }
});

// Get milestone by ID
app.get('/api/milestones/:id', adminAuth, async (req, res) => {
  try {
    const milestone = await DatabaseService.getMilestoneById(req.params.id);
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }
    res.json({ success: true, milestone });
  } catch (error) {
    console.error('Error fetching milestone:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch milestone' });
  }
});

// Create milestone
app.post('/api/milestones', adminAuth, async (req, res) => {
  try {
    const { title, description, date, category, tags, status = 'published' } = req.body;
    
    // Validation
    if (!title || !description || !date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title, description, and date are required' 
      });
    }

    // Handle image upload
    let imagePath = null;
    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      
      try {
        const cloudinaryResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              public_id: `milestone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              folder: 'milestones',
              transformation: [
                { width: 800, height: 600, crop: 'limit' },
                { quality: 'auto:good' },
                { format: 'auto' }
              ],
              tags: ['milestone', category || 'achievement']
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(imageFile.data);
        });
        
        imagePath = cloudinaryResult.secure_url;
      } catch (error) {
        console.error('Failed to upload milestone image to Cloudinary:', error);
        throw error;
      }
    }

    const milestoneData = {
      title: title.trim(),
      description: description.trim(),
      date: new Date(date),
      category: category || 'achievement',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      status,
      image: imagePath,
      imageAlt: title,
      createdBy: req.session.username || 'admin'
    };

    const milestone = await DatabaseService.createMilestone(milestoneData);
    
    res.json({ 
      success: true, 
      message: 'Milestone created successfully', 
      milestone 
    });

  } catch (error) {
    console.error('Error creating milestone:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create milestone: ' + error.message 
    });
  }
});

// Update milestone
app.put('/api/milestones/:id', adminAuth, async (req, res) => {
  try {
    const { title, description, date, category, tags, status } = req.body;
    
    const updateData = {};
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (date) updateData.date = new Date(date);
    if (category) updateData.category = category;
    if (tags) updateData.tags = tags.split(',').map(tag => tag.trim());
    if (status) updateData.status = status;

    // Handle image upload
    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      
      try {
        const cloudinaryResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              public_id: `milestone_update_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              folder: 'milestones',
              transformation: [
                { width: 800, height: 600, crop: 'limit' },
                { quality: 'auto:good' },
                { format: 'auto' }
              ],
              tags: ['milestone', 'update', category || 'achievement']
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(imageFile.data);
        });
        
        updateData.image = cloudinaryResult.secure_url;
        updateData.imageAlt = title || 'Milestone image';
      } catch (error) {
        console.error('Failed to upload milestone image update to Cloudinary:', error);
        throw error;
      }
    }

    const milestone = await DatabaseService.updateMilestone(
      req.params.id, 
      updateData, 
      req.session.username
    );
    
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    res.json({ 
      success: true, 
      message: 'Milestone updated successfully', 
      milestone 
    });

  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update milestone: ' + error.message 
    });
  }
});

// Delete milestone
app.delete('/api/milestones/:id', adminAuth, async (req, res) => {
  try {
    const milestone = await DatabaseService.deleteMilestone(req.params.id);
    
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    res.json({ 
      success: true, 
      message: 'Milestone deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting milestone:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete milestone: ' + error.message 
    });
  }
});

// Toggle milestone status
app.patch('/api/milestones/:id/toggle-status', adminAuth, async (req, res) => {
  try {
    const milestone = await DatabaseService.toggleMilestoneStatus(req.params.id);
    
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    res.json({ 
      success: true, 
      message: `Milestone ${milestone.status === 'published' ? 'published' : 'unpublished'}`, 
      milestone 
    });

  } catch (error) {
    console.error('Error toggling milestone status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle milestone status: ' + error.message 
    });
  }
});

// Toggle milestone feature
app.patch('/api/milestones/:id/toggle-feature', adminAuth, async (req, res) => {
  try {
    const milestone = await DatabaseService.toggleMilestoneFeature(req.params.id);
    
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    res.json({ 
      success: true, 
      message: `Milestone ${milestone.featured ? 'featured' : 'unfeatured'}`, 
      milestone 
    });

  } catch (error) {
    console.error('Error toggling milestone feature:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to toggle milestone feature: ' + error.message 
    });
  }
});


// Start the server
const PORT = process.env.PORT || 3000;

// Initialize database connection and start server
async function startServer() {
  try {
    console.log('🚀 Starting Malaysia Pickleball Server...');
    
    // Connect to database
    await connectDB();
    console.log('📊 Database connected successfully');
    
    
    
    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Admin panel: http://localhost:${PORT}/admin/login`);
      console.log(`🏓 Public site: http://localhost:${PORT}`);
      console.log(`📋 Organization Chart: http://localhost:${PORT}/organization-chart`);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Webhook endpoint for instant tournament deletion from portal
app.post('/api/webhook/tournament-deleted', async (req, res) => {
  try {
    console.log('🚨 INSTANT DELETION WEBHOOK received from portal');
    const { applicationId, eventTitle, action } = req.body;
    
    if (!applicationId && !eventTitle) {
      return res.status(400).json({ error: 'Missing applicationId or eventTitle' });
    }
    
    console.log(`🗑️ Instant deletion request: ${eventTitle || 'Unknown'} (${applicationId || 'No ID'})`);
    
    // Find and delete tournament immediately
    const Tournament = require('./models/Tournament');
    let deletedTournament = null;
    
    // Try to find by portal application ID first
    if (applicationId) {
      deletedTournament = await Tournament.findOneAndDelete({
        portalApplicationId: applicationId
      });
      console.log(`🔍 Searched by portal ID ${applicationId}: ${deletedTournament ? 'FOUND & DELETED' : 'NOT FOUND'}`);
    }
    
    // If not found by ID, try by name
    if (!deletedTournament && eventTitle) {
      deletedTournament = await Tournament.findOneAndDelete({
        name: { $regex: new RegExp(`^${eventTitle.trim()}$`, 'i') },
        $or: [
          { managedByPortal: true },
          { syncedFromPortal: true },
          { portalApplicationId: { $exists: true } }
        ]
      });
      console.log(`🔍 Searched by name "${eventTitle}": ${deletedTournament ? 'FOUND & DELETED' : 'NOT FOUND'}`);
    }
    
    if (deletedTournament) {
      console.log(`✅ INSTANTLY DELETED: "${deletedTournament.name}"`);
      console.log(`   Tournament ID: ${deletedTournament._id}`);
      console.log(`   Portal ID: ${deletedTournament.portalApplicationId || 'None'}`);
      console.log(`   ⚡ INSTANT DELETION SUCCESSFUL - No 2-minute wait!`);
      
      res.json({
        success: true,
        message: 'Tournament deleted instantly',
        deletedTournament: {
          id: deletedTournament._id,
          name: deletedTournament.name,
          portalApplicationId: deletedTournament.portalApplicationId
        }
      });
    } else {
      console.log(`⚠️  No matching tournament found for instant deletion`);
      res.status(404).json({
        success: false,
        message: 'Tournament not found for deletion'
      });
    }
    
  } catch (error) {
    console.error('❌ Webhook deletion error:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to process deletion webhook',
      message: error.message
    });
  }
});


// Start the server
startServer();

