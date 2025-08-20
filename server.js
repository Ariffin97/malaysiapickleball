const express = require('express');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const session = require('express-session');
const path = require('path');
const puppeteer = require('puppeteer');
const { v2 as cloudinary } = require('cloudinary');
const app = express();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// In-memory data store (replace with database in production)
const dataStore = {
  tournaments: [
    { name: 'KGM Autumn Tournament', startDate: '2025-11-01', endDate: '2025-11-03', type: 'local', months: [10], image: null },
    { name: 'MPR@KL (SUKMA)', startDate: '2025-04-26', endDate: '2025-04-28', type: 'state', months: [3], image: null },
    { name: 'SPA Grand Finals', startDate: '2025-11-10', endDate: '2025-11-12', type: 'national', months: [10], image: null },
    { name: 'IOP Johor', startDate: '2025-03-20', endDate: '2025-03-22', type: 'wmalaysia', months: [2], image: null }
  ],
  coaches: [],
  referees: [],
  refereeApplications: [],
  venues: [],
  sponsorships: [],
  rankings: [],
  pendingRegistrations: [],
  users: [],
  players: [], // Store approved players
  playerRegistrations: [], // Store pending player registrations
  milestones: [ // Add sample milestones
    {
      id: 1,
      title: "MPA Foundation",
      date: "2020-01-15",
      description: "Malaysia Pickleball Association was officially established to promote and develop the sport of pickleball nationwide.",
      image: "/images/milestone-foundation.jpg",
      status: "published",
      category: "foundation",
      createdBy: "admin",
      createdAt: "2020-01-15T00:00:00.000Z"
    },
    {
      id: 2,
      title: "First National Tournament",
      date: "2021-03-22",
      description: "Successfully organized the first-ever National Pickleball Championship with 200+ participants from 10 states.",
      image: "/images/milestone-tournament.jpg",
      status: "published",
      category: "tournament",
      createdBy: "admin",
      createdAt: "2021-03-22T00:00:00.000Z"
    },
    {
      id: 3,
      title: "International Recognition",
      date: "2022-08-10",
      description: "MPA gained recognition from the International Federation of Pickleball and joined the Asian Pickleball Union.",
      image: "/images/milestone-international.jpg",
      status: "published",
      category: "recognition",
      createdBy: "admin",
      createdAt: "2022-08-10T00:00:00.000Z"
    }
  ],
  backgroundImage: null,
  popupMessage: {
    active: false,
    title: '',
    content: '',
    image: null
  }
};

// Player ID generator
let nextPlayerId = 1000; // Starting player ID
const generatePlayerId = () => {
  return `MP${String(nextPlayerId++).padStart(4, '0')}`; // MP0001, MP0002, etc.
};

// Milestone ID generator
let nextMilestoneId = 4; // Starting after existing milestones
const generateMilestoneId = () => {
  return nextMilestoneId++;
};

// Color mapping for tournament types
const tournamentTypes = {
  local: { color: 'green', label: 'Local' },
  state: { color: 'red', label: 'State' },
  national: { color: 'blue', label: 'National' },

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
})); // Security headers with CSP allowing inline scripts
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Parse JSON bodies
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(session({
  secret: process.env.SESSION_SECRET || 'change_this_in_production_immediately',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 2 * 60 * 60 * 1000 // 2 hours
  }
}));

// Enhanced admin authentication middleware
const adminAuth = (req, res, next) => {
  if (!req.session.isAuthenticated) {
    return res.redirect('/login');
  }
  
  // Enhanced security checks
  const now = Date.now();
  const loginTime = req.session.loginTime || 0;
  const sessionTimeout = 2 * 60 * 60 * 1000; // 2 hours
  
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
  
  next();
};

// Routes
app.get('/', (req, res) => res.render('pages/home', { 
  session: req.session, 
  backgroundImage: dataStore.backgroundImage,
  popupMessage: dataStore.popupMessage
}));

app.get('/tournament', (req, res) => {
  console.log('Tournaments:', dataStore.tournaments); // Debug log
  const formattedTournaments = dataStore.tournaments.map(t => ({
    ...t,
    color: tournamentTypes[t.type]?.color || 'green'
  }));
  res.render('pages/tournament', { tournaments: formattedTournaments, session: req.session, backgroundImage: dataStore.backgroundImage });
});

// Lightweight mobile tournaments API for local server
app.get('/api/mobile/tournaments', (req, res) => {
  try {
    const status = req.query.status; // upcoming, ongoing, completed
    const limit = parseInt(req.query.limit) || 10;

    const now = new Date();
    const parseDate = (d) => (d ? new Date(d) : null);

    let list = dataStore.tournaments.map(t => ({
      id: t.name,
      name: t.name,
      type: t.type,
      startDate: parseDate(t.startDate),
      endDate: parseDate(t.endDate),
      location: t.city || '',
      venue: t.venue || '',
      status: 'upcoming'
    }));

    if (status === 'upcoming') {
      list = list.filter(t => t.startDate && t.startDate > now);
    } else if (status === 'ongoing') {
      list = list.filter(t => t.startDate && t.endDate && t.startDate <= now && t.endDate >= now);
    } else if (status === 'completed') {
      list = list.filter(t => t.endDate && t.endDate < now);
    }

    list.sort((a, b) => (a.startDate || now) - (b.startDate || now));
    const sliced = list.slice(0, limit);

    res.json({
      success: true,
      message: 'Tournaments retrieved',
      data: {
        tournaments: sliced,
        pagination: { current: 1, pages: 1, total: list.length }
      }
    });
  } catch (err) {
    console.error('Local mobile tournaments API error:', err);
    res.status(500).json({ success: false, message: 'Failed to retrieve tournaments' });
  }
});

// Events page route
app.get('/events', (req, res) => {
  console.log('Events Tournaments:', dataStore.tournaments); // Debug log
  const formattedTournaments = dataStore.tournaments.map(t => ({
    ...t,
    color: tournamentTypes[t.type]?.color || 'green'
  }));
  res.render('pages/events', { tournaments: formattedTournaments, session: req.session, backgroundImage: dataStore.backgroundImage });
});

