const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Malaysia Pickleball API',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    portalAPI: PORTAL_API_URL
  });
});

// Serve React app for all other routes (production)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 Malaysia Pickleball Backend running on port ${PORT}`);
  console.log(`📊 MongoDB: ${MONGODB_URI}`);
  console.log(`🔗 Portal API: ${PORTAL_API_URL}\n`);
});
