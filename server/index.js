import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import multer from 'multer';
import { journeyStorage, newsStorage } from './cloudinaryConfig.js';

dotenv.config();

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
    enum: ['Approved', 'Archived']
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
    enum: ['Draft', 'Published', 'Archived'],
    default: 'Published'
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
    status: 'Approved',
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

    // Sync each tournament
    for (const portalTournament of portalTournaments) {
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

    console.log(`✅ Sync complete: ${created} created, ${updated} updated`);

    res.json({
      success: true,
      created,
      updated,
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
      // Archive the tournament locally
      await Tournament.findOneAndUpdate(
        { applicationId: tournament.applicationId },
        { status: 'Archived', lastSyncedAt: new Date() }
      );
    } else {
      // Sync from Portal
      const portalData = await syncWithPortal(tournament.applicationId);
      const localData = mapPortalToLocal(portalData);

      await Tournament.findOneAndUpdate(
        { applicationId: tournament.applicationId },
        localData,
        { upsert: true }
      );
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

    const news = await News.findOneAndUpdate(
      { newsId: req.params.newsId },
      updateData,
      { new: true, runValidators: true }
    );

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
