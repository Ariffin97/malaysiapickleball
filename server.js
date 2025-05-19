const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const bcrypt = require('bcrypt');
const multer = require('multer');
const app = express();
const port = process.env.PORT || 3000;

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(helmet());
app.use(compression());
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(express.static(path.join(__dirname, 'public'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.png') || path.endsWith('.jpg') || path.endsWith('.webp')) {
      res.setHeader('Cache-Control', 'public, max-age=31536000');
    }
  }
}));
app.use(session({
  secret: 'admin123', // Replace with a strong secret
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // Set to true in production with HTTPS
}));

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/images');
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|webp/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only images (JPEG, PNG, WebP) are allowed'));
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.authenticated) {
    return next();
  }
  res.redirect('/admin/login');
};

// Routes
app.get('/', async (req, res) => {
  try {
    const [tournaments, news, coaches, courts, referees] = await Promise.all([
      fs.readFile('data/tournaments.json').then(JSON.parse),
      fs.readFile('data/news.json').then(JSON.parse),
      fs.readFile('data/coaches.json').then(JSON.parse),
      fs.readFile('data/courts.json').then(JSON.parse),
      fs.readFile('data/referees.json').then(JSON.parse)
    ]);
    res.render('index', { tournaments, news, coaches, courts, referees });
  } catch (err) {
    console.error('Server Error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// Admin Login
app.get('/admin/login', (req, res) => {
  res.render('admin', { section: 'login', error: null });
});

app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admins = await fs.readFile('data/admin.json').then(JSON.parse);
    const admin = admins.find(a => a.username === username);
    if (admin && await bcrypt.compare(password, admin.password)) {
      req.session.authenticated = true;
      res.redirect('/admin/dashboard');
    } else {
      res.render('admin', { section: 'login', error: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Login Error:', err);
    res.render('admin', { section: 'login', error: 'Server error' });
  }
});

// Admin Logout
app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/admin/login');
});

// Admin Dashboard
app.get('/admin/dashboard', isAuthenticated, async (req, res) => {
  try {
    const [tournaments, news, coaches, courts, referees] = await Promise.all([
      fs.readFile('data/tournaments.json').then(JSON.parse),
      fs.readFile('data/news.json').then(JSON.parse),
      fs.readFile('data/coaches.json').then(JSON.parse),
      fs.readFile('data/courts.json').then(JSON.parse),
      fs.readFile('data/referees.json').then(JSON.parse)
    ]);
    res.render('admin', { section: 'dashboard', tournaments, news, coaches, courts, referees, error: null });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).send('Internal Server Error');
  }
});

// CRUD Routes (Example for Tournaments)
app.post('/admin/tournaments/add', isAuthenticated, async (req, res) => {
  try {
    const { name, date, location } = req.body;
    const tournaments = await fs.readFile('data/tournaments.json').then(JSON.parse);
    tournaments.push({ name, date, location });
    await fs.writeFile('data/tournaments.json', JSON.stringify(tournaments, null, 2));
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Add Tournament Error:', err);
    res.redirect('/admin/dashboard');
  }
});

app.post('/admin/tournaments/delete/:index', isAuthenticated, async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    let tournaments = await fs.readFile('data/tournaments.json').then(JSON.parse);
    tournaments = tournaments.filter((_, i) => i !== index);
    await fs.writeFile('data/tournaments.json', JSON.stringify(tournaments, null, 2));
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Delete Tournament Error:', err);
    res.redirect('/admin/dashboard');
  }
});

// CRUD for Coaches with Image Upload
app.post('/admin/coaches/add', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { name, experience, contact } = req.body;
    const image = req.file ? `/images/${req.file.filename}` : '/images/fallback.jpg';
    const coaches = await fs.readFile('data/coaches.json').then(JSON.parse);
    coaches.push({ name, experience, contact, image });
    await fs.writeFile('data/coaches.json', JSON.stringify(coaches, null, 2));
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Add Coach Error:', err);
    res.redirect('/admin/dashboard');
  }
});

app.post('/admin/coaches/delete/:index', isAuthenticated, async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    let coaches = await fs.readFile('data/coaches.json').then(JSON.parse);
    coaches = coaches.filter((_, i) => i !== index);
    await fs.writeFile('data/coaches.json', JSON.stringify(coaches, null, 2));
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Delete Coach Error:', err);
    res.redirect('/admin/dashboard');
  }
});

// CRUD for Courts with Image Upload
app.post('/admin/courts/add', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { name, address, facilities } = req.body;
    const image = req.file ? `/images/${req.file.filename}` : '/images/fallback.jpg';
    const courts = await fs.readFile('data/courts.json').then(JSON.parse);
    const id = courts.length ? Math.max(...courts.map(c => c.id)) + 1 : 1;
    courts.push({ id, name, address, facilities, image });
    await fs.writeFile('data/courts.json', JSON.stringify(courts, null, 2));
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Add Court Error:', err);
    res.redirect('/admin/dashboard');
  }
});

app.post('/admin/courts/delete/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let courts = await fs.readFile('data/courts.json').then(JSON.parse);
    courts = courts.filter(c => c.id !== id);
    await fs.writeFile('data/courts.json', JSON.stringify(courts, null, 2));
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Delete Court Error:', err);
    res.redirect('/admin/dashboard');
  }
});

// CRUD for Referees with Image Upload
app.post('/admin/referees/add', isAuthenticated, upload.single('image'), async (req, res) => {
  try {
    const { name, certification } = req.body;
    const image = req.file ? `/images/${req.file.filename}` : '/images/fallback.jpg';
    const referees = await fs.readFile('data/referees.json').then(JSON.parse);
    const id = referees.length ? Math.max(...referees.map(r => r.id)) + 1 : 1;
    referees.push({ id, name, certification, image });
    await fs.writeFile('data/referees.json', JSON.stringify(referees, null, 2));
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Add Referee Error:', err);
    res.redirect('/admin/dashboard');
  }
});

app.post('/admin/referees/delete/:id', isAuthenticated, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let referees = await fs.readFile('data/referees.json').then(JSON.parse);
    referees = referees.filter(r => r.id !== id);
    await fs.writeFile('data/referees.json', JSON.stringify(referees, null, 2));
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Delete Referee Error:', err);
    res.redirect('/admin/dashboard');
  }
});

// CRUD for News
app.post('/admin/news/add', isAuthenticated, async (req, res) => {
  try {
    const { title, date, description } = req.body;
    const news = await fs.readFile('data/news.json').then(JSON.parse);
    news.push({ title, date, description });
    await fs.writeFile('data/news.json', JSON.stringify(news, null, 2));
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Add News Error:', err);
    res.redirect('/admin/dashboard');
  }
});

app.post('/admin/news/delete/:index', isAuthenticated, async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    let news = await fs.readFile('data/news.json').then(JSON.parse);
    news = news.filter((_, i) => i !== index);
    await fs.writeFile('data/news.json', JSON.stringify(news, null, 2));
    res.redirect('/admin/dashboard');
  } catch (err) {
    console.error('Delete News Error:', err);
    res.redirect('/admin/dashboard');
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});