// Live Tournament public page route
app.get('/live-tournament', (req, res) => {
  try {
    // Get live tournament settings from dataStore
    const liveStatus = dataStore.liveStatus || 'inactive';
    const tournamentTitle = dataStore.tournamentTitle || 'Live Tournament';
    const maxStreams = dataStore.maxStreams || 2;
    const backgroundImage = dataStore.backgroundImage || '/images/defaultbg.png';
    
    // Get all live streams
    const liveStreams = [];
    for (let i = 1; i <= maxStreams; i++) {
      const stream = dataStore[`liveStream${i}`] || null;
      const streamTitle = dataStore[`liveStream${i}Title`] || `Live Stream ${i}`;
      const streamStatus = dataStore[`liveStream${i}Status`] || 'offline';
      
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

// Test PDF Template Route (for debugging)
app.get('/tournament/test-pdf-template', (req, res) => {
  try {
    const formattedTournaments = dataStore.tournaments.map(t => ({
      ...t,
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
    
    const formattedTournaments = dataStore.tournaments.map(t => ({
      ...t,
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
    
    const filename = `Tournament_Calendar_${new Date().getFullYear()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    res.end(pdfBuffer);
    
  } catch (error) {
    console.error('Simple PDF error:', error);
    res.status(500).json({ error: 'Simple PDF failed', details: error.message });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// Fallback HTML Print Route (if Puppeteer fails)
app.get('/tournament/print-pdf', (req, res) => {
  try {
    console.log('Serving printable HTML version...');
    
    // Format tournaments for PDF
    const formattedTournaments = dataStore.tournaments.map(t => ({
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

// Enhanced PDF Download with fallback
app.get('/tournament/download-pdf-enhanced', async (req, res) => {
  let browser = null;
  
  try {
    console.log('Starting enhanced PDF generation...');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Puppeteer executable path:', process.env.PUPPETEER_EXECUTABLE_PATH);
    
    // Format tournaments for PDF
    const formattedTournaments = dataStore.tournaments.map(t => ({
      ...t,
      color: tournamentTypes[t.type]?.color || 'green'
    }));
    
    console.log('Formatted tournaments:', formattedTournaments.length);
    
    // Try to launch browser with extensive error handling
    try {
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
          '--disable-background-networking',
          '--memory-pressure-off',
          '--max_old_space_size=4096'
        ],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || puppeteer.executablePath(),
        timeout: 60000
      });
      
      console.log('Browser launched successfully');
      
      const page = await browser.newPage();
      
      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1200,
        height: 800,
        deviceScaleFactor: 1
      });
      
      // Render the EJS template to HTML string
      console.log('Rendering template...');
      const htmlContent = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Template rendering timeout'));
        }, 15000);
        
        res.app.render('templates/tournament-pdf', { 
          tournaments: formattedTournaments 
        }, (err, html) => {
          clearTimeout(timeout);
          if (err) {
            console.error('Template render error:', err);
            reject(err);
          } else {
            console.log('Template rendered successfully, length:', html?.length || 0);
            resolve(html);
          }
        });
      });
      
      if (!htmlContent || htmlContent.length === 0) {
        throw new Error('Empty HTML content generated');
      }
      
      // Set page content
      console.log('Setting page content...');
      await page.setContent(htmlContent, { 
        waitUntil: 'domcontentloaded',
        timeout: 30000
      });
      
      // Wait for content to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Generating PDF...');
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        }
      });
      
      console.log('PDF generated successfully, size:', pdfBuffer.length, 'bytes');
      
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('Generated PDF is empty');
      }
      
      // Set response headers for PDF download
      const filename = `Malaysia_Pickleball_Tournament_Calendar_${new Date().getFullYear()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      res.setHeader('Cache-Control', 'no-cache');
      
      console.log('Sending PDF to client:', filename);
      res.end(pdfBuffer);
      
    } catch (puppeteerError) {
      console.error('Puppeteer failed, redirecting to print version:', puppeteerError);
      
      // Redirect to printable HTML version as fallback
      res.redirect('/tournament/print-pdf');
      return;
    }
    
  } catch (error) {
    console.error('Enhanced PDF generation error:', error);
    
    // Final fallback - redirect to print version
    if (!res.headersSent) {
      console.log('Redirecting to print version as final fallback');
      res.redirect('/tournament/print-pdf');
    }
  } finally {
    // Always close browser
    if (browser) {
      try {
        await browser.close();
        console.log('Browser closed');
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
});

// PDF Download Route (Main - now uses enhanced version)
app.get('/tournament/download-pdf', async (req, res) => {
  // Redirect to enhanced version with fallback
  res.redirect('/tournament/download-pdf-enhanced');
});

app.get('/referee', (req, res) => res.render('pages/referee', { referees: dataStore.referees, session: req.session, backgroundImage: dataStore.backgroundImage }));
app.get('/coaches', (req, res) => res.render('pages/coaches', { coaches: dataStore.coaches, session: req.session, backgroundImage: dataStore.backgroundImage }));
app.get('/venue', (req, res) => res.render('pages/venue', { venues: dataStore.venues, session: req.session, backgroundImage: dataStore.backgroundImage }));
app.get('/services/sponsorship', (req, res) => res.render('pages/services/sponsorship', { sponsorships: dataStore.sponsorships, session: req.session, backgroundImage: dataStore.backgroundImage }));

app.get('/services/application-organizing', (req, res) => res.render('pages/services/application-organizing', { session: req.session, backgroundImage: dataStore.backgroundImage }));
app.get('/services/application-bidding', (req, res) => res.render('pages/services/application-bidding', { session: req.session, backgroundImage: dataStore.backgroundImage }));

app.get('/services/ranking', (req, res) => res.render('pages/services/ranking', { rankings: dataStore.rankings, session: req.session, backgroundImage: dataStore.backgroundImage }));
app.get('/shop', (req, res) => res.render('pages/shop', { 
  session: req.session, 
  backgroundImage: dataStore.backgroundImage || '/images/defaultbg.png' 
}));

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

// Enhanced login security middleware
const loginAttempts = new Map(); // In production, use Redis or database
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

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
], (req, res) => {
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
  
  // Enhanced security: Use environment variables for credentials
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  
  // In production, use bcrypt for password hashing:
  // const bcrypt = require('bcrypt');
  // const isValidPassword = await bcrypt.compare(password, hashedPassword);
  
  if (username === adminUsername && password === adminPassword) {
    // Success - reset attempts
    loginAttempts.delete(req.clientIP);
    
    // Enhanced session security
    req.session.isAuthenticated = true;
    req.session.loginTime = Date.now();
    req.session.userAgent = req.get('User-Agent');
    req.session.ipAddress = req.clientIP;
    
    // Regenerate session ID for security
    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error:', err);
        return res.render('pages/login', { error: 'Authentication error', session: req.session });
      }
      
      req.session.isAuthenticated = true;
      req.session.loginTime = Date.now();
      req.session.userAgent = req.get('User-Agent');
      req.session.ipAddress = req.clientIP;
      
      res.redirect('/admin/dashboard');
    });
  } else {
    // Failed login - track attempt
    const clientIP = req.clientIP;
    const attempts = loginAttempts.get(clientIP) || { count: 0, lastAttempt: 0 };
    attempts.count++;
    attempts.lastAttempt = Date.now();
    loginAttempts.set(clientIP, attempts);
    
    // Log failed attempt for monitoring
    console.warn(`Failed login attempt from IP: ${clientIP}, Username: ${username}, Time: ${new Date().toISOString()}`);
    
    // Generic error message for security
    res.render('pages/login', { error: 'Invalid username or password', session: req.session });
  }
});

// Signup Routes
app.get('/signup', (req, res) => {
  res.render('pages/signup', { error: null, session: req.session });
});

app.post('/signup', [
  body('fullName').notEmpty().trim().escape(),
  body('icNumber').matches(/^\d{12}$/),
  body('age').isInt({ min: 18, max: 100 }),
  body('maritalStatus').isIn(['single', 'married']),
  body('phone').matches(/^\d{10,11}$/),
  body('email').isEmail().normalizeEmail()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('pages/signup', { error: 'Invalid input', session: req.session });
  }
  const { fullName, icNumber, age, maritalStatus, phone, email } = req.body;
  const faceImage = req.files?.faceImage ? `/uploads/${req.files.faceImage.name}` : null;
  if (!faceImage) {
    return res.render('pages/signup', { error: 'Face image is required', session: req.session });
  }
  req.files.faceImage.mv(path.join(__dirname, 'public/uploads', req.files.faceImage.name));
  const id = Date.now().toString(); // Simple ID generation
  dataStore.pendingRegistrations.push({ id, fullName, icNumber, age, maritalStatus, phone, email, faceImage });
  res.redirect('/login');
});

// Logout Route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Admin Routes
app.get('/admin/dashboard', adminAuth, (req, res) => res.render('pages/admin/dashboard', { pendingRegistrations: dataStore.pendingRegistrations, users: dataStore.users, session: req.session }));
app.get('/admin/home', adminAuth, (req, res) => res.render('pages/admin/manage-home', { 
  backgroundImage: dataStore.backgroundImage, 
  popupImage: dataStore.popupMessage.image,
  video1: dataStore.video1 || null,
  video2: dataStore.video2 || null,
  video1Original: dataStore.video1Original || null,
  video2Original: dataStore.video2Original || null,
  video1Type: dataStore.video1Type || 'Featured Video',
  video2Type: dataStore.video2Type || 'Featured Video',
  session: req.session 
}));
app.get('/admin/registrations', adminAuth, (req, res) => res.render('pages/admin/registrations', { pendingRegistrations: dataStore.pendingRegistrations, session: req.session }));
app.get('/admin/registrations/:id', adminAuth, (req, res) => {
  const registration = dataStore.pendingRegistrations.find(reg => reg.id === req.params.id);
  res.render('pages/admin/registration-detail', { registration, session: req.session });
});
app.get('/admin/tournaments', adminAuth, (req, res) => res.render('pages/admin/manage-tournaments', { tournaments: dataStore.tournaments, session: req.session, errors: [], formData: {} }));
app.get('/admin/referees', adminAuth, (req, res) => res.render('pages/admin/manage-referees', { referees: dataStore.referees, session: req.session }));
app.get('/admin/coaches', adminAuth, (req, res) => res.render('pages/admin/manage-coaches', { coaches: dataStore.coaches, session: req.session }));
app.get('/admin/venues', adminAuth, (req, res) => res.render('pages/admin/manage-venue', { venues: dataStore.venues, session: req.session }));
app.get('/admin/sponsorships', adminAuth, (req, res) => res.render('pages/admin/manage-sponsership', { sponsorships: dataStore.sponsorships, session: req.session }));
app.get('/admin/rankings', adminAuth, (req, res) => res.render('pages/admin/manage-ranking', { rankings: dataStore.rankings, session: req.session }));

// Milestone Admin Routes
app.get('/admin/milestones', adminAuth, (req, res) => {
  try {
    res.render('pages/admin/manage-milestones', { 
      milestones: dataStore.milestones, 
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

// Live Tournament Admin Routes
app.get('/admin/live-tournament', adminAuth, (req, res) => {
  try {
    res.render('pages/admin/manage-live-tournament', {
      liveStatus: dataStore.liveStatus || 'inactive',
      tournamentTitle: dataStore.tournamentTitle || '',
      maxStreams: dataStore.maxStreams || 2,
      liveStream1: dataStore.liveStream1 || null,
      liveStream1Original: dataStore.liveStream1Original || '',
      liveStream1Title: dataStore.liveStream1Title || 'Live Stream 1',
      liveStream1Status: dataStore.liveStream1Status || 'offline',
      liveStream2: dataStore.liveStream2 || null,
      liveStream2Original: dataStore.liveStream2Original || '',
      liveStream2Title: dataStore.liveStream2Title || 'Live Stream 2',
      liveStream2Status: dataStore.liveStream2Status || 'offline',
      session: req.session
    });
  } catch (error) {
    console.error('Live tournament admin error:', error);
    res.render('pages/admin/manage-live-tournament', {
      liveStatus: 'inactive',
      tournamentTitle: '',
      maxStreams: 2,
      liveStream1: null,
      liveStream1Original: '',
      liveStream1Title: 'Live Stream 1',
      liveStream1Status: 'offline',
      liveStream2: null,
      liveStream2Original: '',
      liveStream2Title: 'Live Stream 2',
      liveStream2Status: 'offline',
      session: req.session
    });
  }
});

app.post('/admin/live-tournament/settings', adminAuth, (req, res) => {
  try {
    const { maxStreams, liveStatus, tournamentTitle } = req.body;
    
    dataStore.maxStreams = parseInt(maxStreams) || 2;
    dataStore.liveStatus = liveStatus || 'inactive';
    dataStore.tournamentTitle = tournamentTitle || '';
    
    console.log('Live tournament settings updated:', { maxStreams: dataStore.maxStreams, liveStatus: dataStore.liveStatus, tournamentTitle: dataStore.tournamentTitle });
    
    res.redirect('/admin/live-tournament?success=settings_updated');
  } catch (error) {
    console.error('Live tournament settings error:', error);
    res.redirect('/admin/live-tournament?error=settings_update_failed');
  }
});

app.post('/admin/live-tournament/streams', adminAuth, (req, res) => {
  try {
    const { streamNumber, streamTitle, streamStatus, embedCode } = req.body;
    
    const streamKey = `liveStream${streamNumber}`;
    const streamOriginalKey = `liveStream${streamNumber}Original`;
    const streamTitleKey = `liveStream${streamNumber}Title`;
    const streamStatusKey = `liveStream${streamNumber}Status`;
    
    // Store original embed code
    dataStore[streamOriginalKey] = embedCode || '';
    dataStore[streamTitleKey] = streamTitle || `Live Stream ${streamNumber}`;
    dataStore[streamStatusKey] = streamStatus || 'offline';
    
    // Process embed code if provided
    if (embedCode && embedCode.trim()) {
      dataStore[streamKey] = embedCode.trim();
    } else {
      dataStore[streamKey] = null;
    }
    
    console.log(`Stream ${streamNumber} updated:`, {
      title: dataStore[streamTitleKey],
      status: dataStore[streamStatusKey],
      hasEmbed: !!dataStore[streamKey]
    });
    
    res.redirect('/admin/live-tournament?success=stream_updated');
  } catch (error) {
    console.error('Live tournament stream error:', error);
    res.redirect('/admin/live-tournament?error=stream_update_failed');
  }
});

// Admin Home Page Actions
app.post('/admin/home', adminAuth, (req, res) => {
  const backgroundImage = req.files?.backgroundImage ? `/uploads/${req.files.backgroundImage.name}` : null;
  if (backgroundImage) {
    req.files.backgroundImage.mv(path.join(__dirname, 'public/uploads', req.files.backgroundImage.name));
    dataStore.backgroundImage = backgroundImage;
  }
  res.redirect('/admin/home');
});

// Popup Message Routes
app.post('/admin/popup-image', adminAuth, (req, res) => {
  try {
    const popupImage = req.files?.popupImage ? `/uploads/${req.files.popupImage.name}` : null;
    if (popupImage) {
      req.files.popupImage.mv(path.join(__dirname, 'public/uploads', req.files.popupImage.name));
      dataStore.popupMessage.image = popupImage;
    }
    res.redirect('/admin/home');
  } catch (error) {
    console.error('Error uploading popup image:', error);
    res.status(500).json({ success: false, error: 'Failed to upload image' });
  }
});

app.post('/admin/popup/start', adminAuth, (req, res) => {
  try {
    const { title, content } = req.body;
    dataStore.popupMessage.active = true;
    dataStore.popupMessage.title = title;
    dataStore.popupMessage.content = content;
    res.json({ success: true });
  } catch (error) {
    console.error('Error starting popup:', error);
    res.status(500).json({ success: false, error: 'Failed to start popup' });
  }
});

app.post('/admin/popup/end', adminAuth, (req, res) => {
  try {
    dataStore.popupMessage.active = false;
    res.json({ success: true });
  } catch (error) {
    console.error('Error ending popup:', error);
    res.status(500).json({ success: false, error: 'Failed to end popup' });
  }
});

app.get('/admin/popup/status', adminAuth, (req, res) => {
  try {
    res.json({
      active: dataStore.popupMessage.active,
      title: dataStore.popupMessage.title,
      content: dataStore.popupMessage.content,
      image: dataStore.popupMessage.image
    });
  } catch (error) {
    console.error('Error getting popup status:', error);
    res.status(500).json({ success: false, error: 'Failed to get popup status' });
  }
});

app.post('/admin/popup/remove-image', adminAuth, (req, res) => {
  try {
    dataStore.popupMessage.image = null;
    res.json({ success: true });
  } catch (error) {
    console.error('Error removing popup image:', error);
    res.status(500).json({ success: false, error: 'Failed to remove image' });
  }
});

// Admin Registration Actions
app.post('/admin/registrations/accept/:id', adminAuth, (req, res) => {
  const id = req.params.id;
  const registration = dataStore.pendingRegistrations.find(reg => reg.id === id);
  if (registration) {
    dataStore.users.push({ ...registration, status: 'accepted' });
    dataStore.pendingRegistrations = dataStore.pendingRegistrations.filter(reg => reg.id !== id);
  }
  res.redirect('/admin/registrations');
});

app.post('/admin/registrations/reject/:id', adminAuth, (req, res) => {
  const id = req.params.id;
  dataStore.pendingRegistrations = dataStore.pendingRegistrations.filter(reg => reg.id !== id);
  res.redirect('/admin/registrations');
});

// POST Routes for Admin Forms
app.post('/admin/tournaments', adminAuth, [
  body('name').notEmpty().withMessage('Tournament name is required').trim().escape(),
  body('startDate').optional().isDate().withMessage('Invalid start date format'),
  body('endDate').optional().isDate().withMessage('Invalid end date format'),
  body('type').isIn(['local', 'state', 'national', 'sarawak', 'wmalaysia']).withMessage('Invalid tournament type'),
  body('months').optional().isArray().withMessage('Months must be an array')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array()); // Debug log
    return res.render('pages/admin/manage-tournaments', {
      tournaments: dataStore.tournaments,
      session: req.session,
      errors: errors.array(),
      formData: req.body
    });
  }
  const { name, startDate, endDate, type, months } = req.body;
  console.log('Form data:', req.body); // Debug log
  const image = req.files?.image ? `/uploads/${req.files.image.name}` : null;
  if (image) req.files.image.mv(path.join(__dirname, 'public/uploads', req.files.image.name));
  
  // Handle both 'months' and 'months[]' field names
  const monthsData = months || req.body['months[]'];
  const monthsArray = monthsData ? (Array.isArray(monthsData) ? monthsData.map(Number) : [Number(monthsData)]) : [];
  console.log('Processed months:', monthsArray); // Debug log
  
  dataStore.tournaments.push({ name, startDate, endDate, type, months: monthsArray, image });
  res.redirect('/admin/tournaments');
});

// Delete tournament route
app.post('/admin/tournaments/delete/:index', adminAuth, (req, res) => {
  const index = parseInt(req.params.index);
  if (index >= 0 && index < dataStore.tournaments.length) {
    const deletedTournament = dataStore.tournaments.splice(index, 1)[0];
    console.log('Deleted tournament:', deletedTournament.name); // Debug log
  }
  res.redirect('/admin/tournaments');
});

app.post('/admin/rankings', adminAuth, [
  body('player').notEmpty().trim().escape(),
  body('rank').isInt({ min: 1 })
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send('Invalid input');
  const { player, rank } = req.body;
  dataStore.rankings.push({ player, rank });
  res.redirect('/admin/rankings');
});

app.post('/admin/sponsorships', adminAuth, [
  body('name').notEmpty().trim().escape(),
  body('details').trim().escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send('Invalid input');
  const { name, details } = req.body;
  dataStore.sponsorships.push({ name, details });
  res.redirect('/admin/sponsorships');
});

app.post('/admin/coaches', adminAuth, [
  body('name').notEmpty().trim().escape(),
  body('bio').trim().escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send('Invalid input');
  const { name, bio } = req.body;
  dataStore.coaches.push({ name, bio });
  res.redirect('/admin/coaches');
});

app.post('/admin/referees', adminAuth, [
  body('fullName').notEmpty().withMessage('Full name is required').trim().escape(),
  body('idNumber').notEmpty().withMessage('Identity card number is required').trim().escape(),
  body('experience').notEmpty().withMessage('Experience is required').trim().escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  
  try {
    const { fullName, idNumber, experience, refereeIndex } = req.body;
    
    // Handle profile image upload
    const profileImage = req.files?.profileImage ? `/uploads/${Date.now()}_${req.files.profileImage.name}` : null;
    if (profileImage) {
      req.files.profileImage.mv(path.join(__dirname, 'public/uploads', path.basename(profileImage)));
    }
    
    // Handle certificate document upload
    const certificateDocument = req.files?.certificateDocument ? `/uploads/${Date.now()}_${req.files.certificateDocument.name}` : null;
    if (certificateDocument) {
      req.files.certificateDocument.mv(path.join(__dirname, 'public/uploads', path.basename(certificateDocument)));
    }
    
    // If editing existing referee
    if (refereeIndex !== undefined && refereeIndex !== '') {
      const index = parseInt(refereeIndex);
      if (index >= 0 && index < dataStore.referees.length) {
        dataStore.referees[index] = { 
          ...dataStore.referees[index], 
          fullName, 
          idNumber,
          experience, 
          profileImage: profileImage || dataStore.referees[index].profileImage,
          certificateDocument: certificateDocument || dataStore.referees[index].certificateDocument
        };
      }
    } else {
      // Adding new referee
      if (!certificateDocument) {
        return res.status(400).json({ 
          success: false, 
          message: 'Certificate document is required for new referees' 
        });
      }
      
      const newReferee = { 
        fullName, 
        idNumber,
        experience, 
        profileImage,
        certificateDocument,
        dateAdded: new Date().toISOString(),
        status: 'active'
      };
      
      dataStore.referees.push(newReferee);
      console.log('New referee added:', newReferee);
    }
    
    res.redirect('/admin/referees');
  } catch (error) {
    console.error('Error adding/updating referee:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while processing referee data' 
    });
  }
});

// Delete referee route
app.delete('/admin/referees/:index', adminAuth, (req, res) => {
  try {
    const index = parseInt(req.params.index);
    if (index >= 0 && index < dataStore.referees.length) {
      const deletedReferee = dataStore.referees.splice(index, 1)[0];
      console.log('Deleted referee:', deletedReferee.name);
      res.json({ success: true, message: 'Referee removed successfully' });
    } else {
      res.status(404).json({ success: false, message: 'Referee not found' });
    }
  } catch (error) {
    console.error('Error deleting referee:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Upload referee image route
app.post('/admin/referees/upload-image', adminAuth, (req, res) => {
  try {
    const { refereeIndex } = req.body;
    const index = parseInt(refereeIndex);
    
    if (!req.files || !req.files.image) {
      return res.status(400).json({ success: false, message: 'No image uploaded' });
    }
    
    if (index < 0 || index >= dataStore.referees.length) {
      return res.status(404).json({ success: false, message: 'Referee not found' });
    }
    
    const image = `/uploads/${req.files.image.name}`;
    req.files.image.mv(path.join(__dirname, 'public/uploads', req.files.image.name));
    
    dataStore.referees[index].image = image;
    
    res.json({ 
      success: true, 
      message: 'Image updated successfully',
      imageUrl: image
    });
  } catch (error) {
    console.error('Error uploading referee image:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Accept referee application route
app.post('/admin/referees/accept-application', adminAuth, (req, res) => {
  try {
    const { name } = req.body;
    
    // In a real application, you would fetch this from a pending applications database
    // For demo purposes, we'll create a sample referee entry
    const newReferee = {
      name: name,
      experience: 'Professional referee with extensive tournament experience',
      image: null
    };
    
    dataStore.referees.push(newReferee);
    
    res.json({ 
      success: true, 
      message: `${name}'s application accepted successfully`
    });
  } catch (error) {
    console.error('Error accepting application:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Reject referee application route
app.post('/admin/referees/reject-application', adminAuth, (req, res) => {
  try {
    const { name } = req.body;
    
    // In a real application, you would remove from pending applications database
    // For demo purposes, we'll just return success
    
    res.json({ 
      success: true, 
      message: `${name}'s application rejected`
    });
  } catch (error) {
    console.error('Error rejecting application:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Referee application submission route
app.post('/referee/apply', [
  body('fullName').notEmpty().withMessage('Full name is required').trim().escape(),
  body('idNumber').notEmpty().withMessage('Identity card number is required').trim().escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('phone').notEmpty().withMessage('Phone number is required').trim().escape(),
  body('address').notEmpty().withMessage('Address is required').trim().escape(),
  body('yearsExperience').notEmpty().withMessage('Years of experience is required'),
  body('playingLevel').notEmpty().withMessage('Playing level is required'),
  body('motivation').notEmpty().withMessage('Motivation is required').trim().escape(),
  body('agreement').equals('on').withMessage('You must agree to the terms and conditions')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    return res.status(400).json({ 
      success: false, 
      message: 'Validation failed', 
      errors: errors.array() 
    });
  }
  
  try {
    const {
      fullName,
      idNumber,
      email,
      phone,
      address,
      yearsExperience,
      playingLevel,
      refereeExperience,
      motivation,
      tournamentTypes,
      comments
    } = req.body;
    
    // Handle file uploads
    const profilePhoto = req.files?.profilePhoto ? `/uploads/${Date.now()}_${req.files.profilePhoto.name}` : null;
    if (profilePhoto) {
      req.files.profilePhoto.mv(path.join(__dirname, 'public/uploads', path.basename(profilePhoto)));
    }
    
    const resume = req.files?.resume ? `/uploads/${Date.now()}_${req.files.resume.name}` : null;
    if (resume) {
      req.files.resume.mv(path.join(__dirname, 'public/uploads', path.basename(resume)));
    }
    
    // Validate required files
    if (!profilePhoto || !resume) {
      return res.status(400).json({ 
        success: false, 
        message: 'Profile photo and resume are required' 
      });
    }
    
    // Create application object
    const application = {
      id: Date.now().toString(),
      fullName,
      idNumber,
      email,
      phone,
      address,
      yearsExperience,
      playingLevel,
      refereeExperience: refereeExperience || '',
      motivation,
      tournamentTypes: Array.isArray(tournamentTypes) ? tournamentTypes : [tournamentTypes].filter(Boolean),
      comments: comments || '',
      profilePhoto,
      resume,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };
    
    // Store the application
    dataStore.refereeApplications.push(application);
    
    console.log('New referee application received:', application.fullName);
    
    res.json({ 
      success: true, 
      message: 'Application submitted successfully! We will review your application and contact you soon.',
      applicationId: application.id
    });
    
  } catch (error) {
    console.error('Error processing referee application:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while processing application. Please try again.' 
    });
  }
});

app.post('/admin/venues', adminAuth, [
  body('name').notEmpty().trim().escape(),
  body('address').trim().escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send('Invalid input');
  const { name, address } = req.body;
  dataStore.venues.push({ name, address });
  res.redirect('/admin/venues');
});

// Player Authentication Middleware
const playerAuth = (req, res, next) => {
  if (!req.session.isPlayerAuthenticated) {
    return res.redirect('/player/login');
  }
  
  // Check session timeout (2 hours)
  const now = Date.now();
  const loginTime = req.session.playerLoginTime || 0;
  const sessionTimeout = 2 * 60 * 60 * 1000;
  
  if (now - loginTime > sessionTimeout) {
    req.session.destroy(() => {
      res.redirect('/player/login?reason=timeout');
    });
    return;
  }
  
  // Update last activity
  req.session.playerLastActivity = now;
  next();
};

// PLAYER REGISTRATION ROUTES

// Show player registration form
app.get('/player/register', (req, res) => {
  res.render('pages/player-register', { 
    session: req.session, 
    backgroundImage: dataStore.backgroundImage,
    error: null,
    success: null
  });
});

// Handle player registration
app.post('/player/register', [
  body('fullName').notEmpty().withMessage('Full name is required').trim().escape(),
  body('icNumber').matches(/^[0-9]{6}-[0-9]{2}-[0-9]{4}$/).withMessage('Invalid IC format (123456-78-9012)'),
  body('age').isInt({ min: 12, max: 100 }).withMessage('Age must be between 12 and 100'),
  body('address').notEmpty().withMessage('Address is required').trim().escape(),
  body('phoneNumber').notEmpty().withMessage('Phone number is required').trim().escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('username').matches(/^[a-zA-Z0-9_]{3,20}$/).withMessage('Username must be 3-20 characters, letters, numbers, and underscores only'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('terms').equals('on').withMessage('You must agree to the terms and conditions')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('pages/player-register', {
      session: req.session,
      backgroundImage: dataStore.backgroundImage,
      error: errors.array()[0].msg,
      success: null
    });
  }

  try {
    const {
      fullName, icNumber, age, address, phoneNumber, email, username, password
    } = req.body;

    // Check if username already exists
    const existingPlayer = dataStore.players.find(p => p.username === username);
    const existingRegistration = dataStore.playerRegistrations.find(p => p.username === username);
    
    if (existingPlayer || existingRegistration) {
      return res.render('pages/player-register', {
        session: req.session,
        backgroundImage: dataStore.backgroundImage,
        error: 'Username already exists. Please choose a different username.',
        success: null
      });
    }

    // Check if IC already exists
    const existingIC = dataStore.players.find(p => p.icNumber === icNumber);
    const existingRegIC = dataStore.playerRegistrations.find(p => p.icNumber === icNumber);
    
    if (existingIC || existingRegIC) {
      return res.render('pages/player-register', {
        session: req.session,
        backgroundImage: dataStore.backgroundImage,
        error: 'Identity card number already registered.',
        success: null
      });
    }

    // Handle profile picture upload
    let profilePicture = null;
    if (req.files && req.files.profilePicture) {
      const file = req.files.profilePicture;
      const fileName = `${Date.now()}_${file.name}`;
      profilePicture = `/uploads/${fileName}`;
      file.mv(path.join(__dirname, 'public/uploads', fileName));
    }

    // Create registration object
    const registration = {
      id: Date.now().toString(),
      fullName,
      icNumber,
      age: parseInt(age),
      address,
      phoneNumber,
      email,
      username,
      password, // In production, hash this password!
      profilePicture,
      submittedAt: new Date().toISOString(),
      status: 'pending'
    };

    // Store registration
    dataStore.playerRegistrations.push(registration);

    console.log('New player registration received:', registration.fullName);

    res.render('pages/player-register', {
      session: req.session,
      backgroundImage: dataStore.backgroundImage,
      error: null,
      success: 'Registration submitted successfully! You will receive a notification once your application is approved by our admin team.'
    });

  } catch (error) {
    console.error('Error processing player registration:', error);
    res.render('pages/player-register', {
      session: req.session,
      backgroundImage: dataStore.backgroundImage,
      error: 'Server error while processing registration. Please try again.',
      success: null
    });
  }
});

// Show player login form
app.get('/player/login', (req, res) => {
  let error = null;
  const reason = req.query.reason;
  
  if (reason === 'timeout') {
    error = 'Your session has expired. Please login again.';
  } else if (reason === 'unauthorized') {
    error = 'You must be logged in to access that page.';
  }
  
  res.render('pages/player-login', { 
    error, 
    session: req.session,
    backgroundImage: dataStore.backgroundImage
  });
});

// Handle player login
app.post('/player/login', [
  body('username').notEmpty().withMessage('Username is required').trim(),
  body('password').notEmpty().withMessage('Password is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('pages/player-login', {
      error: 'Please fill in all fields.',
      session: req.session,
      backgroundImage: dataStore.backgroundImage
    });
  }

  const { username, password } = req.body;

  // Find player in approved players
  const player = dataStore.players.find(p => p.username === username && p.password === password);

  if (player) {
    req.session.isPlayerAuthenticated = true;
    req.session.playerId = player.id;
    req.session.playerUsername = player.username;
    req.session.playerLoginTime = Date.now();
    req.session.playerLastActivity = Date.now();
    
    res.redirect('/player/dashboard');
  } else {
    res.render('pages/player-login', {
      error: 'Invalid username or password. Please make sure your account has been approved.',
      session: req.session,
      backgroundImage: dataStore.backgroundImage
    });
  }
});

// Player dashboard
app.get('/player/dashboard', playerAuth, (req, res) => {
  const player = dataStore.players.find(p => p.id === req.session.playerId);
  
  if (!player) {
    req.session.destroy(() => {
      res.redirect('/player/login');
    });
    return;
  }

  // Get player's tournament participations (placeholder for future implementation)
  const playerTournaments = [];
  
  res.render('pages/player-dashboard', {
    player,
    playerTournaments,
    session: req.session,
    backgroundImage: dataStore.backgroundImage
  });
});

// Player logout
app.post('/player/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// Update player profile
app.post('/player/update-profile', playerAuth, [
  body('fullName').notEmpty().withMessage('Full name is required').trim().escape(),
  body('age').isInt({ min: 12, max: 100 }).withMessage('Age must be between 12 and 100'),
  body('address').notEmpty().withMessage('Address is required').trim().escape(),
  body('phoneNumber').notEmpty().withMessage('Phone number is required').trim().escape(),
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.json({ success: false, message: errors.array()[0].msg });
  }

  try {
    const player = dataStore.players.find(p => p.id === req.session.playerId);
    if (!player) {
      return res.json({ success: false, message: 'Player not found' });
    }

    const { fullName, age, address, phoneNumber, email } = req.body;

    // Update player information
    player.fullName = fullName;
    player.age = parseInt(age);
    player.address = address;
    player.phoneNumber = phoneNumber;
    player.email = email;

    // Handle profile picture update
    if (req.files && req.files.profilePicture) {
      const file = req.files.profilePicture;
      const fileName = `${Date.now()}_${file.name}`;
      player.profilePicture = `/uploads/${fileName}`;
      file.mv(path.join(__dirname, 'public/uploads', fileName));
    }

    res.json({ success: true, message: 'Profile updated successfully!' });

  } catch (error) {
    console.error('Error updating player profile:', error);
    res.json({ success: false, message: 'Server error while updating profile.' });
  }
});

// ADMIN ROUTES FOR PLAYER MANAGEMENT

// Show player registrations in admin dashboard
app.get('/admin/players', adminAuth, (req, res) => {
  res.render('pages/admin/manage-players', {
    playerRegistrations: dataStore.playerRegistrations,
    approvedPlayers: dataStore.players,
    session: req.session,
    backgroundImage: dataStore.backgroundImage
  });
});

// Approve player registration
app.post('/admin/players/approve', adminAuth, (req, res) => {
  try {
    const { registrationId } = req.body;
    
    const registration = dataStore.playerRegistrations.find(r => r.id === registrationId);
    if (!registration) {
      return res.json({ success: false, message: 'Registration not found' });
    }

    // Generate unique player ID
    const playerId = generatePlayerId();

    // Create approved player object
    const approvedPlayer = {
      id: playerId,
      fullName: registration.fullName,
      icNumber: registration.icNumber,
      age: registration.age,
      address: registration.address,
      phoneNumber: registration.phoneNumber,
      email: registration.email,
      username: registration.username,
      password: registration.password,
      profilePicture: registration.profilePicture,
      joinDate: new Date().toISOString(),
      status: 'active'
    };

    // Add to approved players
    dataStore.players.push(approvedPlayer);

    // Remove from pending registrations
    const index = dataStore.playerRegistrations.findIndex(r => r.id === registrationId);
    dataStore.playerRegistrations.splice(index, 1);

    console.log(`Player approved: ${approvedPlayer.fullName} (ID: ${playerId})`);

    res.json({ 
      success: true, 
      message: `${approvedPlayer.fullName} approved successfully! Player ID: ${playerId}` 
    });

  } catch (error) {
    console.error('Error approving player:', error);
    res.json({ success: false, message: 'Server error while approving player.' });
  }
});

// Reject player registration
app.post('/admin/players/reject', adminAuth, (req, res) => {
  try {
    const { registrationId } = req.body;
    
    const registration = dataStore.playerRegistrations.find(r => r.id === registrationId);
    if (!registration) {
      return res.json({ success: false, message: 'Registration not found' });
    }

    // Remove from pending registrations
    const index = dataStore.playerRegistrations.findIndex(r => r.id === registrationId);
    dataStore.playerRegistrations.splice(index, 1);

    console.log(`Player registration rejected: ${registration.fullName}`);

    res.json({ 
      success: true, 
      message: `${registration.fullName}'s registration has been rejected.` 
    });

  } catch (error) {
    console.error('Error rejecting player:', error);
    res.json({ success: false, message: 'Server error while rejecting registration.' });
  }
});

// =============================================
// MILESTONE API ROUTES
// =============================================

// Get all milestones (admin)
app.get('/api/milestones', adminAuth, (req, res) => {
  try {
    res.json({ success: true, milestones: dataStore.milestones });
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch milestones' });
  }
});

// Get published milestones (public)
app.get('/api/milestones/published', (req, res) => {
  try {
    const publishedMilestones = dataStore.milestones.filter(m => m.status === 'published');
    res.json({ success: true, milestones: publishedMilestones });
  } catch (error) {
    console.error('Error fetching published milestones:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch milestones' });
  }
});

// Get milestone by ID
app.get('/api/milestones/:id', adminAuth, (req, res) => {
  try {
    const milestone = dataStore.milestones.find(m => m.id == req.params.id);
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
app.post('/api/milestones', adminAuth, (req, res) => {
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
      const fileName = `milestone_${Date.now()}_${imageFile.name}`;
      imagePath = `/uploads/${fileName}`;
      
      // Move file to uploads directory
      imageFile.mv(path.join(__dirname, 'public/uploads', fileName));
    }

    const milestone = {
      id: generateMilestoneId(),
      title: title.trim(),
      description: description.trim(),
      date: date,
      category: category || 'achievement',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      status,
      image: imagePath,
      createdBy: req.session.username || 'admin',
      createdAt: new Date().toISOString()
    };

    dataStore.milestones.push(milestone);
    
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
app.put('/api/milestones/:id', adminAuth, (req, res) => {
  try {
    const milestoneIndex = dataStore.milestones.findIndex(m => m.id == req.params.id);
    
    if (milestoneIndex === -1) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    const { title, description, date, category, tags, status } = req.body;
    const milestone = dataStore.milestones[milestoneIndex];
    
    // Update fields
    if (title) milestone.title = title.trim();
    if (description) milestone.description = description.trim();
    if (date) milestone.date = date;
    if (category) milestone.category = category;
    if (tags) milestone.tags = tags.split(',').map(tag => tag.trim());
    if (status) milestone.status = status;
    milestone.updatedBy = req.session.username;
    milestone.updatedAt = new Date().toISOString();

    // Handle image upload
    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      const fileName = `milestone_${Date.now()}_${imageFile.name}`;
      milestone.image = `/uploads/${fileName}`;
      
      // Move file to uploads directory
      imageFile.mv(path.join(__dirname, 'public/uploads', fileName));
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
app.delete('/api/milestones/:id', adminAuth, (req, res) => {
  try {
    const milestoneIndex = dataStore.milestones.findIndex(m => m.id == req.params.id);
    
    if (milestoneIndex === -1) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    dataStore.milestones.splice(milestoneIndex, 1);

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
app.patch('/api/milestones/:id/toggle-status', adminAuth, (req, res) => {
  try {
    const milestone = dataStore.milestones.find(m => m.id == req.params.id);
    
    if (!milestone) {
      return res.status(404).json({ success: false, message: 'Milestone not found' });
    }

    milestone.status = milestone.status === 'published' ? 'draft' : 'published';
    milestone.updatedBy = req.session.username;
    milestone.updatedAt = new Date().toISOString();

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

// Profile route
app.get('/profile', (req, res) => {
  // Check if user is logged in
  if (!req.session || (!req.session.isAuthenticated && !req.session.isPlayerAuthenticated)) {
    return res.redirect('/login');
  }
  
  // Determine user type and data
  let userData = null;
  let userType = 'guest';
  
  if (req.session.isAuthenticated) {
    // Admin user
    userType = 'admin';
    userData = {
      username: 'admin',
      role: 'Administrator',
      loginTime: req.session.loginTime || new Date().toISOString()
    };
  } else if (req.session.isPlayerAuthenticated) {
    // Player user
    userType = 'player';
    userData = req.session.playerData || {
      username: 'Player',
      role: 'Player',
      loginTime: req.session.loginTime || new Date().toISOString()
    };
  }
  
  res.render('pages/profile', { 
    session: req.session, 
    userData: userData,
    userType: userType,
    backgroundImage: dataStore.backgroundImage 
  });
});

// 404 Handler
app.use((req, res) => res.status(404).render('pages/404', { session: req.session }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));