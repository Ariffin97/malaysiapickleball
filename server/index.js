import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';
import nodemailer from 'nodemailer';
import fs from 'fs';
import cloudinary, { journeyStorage, newsStorage, profileStorage } from './cloudinaryConfig.js';

// Load .env.local if it exists (for local development), otherwise load .env (production)
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('📝 Loading .env.local (LOCAL DEVELOPMENT MODE)');
  dotenv.config({ path: envLocalPath, override: true });
} else {
  console.log('📝 Loading .env (PRODUCTION MODE)');
  dotenv.config();
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app (for production)
app.use(express.static(path.join(__dirname, '../dist')));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/malaysia-pickleball';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Email Configuration
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Tournament Schema - Local copy synced with Portal
const tournamentSchema = new mongoose.Schema({
  // Portal reference
  applicationId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  // Tournament Details
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['local', 'state', 'national', 'international'],
    required: true
  },
  color: {
    type: String,
    default: 'blue'
  },
  startDate: {
    type: Date,
    required: true,
    index: true
  },
  endDate: {
    type: Date,
    required: true
  },
  venue: {
    type: String,
    required: true
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },

  // Organizer Info
  organizer: {
    type: String,
    required: true
  },
  personInCharge: String,
  phoneNumber: String,
  contactEmail: {
    type: String,
    required: true
  },

  // Event Details
  description: String,
  classification: {
    type: String,
    enum: ['District', 'Divisional', 'State', 'National', 'International']
  },
  eventType: {
    type: String,
    enum: ['Open', 'Closed']
  },
  expectedParticipants: Number,
  categories: [{
    category: String,
    malaysianEntryFee: Number,
    internationalEntryFee: Number
  }],
  scoringFormat: {
    type: String,
    default: 'traditional'
  },

  // Sync metadata
  status: {
    type: String,
    default: 'Approved',
    enum: ['Approved', 'Pending Review', 'Under Review', 'Rejected', 'Archived']
  },
  lastSyncedAt: {
    type: Date,
    default: Date.now
  },
  portalData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for performance
tournamentSchema.index({ startDate: 1, status: 1 });
tournamentSchema.index({ state: 1, status: 1 });
tournamentSchema.index({ type: 1, status: 1 });

const Tournament = mongoose.model('Tournament', tournamentSchema);

// Featured Video Schema
const featuredVideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  videoUrl: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

const FeaturedVideo = mongoose.model('FeaturedVideo', featuredVideoSchema);

// Milestone Schema (Journey)
const milestoneSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String, // Cloudinary URL
    default: null
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for date (removed duplicate index: true from field definition)
milestoneSchema.index({ date: 1 });

const Milestone = mongoose.model('Milestone', milestoneSchema);

// News Schema
const newsSchema = new mongoose.Schema({
  newsId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  summary: String,
  content: {
    type: String,
    required: true
  },
  publishDate: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'Draft', 'Published', 'Archived'],
    default: 'published'
  },
  media: [{
    type: {
      type: String,
      enum: ['image', 'video']
    },
    url: String,
    caption: String
  }]
}, {
  timestamps: true
});

newsSchema.index({ status: 1, publishDate: -1 });

const News = mongoose.model('News', newsSchema);

// Player Schema
const playerSchema = new mongoose.Schema({
  playerId: {
    type: String,
    unique: true,
    index: true
  },
  fullName: {
    type: String,
    required: true
  },
  profilePicture: String,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  icNumber: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  age: {
    type: Number,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  phoneNumber: {
    type: String,
    required: true
  },
  addressLine1: {
    type: String,
    required: true
  },
  addressLine2: String,
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  password: {
    type: String,
    required: true
  },
  termsAccepted: {
    type: Boolean,
    default: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  duprRating: {
    type: Number,
    default: null
  },
  duprId: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

const Player = mongoose.model('Player', playerSchema);

// Message Schema
const messageSchema = new mongoose.Schema({
  playerId: {
    type: String,
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Message = mongoose.model('Message', messageSchema);

// Course Schema
const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  coach: {
    type: String,
    required: true
  },
  maxParticipants: {
    type: Number,
    required: true
  },
  enrolled: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
  }
}, {
  timestamps: true
});

const Course = mongoose.model('Course', courseSchema);

// Clinic Schema
const clinicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  date: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  coach: {
    type: String,
    required: true
  },
  maxParticipants: {
    type: Number,
    required: true
  },
  enrolled: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'completed'],
    default: 'active'
  }
}, {
  timestamps: true
});

const Clinic = mongoose.model('Clinic', clinicSchema);

// Function to generate unique MPA ID (MPA + 5 alphanumeric characters)
async function generateMpaId() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let playerId;
  let isUnique = false;

  while (!isUnique) {
    // Generate 5 random alphanumeric characters
    let randomChars = '';
    for (let i = 0; i < 5; i++) {
      randomChars += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    playerId = `MPA${randomChars}`;

    // Check if this ID already exists
    const existing = await Player.findOne({ playerId });
    if (!existing) {
      isUnique = true;
    }
  }

  return playerId;
}

