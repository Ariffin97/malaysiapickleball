const express = require('express');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const session = require('express-session');
const path = require('path');
const pdf = require('html-pdf');

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
    secure: false, // Temporarily disable for debugging
    httpOnly: true,
    maxAge: parseInt(process.env.SESSION_TIMEOUT) || 7200000 // 2 hours
  }
}));

// Enhanced admin authentication middleware
const adminAuth = async (req, res, next) => {
  console.log('🔍 Admin Auth Check:', {
    isAuthenticated: req.session.isAuthenticated,
    adminId: req.session.adminId,
    username: req.session.username
  });
  
  if (!req.session.isAuthenticated || !req.session.adminId) {
    console.log('❌ Admin auth failed: No session or adminId');
    return res.redirect('/login');
  }
  
  try {
    const admin = await DatabaseService.getAdminByUsername(req.session.username);
    console.log('👤 Admin lookup result:', admin ? 'Found' : 'Not found', admin?.isActive);
    
    if (!admin || !admin.isActive) {
      console.log('❌ Admin auth failed: Admin not found or inactive');
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
        { name: 'IOP Johor', startDate: '2025-04-20', endDate: '2025-04-22', type: 'wmalaysia', color: 'orange' },
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
    
    console.log('🎯 Login successful, setting session...');
    
    req.session.regenerate((err) => {
      if (err) {
        console.log('❌ Session regenerate error:', err);
        return res.render('pages/login', { error: 'Authentication error', session: req.session });
      }
      
      req.session.isAuthenticated = true;
      req.session.adminId = admin._id;
      req.session.username = admin.username;
      req.session.loginTime = Date.now();
      req.session.userAgent = req.get('User-Agent');
      req.session.ipAddress = req.clientIP;
      
      console.log('✅ Session set:', {
        isAuthenticated: req.session.isAuthenticated,
        adminId: req.session.adminId,
        username: req.session.username
      });
      
      req.session.save((saveErr) => {
        if (saveErr) {
          console.log('❌ Session save error:', saveErr);
          return res.render('pages/login', { error: 'Session save error', session: req.session });
        }
        console.log('✅ Session saved, redirecting to dashboard');
        res.redirect('/admin/dashboard');
      });
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

app.get('/admin/tournaments', adminAuth, async (req, res) => {
  try {
    const tournaments = await DatabaseService.getAllTournaments();
    res.render('pages/admin/manage-tournaments', {
      tournaments: tournaments || [],
      session: req.session,
      errors: [],
      formData: {}
    });
  } catch (error) {
    console.error('Error loading tournaments:', error);
    res.render('pages/admin/manage-tournaments', {
      tournaments: [],
      session: req.session,
      errors: [{ msg: 'Failed to load tournaments.' }],
      formData: {}
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
    await DatabaseService.deleteTournament(req.params.id);
    res.json({
      success: true,
      message: 'Tournament deleted successfully'
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
  body('type').isIn(['local', 'state', 'national', 'sarawak', 'wmalaysia']).withMessage('Valid tournament type is required'),
  body('startDate').optional({ checkFalsy: true }).isISO8601().withMessage('Valid start date is required'),
  body('endDate').optional({ checkFalsy: true }).isISO8601().withMessage('Valid end date is required'),
  body('venue').optional().trim(),
  body('city').optional().trim(),
  body('organizer').optional().trim(),
  body('personInCharge').optional().trim(),
  body('phoneNumber').optional().trim().matches(/^[0-9+\-\s()]+$/).withMessage('Valid phone number format required')
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
    const tournamentId = req.params.id;
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

    await DatabaseService.updateTournament(tournamentId, updateData, currentVersion, modifiedBy);
    
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
    
    res.json({ 
      success: true, 
      message: `Player registration approved successfully! Player ID: ${result.player.playerId}`,
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
  body('icNumber').notEmpty().trim().matches(/[0-9]{6}-[0-9]{2}-[0-9]{4}/).withMessage('Valid IC number is required'),
  body('age').isInt({ min: 12, max: 100 }).withMessage('Age must be between 12 and 100'),
  body('phoneNumber').notEmpty().trim().withMessage('Phone number is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('address').notEmpty().trim().withMessage('Address is required'),
  body('username').notEmpty().trim().isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/).withMessage('Username must be 3-20 characters, letters, numbers, and underscores only'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('terms').equals('on').withMessage('You must accept the terms and conditions')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
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

    // Handle profile picture upload
    if (req.files && req.files.profilePicture) {
      const profilePicture = req.files.profilePicture;
      const uploadPath = path.join(__dirname, 'public/uploads/profiles/', profilePicture.name);
      
      // Create uploads directory if it doesn't exist
      const fs = require('fs');
      const uploadDir = path.dirname(uploadPath);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      await profilePicture.mv(uploadPath);
      registrationData.profilePicture = `/uploads/profiles/${profilePicture.name}`;
    }

    // Save registration to database
    const registration = await DatabaseService.createPlayerRegistration(registrationData);

    res.render('pages/player-register', {
      error: null,
      success: 'Registration submitted successfully! Your application has been received and will be reviewed by our admin team within 24-48 hours. Once approved, you will receive a unique 5-character Player ID linked to your IC number. You will receive an email notification once your application is processed.',
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

app.post('/admin/home', adminAuth, async (req, res) => {
  try {
    if (req.files && req.files.backgroundImage) {
      const backgroundImage = req.files.backgroundImage;
      const uploadPath = path.join(__dirname, 'public/uploads', backgroundImage.name);
      
      // Create uploads directory if it doesn't exist
      const fs = require('fs');
      const uploadDir = path.dirname(uploadPath);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      await backgroundImage.mv(uploadPath);
      const imagePath = `/uploads/${backgroundImage.name}`;
      
      // Save to database
      await DatabaseService.setSetting('background_image', imagePath);
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
      const uploadPath = path.join(__dirname, 'public/uploads', popupImage.name);
      
      // Create uploads directory if it doesn't exist
      const fs = require('fs');
      const uploadDir = path.dirname(uploadPath);
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      
      await popupImage.mv(uploadPath);
      const imagePath = `/uploads/${popupImage.name}`;
      
      // Save to database
      await DatabaseService.setSetting('popup_image', imagePath);
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
  
  // Ensure proper sandbox permissions for interaction
  if (!sanitized.includes('sandbox')) {
    sanitized = sanitized.replace('<iframe', '<iframe sandbox="allow-scripts allow-same-origin allow-presentation allow-forms"');
  }
  
  // Remove any potentially dangerous attributes
  sanitized = sanitized.replace(/on\w+="[^"]*"/gi, ''); // Remove onclick, onload, etc.
  sanitized = sanitized.replace(/javascript:/gi, ''); // Remove javascript: protocols
  
  return sanitized;
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
    res.render('pages/venue', { 
      venues: [], // Empty array since it's coming soon
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

app.get('/services/registration', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    const tournaments = await DatabaseService.getAllTournaments();
    res.render('pages/services/registration', { 
      tournaments: tournaments, 
      session: req.session, 
      backgroundImage 
    });
  } catch (error) {
    console.error('Registration page error:', error);
    res.render('pages/services/registration', { 
      tournaments: [], 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png' 
    });
  }
});

app.get('/services/requirement-approval', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/services/requirement-approval', { 
      session: req.session, 
      backgroundImage 
    });
  } catch (error) {
    console.error('Requirement approval page error:', error);
    res.render('pages/services/requirement-approval', { 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png' 
    });
  }
});

app.get('/services/requirement-bidding', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/services/requirement-bidding', { 
      session: req.session, 
      backgroundImage 
    });
  } catch (error) {
    console.error('Requirement bidding page error:', error);
    res.render('pages/services/requirement-bidding', { 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png' 
    });
  }
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

app.get('/services/section-33', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/services/section-33', { 
      session: req.session, 
      backgroundImage 
    });
  } catch (error) {
    console.error('Section 33 page error:', error);
    res.render('pages/services/section-33', { 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png' 
    });
  }
});

app.get('/services/section-34', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/services/section-34', { 
      session: req.session, 
      backgroundImage 
    });
  } catch (error) {
    console.error('Section 34 page error:', error);
    res.render('pages/services/section-34', { 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png' 
    });
  }
});

app.get('/services/section-36', async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', '/images/defaultbg.png');
    res.render('pages/services/section-36', { 
      session: req.session, 
      backgroundImage 
    });
  } catch (error) {
    console.error('Section 36 page error:', error);
    res.render('pages/services/section-36', { 
      session: req.session, 
      backgroundImage: '/images/defaultbg.png' 
    });
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
      'sarawak': { color: 'purple' },
      'wmalaysia': { color: 'orange' }
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
    
    // Validate IC number format
    const icRegex = /^[0-9]{6}-[0-9]{2}-[0-9]{4}$/;
    if (!icRegex.test(icNumber)) {
      return res.json({
        available: false,
        message: 'Invalid IC number format. Please use format: 123456-78-9012'
      });
    }

    const availability = await DatabaseService.checkIcNumberAvailability(icNumber);
    
    let message = '';
    if (availability.available) {
      message = 'IC number is available for registration';
    } else if (availability.isPlayerRegistered) {
      message = 'This IC number is already registered as an active player';
    } else if (availability.isInRegistrationSystem) {
      message = 'This IC number already has a pending registration';
    }

    res.json({
      available: availability.available,
      message: message,
      isPlayerRegistered: availability.isPlayerRegistered,
      isInRegistrationSystem: availability.isInRegistrationSystem
    });
  } catch (error) {
    console.error('Error checking IC availability:', error);
    res.status(500).json({
      available: false,
      message: 'Error checking IC number availability'
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Access your application at: http://localhost:${PORT}`);
  console.log(`🔧 Admin panel: http://localhost:${PORT}/admin/dashboard`);
});

module.exports = app; 