const express = require('express');
const fileUpload = require('express-fileupload');
const helmet = require('helmet');
const { body, validationResult } = require('express-validator');
const session = require('express-session');
const path = require('path');
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
  venues: [],
  sponsorships: [],
  rankings: [],
  pendingRegistrations: [],
  users: [],
  backgroundImage: null
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

// Admin authentication middleware
const adminAuth = (req, res, next) => {
  if (req.session.isAuthenticated) return next();
  res.redirect('/login');
};

// Routes
app.get('/', (req, res) => res.render('pages/home', { session: req.session, backgroundImage: dataStore.backgroundImage }));

app.get('/tournament', (req, res) => {
  console.log('Tournaments:', dataStore.tournaments); // Debug log
  const formattedTournaments = dataStore.tournaments.map(t => ({
    ...t,
    color: tournamentTypes[t.type]?.color || 'green'
  }));
  res.render('pages/tournament', { tournaments: formattedTournaments, session: req.session, backgroundImage: dataStore.backgroundImage });
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
  res.render('pages/login', { error: null, session: req.session });
});

app.post('/login', [
  body('username').notEmpty().trim(),
  body('password').notEmpty()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.render('pages/login', { error: 'Invalid input', session: req.session });
  }
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    req.session.isAuthenticated = true;
    res.redirect('/admin/dashboard');
  } else {
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
app.get('/admin/home', adminAuth, (req, res) => res.render('pages/admin/manage-home', { backgroundImage: dataStore.backgroundImage, session: req.session }));
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
  body('name').notEmpty().trim().escape(),
  body('experience').trim().escape()
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).send('Invalid input');
  const { name, experience } = req.body;
  dataStore.referees.push({ name, experience });
  res.redirect('/admin/referees');
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