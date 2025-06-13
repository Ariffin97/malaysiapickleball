const express = require('express');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const session = require('express-session');
const path = require('path');

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
    
    console.log('Homepage popup data:', { popupActive, popupTitle, popupContent, popupImage }); // Debug log
    
    res.render('pages/home', { 
      session: req.session, 
      backgroundImage,
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
  body('type').notEmpty().withMessage('Tournament type is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const tournaments = await DatabaseService.getAllTournaments();
    return res.render('pages/admin/manage-tournaments', { 
      tournaments: tournaments || [], 
      session: req.session, 
      errors: errors.array(), 
      formData: req.body 
    });
  }
  
  try {
    await DatabaseService.createTournament(req.body);
    res.redirect('/admin/tournaments?success=tournament_added');
  } catch (error) {
    console.error('Add tournament error:', error);
    res.redirect('/admin/tournaments?error=add_failed');
  }
});

app.post('/admin/tournaments/delete/:id', adminAuth, async (req, res) => {
  try {
    await DatabaseService.deleteTournament(req.params.id);
    res.redirect('/admin/tournaments?success=tournament_deleted');
  } catch (error) {
    console.error('Delete tournament error:', error);
    res.redirect('/admin/tournaments?error=delete_failed');
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
      message: 'Player registration approved successfully',
      player: result.player 
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
      success: 'Registration submitted successfully! Your application has been received and will be reviewed by our admin team within 24-48 hours. You will receive an email notification once your application is processed.',
      session: req.session,
      backgroundImage: await DatabaseService.getSetting('background_image', '/images/defaultbg.png')
    });

  } catch (error) {
    console.error('Player registration error:', error);
    res.render('pages/player-register', {
      error: 'Registration failed. Please try again later.',
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
    
    res.render('pages/player/dashboard', {
      player: player,
      session: req.session,
      backgroundImage
    });
  } catch (error) {
    console.error('Player dashboard error:', error);
    res.redirect('/player/login?error=dashboard_failed');
  }
});

// Admin Home Management Routes
app.get('/admin/home', adminAuth, async (req, res) => {
  try {
    const backgroundImage = await DatabaseService.getSetting('background_image', null);
    const popupImage = await DatabaseService.getSetting('popup_image', null);
    
    res.render('pages/admin/manage-home', { 
      backgroundImage: backgroundImage,
      popupImage: popupImage,
      session: req.session 
    });
  } catch (error) {
    console.error('Admin home page error:', error);
    res.render('pages/admin/manage-home', {
      backgroundImage: null,
      popupImage: null,
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
    
    res.redirect('/admin/home');
  } catch (error) {
    console.error('Background image upload error:', error);
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
    
    res.redirect('/admin/home');
  } catch (error) {
    console.error('Popup image upload error:', error);
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

// Tournament PDF Print Route
app.get('/tournament/print-pdf', async (req, res) => {
  try {
    console.log('Serving printable HTML version...');
    
    // Get tournaments from database
    const tournaments = await DatabaseService.getAllTournaments();
    
    // Define tournament types with colors (similar to old server.js)
    const tournamentTypes = {
      'singles': { color: 'blue' },
      'doubles': { color: 'green' },
      'mixed': { color: 'purple' },
      'team': { color: 'orange' },
      'junior': { color: 'pink' },
      'senior': { color: 'teal' }
    };
    
    // Format tournaments for PDF
    const formattedTournaments = tournaments.map(t => ({
      ...t,
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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Access your application at: http://localhost:${PORT}`);
  console.log(`🔧 Admin panel: http://localhost:${PORT}/admin/dashboard`);
});

module.exports = app; 