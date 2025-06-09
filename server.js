const express = require('express');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const session = require('express-session');
const path = require('path');
const puppeteer = require('puppeteer');
const app = express();

// In-memory data store (replace with database in production)
const dataStore = {
  tournaments: [
    { name: 'KGM Autumn Tournament', startDate: '2025-11-01', endDate: '2025-11-03', type: 'local', months: [10], image: null },
    { name: 'MPR@KL (SUKMA)', startDate: '2025-04-26', endDate: '2025-04-28', type: 'state', months: [3], image: null },
    { name: 'SPA Grand Finals', startDate: '2025-11-10', endDate: '2025-11-12', type: 'national', months: [10], image: null },
    { name: 'IOP Johor', startDate: '2025-03-20', endDate: '2025-03-22', type: 'international', months: [2], image: null }
  ],
  coaches: [],
  referees: [],
  refereeApplications: [],
  venues: [],
  sponsorships: [],
  rankings: [],
  pendingRegistrations: [],
  users: [],
  backgroundImage: null,
  popupMessage: {
    active: false,
    title: '',
    content: '',
    image: null
  }
};

// Color mapping for tournament types
const tournamentTypes = {
  local: { color: 'green', label: 'Local' },
  state: { color: 'red', label: 'State' },
  national: { color: 'blue', label: 'National' },
  international: { color: 'yellow', label: 'International/Major Quarters' }
};

// Middleware
app.use(helmet()); // Security headers
app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Parse JSON bodies
app.use(fileUpload());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(session({
  secret: 'pickleball_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
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
      args: ['--no-sandbox', '--disable-setuid-sandbox']
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

// PDF Download Route
app.get('/tournament/download-pdf', async (req, res) => {
  let browser = null;
  
  try {
    console.log('Starting PDF generation...');
    
    // Format tournaments for PDF
    const formattedTournaments = dataStore.tournaments.map(t => ({
      ...t,
      color: tournamentTypes[t.type]?.color || 'green'
    }));
    
    console.log('Formatted tournaments:', formattedTournaments.length);
    
    // Launch puppeteer with Windows-compatible options
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-ipc-flooding-protection'
      ],
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
      }, 10000);
      
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
    
    // Set page content with simplified options
    console.log('Setting page content...');
    await page.setContent(htmlContent, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Wait for content to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('Generating PDF...');
    // Generate PDF with basic settings
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
    
    console.log('PDF generated, size:', pdfBuffer.length, 'bytes');
    
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
    
  } catch (error) {
    console.error('PDF generation error:', error);
    
    // Send error response
    if (!res.headersSent) {
      res.status(500).json({ 
        error: 'Failed to generate PDF', 
        details: error.message 
      });
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

app.get('/referee', (req, res) => res.render('pages/referee', { referees: dataStore.referees, session: req.session, backgroundImage: dataStore.backgroundImage }));
app.get('/coaches', (req, res) => res.render('pages/coaches', { coaches: dataStore.coaches, session: req.session, backgroundImage: dataStore.backgroundImage }));
app.get('/venue', (req, res) => res.render('pages/venue', { venues: dataStore.venues, session: req.session, backgroundImage: dataStore.backgroundImage }));
app.get('/services/sponsorship', (req, res) => res.render('pages/services/sponsorship', { sponsorships: dataStore.sponsorships, session: req.session, backgroundImage: dataStore.backgroundImage }));
app.get('/services/registration', (req, res) => res.render('pages/services/registration', { tournaments: dataStore.tournaments, session: req.session, backgroundImage: dataStore.backgroundImage }));
app.get('/services/requirement-approval', (req, res) => res.render('pages/services/requirement-approval', { session: req.session, backgroundImage: dataStore.backgroundImage }));
app.get('/services/requirement-bidding', (req, res) => res.render('pages/services/requirement-bidding', { session: req.session, backgroundImage: dataStore.backgroundImage }));
app.get('/services/application-organizing', (req, res) => res.render('pages/services/application-organizing', { session: req.session, backgroundImage: dataStore.backgroundImage }));
app.get('/services/application-bidding', (req, res) => res.render('pages/services/application-bidding', { session: req.session, backgroundImage: dataStore.backgroundImage }));
app.get('/services/section-33', (req, res) => res.render('pages/services/section-33', { session: req.session, backgroundImage: dataStore.backgroundImage }));
app.get('/services/section-34', (req, res) => res.render('pages/services/section-34', { session: req.session, backgroundImage: dataStore.backgroundImage }));
app.get('/services/section-36', (req, res) => res.render('pages/services/section-36', { session: req.session, backgroundImage: dataStore.backgroundImage }));
app.get('/services/ranking', (req, res) => res.render('pages/services/ranking', { rankings: dataStore.rankings, session: req.session, backgroundImage: dataStore.backgroundImage }));

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
  body('type').isIn(['local', 'state', 'national', 'international']).withMessage('Invalid tournament type'),
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

// 404 Handler
app.use((req, res) => res.status(404).render('pages/404', { session: req.session }));

app.listen(3000, () => console.log('Server running on http://localhost:3000'));