const mongoose = require('mongoose');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Import models
const Notification = require('../models/Notification');
const TournamentUpdate = require('../models/TournamentUpdate');
const Announcement = require('../models/Announcement');
const Message = require('../models/Message');
const Tournament = require('../models/Tournament');
const Player = require('../models/Player');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/malaysia-pickleball', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Sample data creation functions
const createSampleNotifications = async () => {
  console.log('🔔 Creating sample notifications...');
  
  const notifications = [
    {
      title: 'Welcome to Malaysia Pickleball!',
      content: 'Welcome to our pickleball community! Check out upcoming tournaments and events.',
      type: 'system',
      priority: 'normal',
      recipientType: 'all'
    },
    {
      title: 'New Tournament Registration Open',
      content: 'Registration is now open for the National Pickleball Championship 2024.',
      type: 'tournament',
      priority: 'high',
      recipientType: 'all',
      metadata: {
        actionRequired: true,
        link: '/tournaments'
      }
    },
    {
      title: 'Maintenance Notice',
      content: 'System maintenance scheduled for tonight 11 PM - 1 AM. Services may be temporarily unavailable.',
      type: 'maintenance',
      priority: 'urgent',
      recipientType: 'all',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
    }
  ];

  for (const notificationData of notifications) {
    try {
      const notificationId = await Notification.generateNotificationId();
      const notification = new Notification({ ...notificationData, notificationId });
      await notification.save();
      console.log(`✅ Created notification: ${notification.title}`);
    } catch (error) {
      console.error(`❌ Error creating notification: ${error.message}`);
    }
  }
};

const createSampleTournamentUpdates = async () => {
  console.log('🏆 Creating sample tournament updates...');
  
  // First, let's create a sample tournament if it doesn't exist
  let tournament = await Tournament.findOne({});
  if (!tournament) {
    tournament = new Tournament({
      name: 'National Pickleball Championship 2024',
      type: 'national',
      startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      endDate: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000), // 33 days from now
      location: 'Kuala Lumpur Sports Complex',
      maxParticipants: 200,
      registrationDeadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000), // 20 days from now
      entryFee: 50,
      description: 'Annual national pickleball championship',
      rules: 'Standard pickleball rules apply',
      prizes: 'Cash prizes for top 3 positions',
      status: 'upcoming',
      registrationOpen: true
    });
    await tournament.save();
    console.log('✅ Created sample tournament');
  }

  const updates = [
    {
      tournamentId: tournament._id,
      title: 'Registration Deadline Extended',
      content: 'Due to popular demand, we have extended the registration deadline by 5 days.',
      type: 'registration',
      priority: 'high',
      publishedBy: 'admin',
      publishedByName: 'Tournament Admin'
    },
    {
      tournamentId: tournament._id,
      title: 'Venue Information Update',
      content: 'Parking will be available at the north entrance. Please arrive 30 minutes early for check-in.',
      type: 'venue',
      priority: 'normal',
      publishedBy: 'admin',
      publishedByName: 'Tournament Admin'
    },
    {
      tournamentId: tournament._id,
      title: 'Schedule Released',
      content: 'The complete tournament schedule has been released. Check your email for detailed match timings.',
      type: 'schedule',
      priority: 'high',
      publishedBy: 'admin',
      publishedByName: 'Tournament Admin'
    }
  ];

  for (const updateData of updates) {
    try {
      const updateId = await TournamentUpdate.generateUpdateId();
      const update = new TournamentUpdate({ ...updateData, updateId });
      await update.save();
      console.log(`✅ Created tournament update: ${update.title}`);
    } catch (error) {
      console.error(`❌ Error creating tournament update: ${error.message}`);
    }
  }
};

const createSampleAnnouncements = async () => {
  console.log('📢 Creating sample announcements...');
  
  const announcements = [
    {
      title: 'New Mobile App Available!',
      content: 'Download our new mobile app to stay updated with tournaments, rankings, and connect with fellow players.',
      type: 'feature',
      priority: 'high',
      targetAudience: 'all',
      isPinned: true,
      publishedBy: 'admin',
      publishedByName: 'MPA Admin',
      metadata: {
        link: '/download',
        actionRequired: true,
        category: 'app'
      }
    },
    {
      title: 'COVID-19 Safety Guidelines',
      content: 'Please follow all safety protocols during tournaments. Masks are required in indoor venues.',
      type: 'policy',
      priority: 'urgent',
      targetAudience: 'all',
      isPinned: true,
      publishedBy: 'admin',
      publishedByName: 'Health & Safety Team'
    },
    {
      title: 'Ranking System Update',
      content: 'We have updated our ranking algorithm to better reflect player performance. Rankings will be recalculated weekly.',
      type: 'news',
      priority: 'normal',
      targetAudience: 'players',
      publishedBy: 'admin',
      publishedByName: 'Technical Team'
    }
  ];

  for (const announcementData of announcements) {
    try {
      const announcementId = await Announcement.generateAnnouncementId();
      const announcement = new Announcement({ ...announcementData, announcementId });
      await announcement.save();
      console.log(`✅ Created announcement: ${announcement.title}`);
    } catch (error) {
      console.error(`❌ Error creating announcement: ${error.message}`);
    }
  }
};

const createSampleMessages = async () => {
  console.log('💬 Creating sample messages...');
  
  // Get the first player for testing
  const player = await Player.findOne({});
  if (!player) {
    console.log('⚠️  No players found. Please create a player first.');
    return;
  }

  const messages = [
    {
      recipientId: player._id,
      recipientType: 'player',
      senderType: 'system',
      senderName: 'Malaysia Pickleball Association',
      subject: 'Welcome to MPA!',
      content: `Dear ${player.fullName},\n\nWelcome to Malaysia Pickleball Association! We're excited to have you join our community.`,
      type: 'notification',
      priority: 'normal'
    },
    {
      recipientId: player._id,
      recipientType: 'player',
      senderType: 'system',
      senderName: 'Tournament Team',
      subject: 'Tournament Registration Confirmation',
      content: 'Your registration for the upcoming tournament has been confirmed. Good luck!',
      type: 'tournament',
      priority: 'normal'
    },
    {
      recipientId: player._id,
      recipientType: 'player',
      senderType: 'admin',
      senderName: 'MPA Admin',
      subject: 'Profile Update Required',
      content: 'Please update your profile information to ensure we have your latest contact details.',
      type: 'general',
      priority: 'low'
    }
  ];

  for (const messageData of messages) {
    try {
      const messageId = await Message.generateMessageId();
      const message = new Message({ ...messageData, messageId });
      await message.save();
      console.log(`✅ Created message: ${message.subject}`);
    } catch (error) {
      console.error(`❌ Error creating message: ${error.message}`);
    }
  }
};

// Main setup function
const setupSampleData = async () => {
  try {
    console.log('🚀 Setting up sample data for mobile app testing...\n');
    
    await connectDB();
    
    // Create sample data
    await createSampleNotifications();
    console.log('');
    await createSampleTournamentUpdates();
    console.log('');
    await createSampleAnnouncements();
    console.log('');
    await createSampleMessages();
    
    console.log('\n🎉 Sample data setup completed successfully!');
    console.log('\nYou can now test the mobile app endpoints:');
    console.log('• GET /api/messages');
    console.log('• GET /api/notifications');
    console.log('• GET /api/tournament-updates');
    console.log('• GET /api/announcements');
    console.log('• GET /api/mobile/player/messages');
    
  } catch (error) {
    console.error('❌ Error setting up sample data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run the setup if this file is executed directly
if (require.main === module) {
  setupSampleData();
}

module.exports = setupSampleData;