// Function to calculate skill level from DUPR rating
function calculateSkillLevel(duprRating) {
  if (!duprRating || duprRating <= 0) {
    return 'Beginner';
  }

  if (duprRating <= 2.499) {
    return 'Novice';
  } else if (duprRating <= 2.999) {
    return 'Intermediate';
  } else if (duprRating <= 3.499) {
    return 'Intermediate+';
  } else if (duprRating <= 3.999) {
    return 'Advanced';
  } else if (duprRating <= 4.499) {
    return 'Advanced+';
  } else {
    return 'Elite';
  }
}

// Multer configuration for player profile pictures
const uploadPlayerImage = multer({ storage: profileStorage });

// Multer configuration for journey images
const uploadJourneyImage = multer({ storage: journeyStorage });

// Multer configuration for news images
const uploadNewsImage = multer({ storage: newsStorage });

// Portal API Configuration
const PORTAL_API_URL = process.env.PORTAL_API_URL || 'https://portalmpa.com/api';

// Helper function to sync with Portal
async function syncWithPortal(applicationId) {
  try {
    const response = await fetch(`${PORTAL_API_URL}/applications/${applicationId}`);

    if (!response.ok) {
      throw new Error(`Portal API error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error syncing with portal:', error);
    throw error;
  }
}

// Helper function to map portal data to local format
function mapPortalToLocal(portalTournament) {
  const typeMap = {
    'District': 'local',
    'Divisional': 'local',
    'State': 'state',
    'National': 'national',
    'International': 'international'
  };

  const colorMap = {
    'local': 'green',
    'state': 'red',
    'national': 'blue',
    'international': 'orange'
  };

  const type = typeMap[portalTournament.classification] || 'local';

  return {
    applicationId: portalTournament.applicationId,
    name: portalTournament.eventTitle,
    type: type,
    color: colorMap[type],
    startDate: portalTournament.eventStartDate,
    endDate: portalTournament.eventEndDate,
    venue: portalTournament.venue,
    city: portalTournament.city,
    state: portalTournament.state,
    organizer: portalTournament.organiserName,
    personInCharge: portalTournament.personInCharge,
    phoneNumber: portalTournament.telContact,
    contactEmail: portalTournament.email,
    description: portalTournament.eventSummary,
    classification: portalTournament.classification,
    eventType: portalTournament.eventType,
    expectedParticipants: portalTournament.expectedParticipants,
    categories: portalTournament.categories,
    scoringFormat: portalTournament.scoringFormat,
    status: portalTournament.status || 'Approved', // Use actual status from portal
    lastSyncedAt: new Date(),
    portalData: portalTournament
  };
}

// API Routes

// Get all approved tournaments (from local DB)
app.get('/api/tournaments', async (req, res) => {
  try {
    const { state, type, upcoming } = req.query;

    let query = { status: 'Approved' };

    if (state) query.state = state;
    if (type) query.type = type;
    if (upcoming === 'true') {
      query.startDate = { $gte: new Date() };
    }

    const tournaments = await Tournament.find(query)
      .sort({ startDate: 1 })
      .lean();

    res.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single tournament by ID
app.get('/api/tournaments/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findOne({
      applicationId: req.params.id,
      status: 'Approved'
    }).lean();

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    res.json(tournament);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete tournament by applicationId
app.delete('/api/tournaments/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findOneAndDelete({
      applicationId: req.params.id
    });

    if (!tournament) {
      return res.status(404).json({ error: 'Tournament not found' });
    }

    console.log('✅ Tournament deleted:', tournament.name);
    res.json({ success: true, message: 'Tournament deleted successfully' });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    res.status(500).json({ error: error.message });
  }
});

// Cleanup endpoint - Remove all non-approved tournaments
app.post('/api/tournaments/cleanup', async (req, res) => {
  try {
    console.log('🧹 Cleaning up non-approved tournaments...');

    // Find all tournaments that are NOT approved
    const nonApprovedTournaments = await Tournament.find({
      status: { $ne: 'Approved' }
    });

    const count = nonApprovedTournaments.length;
    const tournamentNames = nonApprovedTournaments.map(t => ({
      applicationId: t.applicationId,
      name: t.name,
      status: t.status
    }));

    // Delete all non-approved tournaments
    const result = await Tournament.deleteMany({
      status: { $ne: 'Approved' }
    });

    console.log(`✅ Cleanup complete: ${result.deletedCount} non-approved tournaments removed`);

    res.json({
      success: true,
      message: `Removed ${result.deletedCount} non-approved tournaments`,
      deletedCount: result.deletedCount,
      deletedTournaments: tournamentNames
    });
  } catch (error) {
    console.error('Error cleaning up tournaments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sync approved tournaments from Portal
app.post('/api/tournaments/sync', async (req, res) => {
  try {
    console.log('🔄 Syncing tournaments from Portal...');

    // Fetch approved tournaments from Portal
    const response = await fetch(`${PORTAL_API_URL}/approved-tournaments`);

    if (!response.ok) {
      throw new Error(`Portal API error: ${response.status}`);
    }

    const portalTournaments = await response.json();

    let created = 0;
    let updated = 0;
    let skipped = 0;

    // Sync each tournament - ONLY if status is 'Approved'
    for (const portalTournament of portalTournaments) {
      // Explicitly check if tournament is approved
      // Skip pending review, under review, rejected, or any other status
      if (portalTournament.status !== 'Approved') {
        console.log(`⏭️ Skipping tournament ${portalTournament.applicationId} - Status: ${portalTournament.status}`);
        skipped++;
        continue;
      }

      const localData = mapPortalToLocal(portalTournament);

      const result = await Tournament.findOneAndUpdate(
        { applicationId: portalTournament.applicationId },
        localData,
        { upsert: true, new: true }
      );

      if (result.createdAt === result.updatedAt) {
        created++;
      } else {
        updated++;
      }
    }

    console.log(`✅ Sync complete: ${created} created, ${updated} updated, ${skipped} skipped`);

    res.json({
      success: true,
      created,
      updated,
      skipped,
      total: portalTournaments.length
    });
  } catch (error) {
    console.error('Error syncing tournaments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Webhook endpoint for Portal updates (real-time sync)
app.post('/api/webhooks/tournament-updated', async (req, res) => {
  try {
    const { tournament, action } = req.body;

    console.log(`🔔 Webhook received: ${action} for tournament ${tournament.applicationId}`);

    if (action === 'deleted') {
      // Delete the tournament locally
      await Tournament.findOneAndDelete({
        applicationId: tournament.applicationId
      });
      console.log(`🗑️ Tournament ${tournament.applicationId} deleted from local database`);
    } else {
      // Sync from Portal
      const portalData = await syncWithPortal(tournament.applicationId);

      // ONLY sync if the tournament is approved
      // If status is pending review, under review, or rejected - delete from local DB
      if (portalData.status !== 'Approved') {
        console.log(`❌ Tournament ${tournament.applicationId} status is ${portalData.status} - removing from local database`);
        await Tournament.findOneAndDelete({
          applicationId: tournament.applicationId
        });
      } else {
        // Tournament is approved - sync it
        const localData = mapPortalToLocal(portalData);
        await Tournament.findOneAndUpdate(
          { applicationId: tournament.applicationId },
          localData,
          { upsert: true }
        );
        console.log(`✅ Tournament ${tournament.applicationId} synced successfully`);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Featured Video Routes
// Get featured video
app.get('/api/featured-video', async (req, res) => {
  try {
    const video = await FeaturedVideo.findOne().sort({ createdAt: -1 }).lean();

    if (!video) {
      return res.status(404).json({ error: 'No featured video found' });
    }

    res.json(video);
  } catch (error) {
    console.error('Error fetching featured video:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create or update featured video
app.post('/api/featured-video', async (req, res) => {
  try {
    const { title, description, videoUrl } = req.body;

    if (!title || !videoUrl) {
      return res.status(400).json({ error: 'Title and video URL are required' });
    }

    // Delete all existing videos and create a new one (only one featured video at a time)
    await FeaturedVideo.deleteMany({});

    const video = await FeaturedVideo.create({
      title,
      description,
      videoUrl
    });

    console.log('✅ Featured video updated:', video.title);
    res.json(video);
  } catch (error) {
    console.error('Error saving featured video:', error);
    res.status(500).json({ error: error.message });
  }
});

// Journey Milestones Routes
// Get all milestones (sorted by date)
app.get('/api/milestones', async (req, res) => {
  try {
    const milestones = await Milestone.find()
      .sort({ date: 1 }) // Sort by date ascending (oldest to newest)
      .lean();

    res.json(milestones);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single milestone by ID
app.get('/api/milestones/:id', async (req, res) => {
  try {
    // Validate ID parameter
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'Invalid milestone ID' });
    }

    // Validate if it's a valid MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid milestone ID format' });
    }

    const milestone = await Milestone.findById(req.params.id).lean();

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    res.json(milestone);
  } catch (error) {
    console.error('Error fetching milestone:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new milestone
app.post('/api/milestones', uploadJourneyImage.single('milestoneImage'), async (req, res) => {
  try {
    const { date, title, description, order } = req.body;

    if (!date || !title || !description) {
      return res.status(400).json({ error: 'Date, title, and description are required' });
    }

    const milestoneData = {
      date: new Date(date),
      title,
      description,
      order: order || 0,
      image: req.file ? req.file.path : null
    };

    const milestone = await Milestone.create(milestoneData);

    console.log('✅ Milestone created:', milestone.title);
    res.status(201).json(milestone);
  } catch (error) {
    console.error('Error creating milestone:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update milestone
app.patch('/api/milestones/:id', uploadJourneyImage.single('milestoneImage'), async (req, res) => {
  try {
    // Validate ID parameter
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'Invalid milestone ID' });
    }

    // Validate if it's a valid MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid milestone ID format' });
    }

    const { date, title, description, order } = req.body;

    const updateData = {};
    if (date) updateData.date = new Date(date);
    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (order !== undefined) updateData.order = order;
    if (req.file) updateData.image = req.file.path;

    const milestone = await Milestone.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    console.log('✅ Milestone updated:', milestone.title);
    res.json(milestone);
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete milestone
app.delete('/api/milestones/:id', async (req, res) => {
  try {
    // Validate ID parameter
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'Invalid milestone ID' });
    }

    // Validate if it's a valid MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid milestone ID format' });
    }

    const milestone = await Milestone.findByIdAndDelete(req.params.id);

    if (!milestone) {
      return res.status(404).json({ error: 'Milestone not found' });
    }

    console.log('✅ Milestone deleted:', milestone.title);
    res.json({ success: true, message: 'Milestone deleted successfully' });
  } catch (error) {
    console.error('Error deleting milestone:', error);
    res.status(500).json({ error: error.message });
  }
});

// News Routes
// Get all news (with optional filters)
app.get('/api/news', async (req, res) => {
  try {
    const { status, limit } = req.query;

    let query = {};
    if (status) query.status = status;

    const newsLimit = limit ? parseInt(limit) : 50;

    const news = await News.find(query)
      .sort({ publishDate: -1 })
      .limit(newsLimit)
      .lean();

    res.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single news by newsId
app.get('/api/news/:newsId', async (req, res) => {
  try {
    const news = await News.findOne({ newsId: req.params.newsId }).lean();

    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    res.json(news);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new news
app.post('/api/news', uploadNewsImage.single('newsImage'), async (req, res) => {
  try {
    const { newsId, title, summary, content, publishDate, status } = req.body;

    if (!newsId || !title || !content || !publishDate) {
      return res.status(400).json({ error: 'NewsId, title, content, and publishDate are required' });
    }

    const newsData = {
      newsId,
      title,
      summary: summary || '',
      content,
      publishDate: new Date(publishDate),
      status: status || 'Published',
      media: []
    };

    // Add image if uploaded
    if (req.file) {
      newsData.media.push({
        type: 'image',
        url: req.file.path
      });
    }

    const news = await News.create(newsData);

    console.log('✅ News created:', news.title);
    res.status(201).json(news);
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update news
app.patch('/api/news/:newsId', uploadNewsImage.single('newsImage'), async (req, res) => {
  try {
    const { title, summary, content, publishDate, status } = req.body;

    const updateData = {};
    if (title) updateData.title = title;
    if (summary !== undefined) updateData.summary = summary;
    if (content) updateData.content = content;
    if (publishDate) updateData.publishDate = new Date(publishDate);
    if (status) updateData.status = status;

    // Add new image if uploaded
    if (req.file) {
      updateData.media = [{
        type: 'image',
        url: req.file.path
      }];
    }

    // Try to find by newsId first, then by _id as fallback for old records
    let news = await News.findOneAndUpdate(
      { newsId: req.params.newsId },
      updateData,
      { new: true, runValidators: true }
    );

    // If not found by newsId, try by _id
    if (!news && req.params.newsId.match(/^[0-9a-fA-F]{24}$/)) {
      news = await News.findByIdAndUpdate(
        req.params.newsId,
        updateData,
        { new: true, runValidators: true }
      );
    }

    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    console.log('✅ News updated:', news.title);
    res.json(news);
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete news
app.delete('/api/news/:newsId', async (req, res) => {
  try {
    const news = await News.findOneAndDelete({ newsId: req.params.newsId });

    if (!news) {
      return res.status(404).json({ error: 'News not found' });
    }

    console.log('✅ News deleted:', news.title);
    res.json({ success: true, message: 'News deleted successfully' });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PLAYER ENDPOINTS
// ============================================

// Check if IC number exists
app.get('/api/players/check-ic/:icNumber', async (req, res) => {
  try {
    const player = await Player.findOne({ icNumber: req.params.icNumber });
    res.json({ exists: !!player });
  } catch (error) {
    console.error('Error checking IC:', error);
    res.status(500).json({ error: error.message });
  }
});

// Register new player
app.post('/api/players/register', uploadPlayerImage.single('profilePicture'), async (req, res) => {
  try {
    const {
      fullName,
      gender,
      icNumber,
      age,
      email,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      username,
      password,
      termsAccepted
    } = req.body;

    // Check if IC number already exists
    const existingIC = await Player.findOne({ icNumber });
    if (existingIC) {
      return res.status(400).json({ error: 'IC number already registered' });
    }

    // Check if email already exists
    const existingEmail = await Player.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Check if username already exists
    const existingUsername = await Player.findOne({ username });
    if (existingUsername) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Generate unique MPA ID
    const playerId = await generateMpaId();

    const playerData = {
      playerId,
      fullName,
      gender,
      icNumber,
      age: parseInt(age),
      email,
      phoneNumber,
      addressLine1,
      addressLine2,
      city,
      state,
      username,
      password, // In production, hash this password!
      termsAccepted: termsAccepted === 'true' || termsAccepted === true
    };

    // Add profile picture if uploaded
    if (req.file) {
      playerData.profilePicture = req.file.path;
    }

    const player = await Player.create(playerData);

    console.log('✅ Player registered:', player.fullName);

    // Send welcome message to inbox
    await Message.create({
      playerId: player.playerId,
      subject: 'Welcome to Malaysia Pickleball Association!',
      message: `Dear ${player.fullName},

Welcome to the Malaysia Pickleball Association (MPA)! We are thrilled to have you join our growing community of pickleball enthusiasts.

Your MPA ID: ${player.playerId}

As a registered member, you now have access to:
• Upcoming tournaments and events
• Training programs and coaching resources
• Community forums and player connections
• Latest news and updates from MPA

Please keep your login credentials secure:
Username: ${player.username}

If you have any questions or need assistance, please don't hesitate to reach out to our support team.

Thank you for being part of our pickleball family!

Best regards,
Malaysia Pickleball Association Team`,
      read: false
    });

    console.log('📧 Welcome message sent to inbox:', player.fullName);

    // Send welcome email
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: player.email,
        subject: 'Welcome to Malaysia Pickleball Association - Registration Successful!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #10b981; margin: 0;">Malaysia Pickleball Association</h1>
              <p style="color: #6b7280; margin-top: 10px;">Player Portal</p>
            </div>

            <div style="background: #f0fdf4; padding: 30px; border-radius: 10px; margin-bottom: 20px; border-left: 4px solid #10b981;">
              <h2 style="color: #1f2937; margin-top: 0;">🎉 Registration Successful!</h2>
              <p style="color: #374151; line-height: 1.6;">Dear <strong>${player.fullName}</strong>,</p>
              <p style="color: #374151; line-height: 1.6;">
                Congratulations! Your registration with the Malaysia Pickleball Association has been successfully completed.
                We are thrilled to have you join our growing community of pickleball enthusiasts!
              </p>
            </div>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 2px solid #10b981;">
              <h3 style="color: #1f2937; margin-top: 0;">Your Account Details</h3>
              <p style="margin: 10px 0; color: #374151;"><strong>Player ID:</strong> ${player.playerId}</p>
              <p style="margin: 10px 0; color: #374151;"><strong>Username:</strong> ${player.username}</p>
              <p style="margin: 10px 0; color: #374151;"><strong>Password:</strong> ${player.password}</p>
              <p style="margin: 10px 0; color: #374151;"><strong>Email:</strong> ${player.email}</p>
            </div>

            <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; margin: 0; font-size: 14px;">
                <strong>🔐 Important:</strong> Please keep your login credentials secure. We recommend changing your password after your first login.
              </p>
            </div>

            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin-top: 0;">What's Next?</h3>
              <p style="color: #374151; line-height: 1.6;">As a registered member, you now have access to:</p>
              <ul style="color: #374151; line-height: 1.8;">
                <li>✅ Upcoming tournaments and events</li>
                <li>✅ Training programs and coaching resources</li>
                <li>✅ Player dashboard and profile management</li>
                <li>✅ Community news and updates</li>
                <li>✅ Direct communication with MPA administrators</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <p style="margin-bottom: 15px; color: #374151;">Ready to get started?</p>
              <a href="https://malaysiapickleballassociation.org/player/login"
                 style="display: inline-block; padding: 15px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                Login to Your Account
              </a>
            </div>

            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #1f2937; margin-top: 0;">Need Help?</h3>
              <p style="color: #374151; line-height: 1.6; margin-bottom: 10px;">
                If you have any questions or need assistance, please don't hesitate to contact us:
              </p>
              <p style="color: #374151; margin: 5px 0;">
                📧 Email: <a href="mailto:tournament@malaysiapickleballassociation.org" style="color: #10b981;">tournament@malaysiapickleballassociation.org</a>
              </p>
              <p style="color: #374151; margin: 5px 0;">
                🌐 Website: <a href="https://malaysiapickleballassociation.org" style="color: #10b981;">malaysiapickleballassociation.org</a>
              </p>
            </div>

            <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
              <p style="margin: 10px 0;">Thank you for being part of our pickleball family!</p>
              <p style="margin: 10px 0; font-weight: bold; color: #1f2937;">Malaysia Pickleball Association Team</p>
              <p style="margin-top: 20px; font-size: 12px;">
                © ${new Date().getFullYear()} Malaysia Pickleball Association. All rights reserved.
              </p>
              <p style="margin-top: 10px; font-size: 12px;">
                Technical Partner: <strong>Fenix Digital</strong>
              </p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Welcome email sent successfully to:', player.email);
    } catch (emailError) {
      console.error('❌ Failed to send welcome email:', emailError);
      // Don't fail the registration if email fails
    }

    // Return player data without password
    const { password: _, ...playerWithoutPassword } = player.toObject();
    res.status(201).json(playerWithoutPassword);
  } catch (error) {
    console.error('Error registering player:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all players
app.get('/api/players', async (req, res) => {
  try {
    const players = await Player.find()
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get player by ID
app.get('/api/players/:id', async (req, res) => {
  try {
    // Try to find by playerId first (MPA ID), then by _id (MongoDB ID)
    let player = await Player.findOne({ playerId: req.params.id }).select('-password');

    // If not found by playerId and the id looks like a MongoDB ObjectId, try by _id
    if (!player && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      player = await Player.findById(req.params.id).select('-password');
    }

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    res.status(500).json({ error: error.message });
  }
});

// Player login
app.post('/api/players/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find player by username
    const player = await Player.findOne({ username });

    if (!player) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Check if player is active
    if (player.status !== 'active') {
      return res.status(403).json({ error: 'Your account is not active. Please contact the administrator.' });
    }

    // Compare password (plain text for now - in production, use bcrypt.compare)
    if (player.password !== password) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Generate a simple token (in production, use JWT)
    const token = Buffer.from(`${player._id}:${Date.now()}`).toString('base64');

    console.log('✅ Player logged in:', player.fullName);

    res.json({
      token,
      player: {
        id: player._id,
        playerId: player.playerId,
        fullName: player.fullName,
        email: player.email,
        username: player.username,
        profilePicture: player.profilePicture,
        status: player.status,
        phoneNumber: player.phoneNumber,
        gender: player.gender,
        city: player.city,
        state: player.state
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Forgot password - send credentials via email
app.post('/api/players/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Find player by email
    const player = await Player.findOne({ email: email.toLowerCase() });

    if (!player) {
      return res.status(404).json({ error: 'No account found with this email address' });
    }

    console.log('📧 Sending forgot password email to:', player.email);

    // Send email with credentials
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: player.email,
      subject: 'Your MPA Player Portal Login Credentials',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #10b981; margin: 0;">Malaysia Pickleball Association</h1>
            <p style="color: #6b7280; margin-top: 10px;">Player Portal</p>
          </div>

          <div style="background: #f9fafb; padding: 30px; border-radius: 10px; margin-bottom: 20px;">
            <h2 style="color: #1f2937; margin-top: 0;">Login Credentials Recovery</h2>
            <p style="color: #374151; line-height: 1.6;">Hello ${player.fullName},</p>
            <p style="color: #374151; line-height: 1.6;">You requested your login credentials for the MPA Player Portal. Here are your details:</p>

            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
              <p style="margin: 10px 0; color: #374151;"><strong>Player ID:</strong> ${player.playerId}</p>
              <p style="margin: 10px 0; color: #374151;"><strong>Username:</strong> ${player.username}</p>
              <p style="margin: 10px 0; color: #374151;"><strong>Password:</strong> ${player.password}</p>
            </div>

            <p style="color: #374151; line-height: 1.6;">You can login to the player portal at:</p>
            <p style="margin: 15px 0;">
              <a href="https://malaysiapickleballassociation.org/player/login"
                 style="display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
                Login to Player Portal
              </a>
            </p>
          </div>

          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              <strong>⚠️ Security Notice:</strong> Please keep your credentials secure. If you didn't request this email, please contact us immediately at tournament@malaysiapickleballassociation.org
            </p>
          </div>

          <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 14px;">
            <p>© ${new Date().getFullYear()} Malaysia Pickleball Association. All rights reserved.</p>
            <p style="margin-top: 10px;">
              <a href="https://malaysiapickleballassociation.org" style="color: #10b981; text-decoration: none;">Visit our website</a>
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Credentials email sent successfully to:', player.email);

    res.json({
      message: 'Credentials sent to your email'
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ error: 'Failed to send email. Please try again later.' });
  }
});

// Get player credentials
app.get('/api/players/:id/credentials', async (req, res) => {
  try {
    // Try to find by playerId first, then by _id
    let player = await Player.findOne({ playerId: req.params.id }).select('username password');

    // If not found by playerId and the id looks like a MongoDB ObjectId, try by _id
    if (!player && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      player = await Player.findById(req.params.id).select('username password');
    }

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({
      username: player.username,
      password: player.password
    });
  } catch (error) {
    console.error('Error fetching credentials:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send message to player
app.post('/api/players/:id/send-message', async (req, res) => {
  try {
    const { subject, message } = req.body;

    // Try to find by playerId first, then by _id
    let player = await Player.findOne({ playerId: req.params.id });

    // If not found by playerId and the id looks like a MongoDB ObjectId, try by _id
    if (!player && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      player = await Player.findById(req.params.id);
    }

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Save message to database
    const newMessage = await Message.create({
      playerId: player.playerId,
      subject,
      message,
      read: false
    });

    console.log('📧 Message sent to:', player.fullName);

    // TODO: Integrate with nodemailer to actually send emails
    // Example:
    // await transporter.sendMail({
    //   from: 'noreply@mpa.com',
    //   to: player.email,
    //   subject: subject,
    //   text: message,
    //   html: `<p>${message}</p>`
    // });

    res.json({
      success: true,
      message: 'Message sent successfully',
      recipient: player.email,
      data: newMessage
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get messages for a player
app.get('/api/players/:id/messages', async (req, res) => {
  try {
    // Try to find player by playerId first, then by _id
    let player = await Player.findOne({ playerId: req.params.id });

    // If not found by playerId and the id looks like a MongoDB ObjectId, try by _id
    if (!player && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      player = await Player.findById(req.params.id);
    }

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const messages = await Message.find({ playerId: player.playerId })
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark message as read
app.patch('/api/players/:id/messages/:messageId/read', async (req, res) => {
  try {
    // Try to find player by playerId first, then by _id
    let player = await Player.findOne({ playerId: req.params.id });

    // If not found by playerId and the id looks like a MongoDB ObjectId, try by _id
    if (!player && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      player = await Player.findById(req.params.id);
    }

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Update message read status
    const message = await Message.findByIdAndUpdate(
      req.params.messageId,
      { read: true },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to delete image from Cloudinary
async function deleteCloudinaryImage(imageUrl) {
  if (!imageUrl) return;

  try {
    // Extract public_id from Cloudinary URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{folder}/{public_id}.{extension}
    const regex = /\/([^\/]+\/[^\/]+)\.[a-z]+$/;
    const match = imageUrl.match(regex);

    if (match && match[1]) {
      const publicId = match[1];
      await cloudinary.uploader.destroy(publicId);
      console.log('🗑️ Deleted old image from Cloudinary:', publicId);
    }
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    // Don't throw error - allow the update to continue even if deletion fails
  }
}

// Reset player password
app.post('/api/players/:id/reset-password', async (req, res) => {
  try {
    // Generate a new random password
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8).toUpperCase();

    // Try to find by playerId first, then by _id
    let player = await Player.findOne({ playerId: req.params.id });

    // If not found by playerId and the id looks like a MongoDB ObjectId, try by _id
    if (!player && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      player = await Player.findById(req.params.id);
    }

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Update password
    player.password = newPassword;
    await player.save();

    console.log('✅ Password reset for:', player.fullName);
    res.json({ newPassword });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload/Update player profile picture
app.post('/api/players/:id/profile-picture', uploadPlayerImage.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Try to find by playerId first, then by _id
    let player = await Player.findOne({ playerId: req.params.id });

    // If not found by playerId and the id looks like a MongoDB ObjectId, try by _id
    if (!player && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      player = await Player.findById(req.params.id);
    }

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // Delete old profile picture from Cloudinary if it exists
    if (player.profilePicture) {
      await deleteCloudinaryImage(player.profilePicture);
    }

    // Update with new profile picture
    player.profilePicture = req.file.path;
    await player.save();

    console.log('✅ Profile picture updated for:', player.fullName);

    // Return player data without password
    const { password: _, ...playerWithoutPassword } = player.toObject();
    res.json(playerWithoutPassword);
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update player
app.patch('/api/players/:id', uploadPlayerImage.single('profilePicture'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Don't allow password updates through this endpoint
    delete updateData.password;
    // Don't allow playerId updates
    delete updateData.playerId;

    // Add profile picture if uploaded
    if (req.file) {
      updateData.profilePicture = req.file.path;
    }

    // Try to find by playerId first, then by _id
    let player = await Player.findOneAndUpdate(
      { playerId: req.params.id },
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    // If not found by playerId and the id looks like a MongoDB ObjectId, try by _id
    if (!player && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      player = await Player.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');
    }

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    console.log('✅ Player updated:', player.fullName);
    res.json(player);
  } catch (error) {
    console.error('Error updating player:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete player
app.delete('/api/players/:id', async (req, res) => {
  try {
    // Try to find by playerId first, then by _id
    let player = await Player.findOneAndDelete({ playerId: req.params.id });

    // If not found by playerId and the id looks like a MongoDB ObjectId, try by _id
    if (!player && req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      player = await Player.findByIdAndDelete(req.params.id);
    }

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    console.log('✅ Player deleted:', player.fullName);
    res.json({ success: true, message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    res.status(500).json({ error: error.message });
  }
});

// Fix player status for existing players
app.post('/api/players/fix-status', async (req, res) => {
  try {
    const playersToUpdate = await Player.find({
      $or: [
        { status: null },
        { status: { $exists: false } }
      ]
    });

    let updated = 0;
    for (const player of playersToUpdate) {
      await Player.updateOne(
        { _id: player._id },
        { $set: { status: 'active' } }
      );
      updated++;
    }

    console.log(`✅ Updated status for ${updated} players`);
    res.json({
      success: true,
      message: `Updated ${updated} players to active status`,
      updated
    });
  } catch (error) {
    console.error('Error fixing player status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Migrate existing players to add MPA IDs
app.post('/api/players/migrate-ids', async (req, res) => {
  try {
    // Find all players without proper MPA prefix
    const playersToUpdate = await Player.find({
      $or: [
        { playerId: null },
        { playerId: { $exists: false } },
        { playerId: { $not: /^MPA/ } } // Find IDs that don't start with MPA
      ]
    });

    let updated = 0;
    for (const player of playersToUpdate) {
      const newPlayerId = await generateMpaId();
      await Player.updateOne(
        { _id: player._id },
        { $set: { playerId: newPlayerId } },
        { runValidators: false }
      );
      updated++;
      console.log(`✅ Updated ${player.fullName} with MPA ID: ${newPlayerId}`);
    }

    res.json({
      success: true,
      message: `Successfully updated ${updated} players with MPA IDs`,
      updated
    });
  } catch (error) {
    console.error('Error migrating player IDs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Course Routes
// Get all courses
app.get('/api/courses', async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;

    const courses = await Course.find(query).sort({ date: 1 });
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get course by ID
app.get('/api/courses/:id', async (req, res) => {
  try {
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid course ID format' });
    }

    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    res.json(course);
  } catch (error) {
    console.error('Error fetching course:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new course
app.post('/api/courses', async (req, res) => {
  try {
    const course = new Course(req.body);
    await course.save();
    console.log('✅ Course created:', course.title);
    res.status(201).json(course);
  } catch (error) {
    console.error('Error creating course:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update course
app.patch('/api/courses/:id', async (req, res) => {
  try {
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid course ID format' });
    }

    const course = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    console.log('✅ Course updated:', course.title);
    res.json(course);
  } catch (error) {
    console.error('Error updating course:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete course
app.delete('/api/courses/:id', async (req, res) => {
  try {
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'Invalid course ID' });
    }

    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid course ID format' });
    }

    const course = await Course.findByIdAndDelete(req.params.id);

    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }

    console.log('✅ Course deleted:', course.title);
    res.json({ success: true, message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    res.status(500).json({ error: error.message });
  }
});

// Clinic Routes
// Get all clinics
app.get('/api/clinics', async (req, res) => {
  try {
    const { status } = req.query;
    let query = {};
    if (status) query.status = status;

    const clinics = await Clinic.find(query).sort({ date: 1 });
    res.json(clinics);
  } catch (error) {
    console.error('Error fetching clinics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get clinic by ID
app.get('/api/clinics/:id', async (req, res) => {
  try {
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'Invalid clinic ID' });
    }

    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid clinic ID format' });
    }

    const clinic = await Clinic.findById(req.params.id);
    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    res.json(clinic);
  } catch (error) {
    console.error('Error fetching clinic:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new clinic
app.post('/api/clinics', async (req, res) => {
  try {
    const clinic = new Clinic(req.body);
    await clinic.save();
    console.log('✅ Clinic created:', clinic.title);
    res.status(201).json(clinic);
  } catch (error) {
    console.error('Error creating clinic:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update clinic
app.patch('/api/clinics/:id', async (req, res) => {
  try {
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'Invalid clinic ID' });
    }

    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid clinic ID format' });
    }

    const clinic = await Clinic.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    console.log('✅ Clinic updated:', clinic.title);
    res.json(clinic);
  } catch (error) {
    console.error('Error updating clinic:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete clinic
app.delete('/api/clinics/:id', async (req, res) => {
  try {
    if (!req.params.id || req.params.id === 'undefined') {
      return res.status(400).json({ error: 'Invalid clinic ID' });
    }

    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid clinic ID format' });
    }

    const clinic = await Clinic.findByIdAndDelete(req.params.id);

    if (!clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    console.log('✅ Clinic deleted:', clinic.title);
    res.json({ success: true, message: 'Clinic deleted successfully' });
  } catch (error) {
    console.error('Error deleting clinic:', error);
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Malaysia Pickleball API',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    portalAPI: PORTAL_API_URL
  });
});

// Serve React app index.html for client-side routing (must be after API routes)
app.use((req, res, next) => {
  // Only serve index.html if it's not an API route and it's a GET request
  if (!req.path.startsWith('/api') && req.method === 'GET') {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  } else {
    next();
  }
});

app.listen(PORT, () => {
  console.log(`\n🚀 Malaysia Pickleball Backend running on port ${PORT}`);
  console.log(`📊 MongoDB: ${MONGODB_URI}`);
  console.log(`🔗 Portal API: ${PORTAL_API_URL}\n`);
});
