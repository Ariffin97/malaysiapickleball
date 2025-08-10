const mongoose = require('mongoose');
const TournamentNotice = require('../models/TournamentNotice');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/malaysiapickleball', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const sampleNotices = [
  {
    title: 'Kuala Lumpur Open Date Change',
    tournamentName: 'Kuala Lumpur Open',
    type: 'date_change',
    message: 'Tournament dates have been changed from April 25-27, 2025 to May 2-4, 2025 due to venue availability.',
    priority: 'high',
    status: 'active',
    createdBy: 'admin',
    details: {
      originalDate: 'Apr 25-27, 2025',
      newDate: 'May 2-4, 2025',
      reason: 'Venue availability'
    }
  },
  {
    title: 'Penang State Championship Cancellation',
    tournamentName: 'Penang State Championship',
    type: 'cancellation',
    message: 'Tournament has been cancelled due to unforeseen circumstances. All registrations will be refunded.',
    priority: 'urgent',
    status: 'active',
    createdBy: 'admin',
    details: {
      reason: 'Unforeseen circumstances'
    }
  },
  {
    title: 'SKECHERS Tournament Venue Change',
    tournamentName: 'SKECHERS Tournament',
    type: 'venue_change',
    message: 'Venue has been changed due to maintenance at the original location.',
    priority: 'medium',
    status: 'active',
    createdBy: 'admin',
    details: {
      originalVenue: 'TBA, Kuala Lumpur',
      newVenue: 'Bukit Jalil Sports Complex'
    }
  },
  {
    title: 'Ambank Championship Registration Deadline Extended',
    tournamentName: 'Ambank Championship',
    type: 'registration_deadline',
    message: 'Registration deadline extended to accommodate more participants.',
    priority: 'medium',
    status: 'active',
    createdBy: 'admin',
    details: {
      deadline: 'March 15, 2025'
    }
  },
  {
    title: 'National Championship General Update',
    tournamentName: 'National Championship',
    type: 'general',
    message: 'Important updates regarding tournament format and prize pool have been announced.',
    priority: 'low',
    status: 'active',
    createdBy: 'admin',
    details: {}
  }
];

async function setupSampleNotices() {
  try {
    console.log('Setting up sample tournament notices...');
    
    // Clear existing notices
    await TournamentNotice.deleteMany({});
    console.log('Cleared existing notices');
    
    // Insert sample notices
    const insertedNotices = await TournamentNotice.insertMany(sampleNotices);
    console.log(`Successfully created ${insertedNotices.length} sample notices`);
    
    console.log('Sample notices setup completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error setting up sample notices:', error);
    process.exit(1);
  }
}

setupSampleNotices(); 