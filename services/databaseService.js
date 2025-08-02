const Tournament = require('../models/Tournament');
const Player = require('../models/Player');
const PlayerRegistration = require('../models/PlayerRegistration');
const Admin = require('../models/Admin');
const PendingAdmin = require('../models/PendingAdmin');
const Message = require('../models/Message');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');
const TournamentUpdate = require('../models/TournamentUpdate');
const Announcement = require('../models/Announcement');

class DatabaseService {
  // Tournament operations
  static async getAllTournaments() {
    try {
      return await Tournament.find().sort({ startDate: 1 });
    } catch (error) {
      console.error('Error getting tournaments:', error);
      throw error;
    }
  }

  static async getTournamentById(id) {
    try {
      return await Tournament.findById(id);
    } catch (error) {
      console.error('Error getting tournament by ID:', error);
      throw error;
    }
  }

  static async createTournament(tournamentData) {
    try {
      const tournament = new Tournament(tournamentData);
      return await tournament.save();
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }
  }

  static async updateTournament(id, updateData, currentVersion = null, modifiedBy = null) {
    try {
      // Add modification tracking
      if (modifiedBy) {
        updateData.lastModifiedBy = modifiedBy;
      }

      // If version is provided, use optimistic locking
      if (currentVersion !== null) {
        const tournament = await Tournament.findOneAndUpdate(
          { 
            _id: id, 
            version: currentVersion // Only update if version matches
          },
          updateData,
          { 
            new: true,
            runValidators: true
          }
        );

        if (!tournament) {
          // Check if tournament exists but version doesn't match
          const existingTournament = await Tournament.findById(id);
          if (existingTournament) {
            throw new Error(`Conflict detected: Tournament was modified by ${existingTournament.lastModifiedBy || 'another admin'} at ${existingTournament.updatedAt}. Please refresh and try again.`);
          } else {
            throw new Error('Tournament not found');
          }
        }

        return tournament;
      } else {
        // Fallback to regular update (less safe)
        return await Tournament.findByIdAndUpdate(id, updateData, { new: true });
      }
    } catch (error) {
      console.error('Error updating tournament:', error);
      throw error;
    }
  }

  static async deleteTournament(id) {
    try {
      return await Tournament.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error deleting tournament:', error);
      throw error;
    }
  }

  // Player operations
  static async getAllPlayers() {
    try {
      return await Player.find().sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting players:', error);
      throw error;
    }
  }

  static async getPlayerById(id) {
    try {
      return await Player.findById(id).populate('tournaments.tournamentId');
    } catch (error) {
      console.error('Error getting player by ID:', error);
      throw error;
    }
  }

  static async getPlayerByPlayerId(playerId) {
    try {
      return await Player.findOne({ playerId }).populate('tournaments.tournamentId');
    } catch (error) {
      console.error('Error getting player by player ID:', error);
      throw error;
    }
  }

  static async getPlayerByUsername(username) {
    try {
      return await Player.findOne({ username });
    } catch (error) {
      console.error('Error getting player by username:', error);
      throw error;
    }
  }

  static async getPlayerByEmail(email) {
    try {
      return await Player.findOne({ email });
    } catch (error) {
      console.error('Error getting player by email:', error);
      throw error;
    }
  }

  static async createPlayer(playerData) {
    try {
      // Generate unique player ID based on IC number
      const playerId = await Player.generatePlayerId(playerData.icNumber);
      const player = new Player({ ...playerData, playerId });
      return await player.save();
    } catch (error) {
      console.error('Error creating player:', error);
      throw error;
    }
  }

  static async updatePlayer(id, updateData) {
    try {
      return await Player.findByIdAndUpdate(id, updateData, { new: true });
    } catch (error) {
      console.error('Error updating player:', error);
      throw error;
    }
  }

  static async updatePlayerLastLogin(id) {
    try {
      return await Player.findByIdAndUpdate(
        id,
        { lastLogin: new Date() },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating player last login:', error);
      throw error;
    }
  }

  static async deletePlayer(id) {
    try {
      return await Player.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error deleting player:', error);
      throw error;
    }
  }

  // Player Registration operations
  static async getAllPlayerRegistrations() {
    try {
      return await PlayerRegistration.find().sort({ submittedAt: -1 });
    } catch (error) {
      console.error('Error getting player registrations:', error);
      throw error;
    }
  }

  static async getPendingPlayerRegistrations() {
    try {
      return await PlayerRegistration.find({ status: 'pending' }).sort({ submittedAt: -1 });
    } catch (error) {
      console.error('Error getting pending player registrations:', error);
      throw error;
    }
  }

  static async getPlayerRegistrationById(id) {
    try {
      return await PlayerRegistration.findById(id);
    } catch (error) {
      console.error('Error getting player registration by ID:', error);
      throw error;
    }
  }

  static async createPlayerRegistration(registrationData) {
    try {
      // Check if IC number is already registered as a player
      const isPlayerRegistered = await Player.isIcNumberRegistered(registrationData.icNumber);
      if (isPlayerRegistered) {
        throw new Error('This IC number is already registered as an active player');
      }

      // Check if IC number already has a pending/approved registration
      const isInRegistrationSystem = await PlayerRegistration.isIcNumberInSystem(registrationData.icNumber);
      if (isInRegistrationSystem) {
        throw new Error('This IC number already has a registration in the system');
      }

      // Generate unique registration ID
      const registrationId = await PlayerRegistration.generateRegistrationId();
      const registration = new PlayerRegistration({ ...registrationData, registrationId });
      return await registration.save();
    } catch (error) {
      console.error('Error creating player registration:', error);
      throw error;
    }
  }

  static async approvePlayerRegistration(id, processedBy) {
    try {
      // Use atomic operation to prevent race conditions
      const registration = await PlayerRegistration.findOneAndUpdate(
        { 
          _id: id, 
          status: 'pending' // Only update if still pending
        },
        {
          status: 'approved',
          processedAt: new Date(),
          processedBy: processedBy
        },
        { 
          new: true,
          runValidators: true
        }
      );

      if (!registration) {
        throw new Error('Registration not found or already processed');
      }

      // Create player from registration
      const playerData = {
        fullName: registration.fullName,
        icNumber: registration.icNumber,
        age: registration.age,
        address: registration.address,
        phoneNumber: registration.phoneNumber,
        email: registration.email,
        username: registration.username,
        password: registration.password,
        profilePicture: registration.profilePicture
      };

      const player = await this.createPlayer(playerData);

      // Send welcome message to the new player
      try {
        await this.sendWelcomeMessage(player.playerId, player.fullName);
      } catch (messageError) {
        console.error('Failed to send welcome message:', messageError);
        // Don't fail the approval process if message sending fails
      }

      return { player, registration };
    } catch (error) {
      console.error('Error approving player registration:', error);
      
      // Handle specific MongoDB errors
      if (error.code === 11000) {
        throw new Error('Player with this IC number, email, or username already exists');
      }
      
      throw error;
    }
  }

  static async rejectPlayerRegistration(id, processedBy, notes = '') {
    try {
      return await PlayerRegistration.findByIdAndUpdate(
        id,
        {
          status: 'rejected',
          processedAt: new Date(),
          processedBy,
          notes
        },
        { new: true }
      );
    } catch (error) {
      console.error('Error rejecting player registration:', error);
      throw error;
    }
  }

  // Admin operations
  static async getAdminByUsername(username) {
    try {
      return await Admin.findOne({ username, isActive: true });
    } catch (error) {
      console.error('Error getting admin by username:', error);
      throw error;
    }
  }

  static async createAdmin(adminData) {
    try {
      const admin = new Admin(adminData);
      return await admin.save();
    } catch (error) {
      console.error('Error creating admin:', error);
      throw error;
    }
  }

  static async updateAdminLastLogin(id) {
    try {
      return await Admin.findByIdAndUpdate(
        id,
        { lastLogin: new Date() },
        { new: true }
      );
    } catch (error) {
      console.error('Error updating admin last login:', error);
      throw error;
    }
  }

  // Admin update operations
  static async updateAdminUsername(adminId, newUsername, currentPassword) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Verify current password
      const isValidPassword = await admin.comparePassword(currentPassword);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Check if username already exists
      const existingAdmin = await Admin.findOne({ username: newUsername, _id: { $ne: adminId } });
      if (existingAdmin) {
        throw new Error('Username already exists');
      }

      // Update username
      admin.username = newUsername;
      return await admin.save();
    } catch (error) {
      console.error('Error updating admin username:', error);
      throw error;
    }
  }

  static async updateAdminPassword(adminId, currentPassword, newPassword) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Verify current password
      const isValidPassword = await admin.comparePassword(currentPassword);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Update password (will be hashed by the pre-save middleware)
      admin.password = newPassword;
      return await admin.save();
    } catch (error) {
      console.error('Error updating admin password:', error);
      throw error;
    }
  }

  static async updateAdminProfile(adminId, profileData) {
    try {
      const admin = await Admin.findById(adminId);
      if (!admin) {
        throw new Error('Admin not found');
      }

      // Update profile fields
      if (profileData.fullName !== undefined) {
        admin.fullName = profileData.fullName;
      }
      if (profileData.email !== undefined) {
        admin.email = profileData.email;
      }

      return await admin.save();
    } catch (error) {
      console.error('Error updating admin profile:', error);
      throw error;
    }
  }

  // Pending Admin operations
  static async createPendingAdmin(adminData, requestedByAdminId, requestedByUsername) {
    try {
      // Check if username or email already exists in Admin collection
      const existingAdmin = await Admin.findOne({ 
        $or: [
          { username: adminData.username },
          { email: adminData.email }
        ]
      });
      if (existingAdmin) {
        throw new Error('Username or email already exists in active admins');
      }

      // Check if username or email already exists in PendingAdmin collection
      const existingPending = await PendingAdmin.findOne({ 
        $or: [
          { username: adminData.username },
          { email: adminData.email }
        ],
        status: 'pending'
      });
      if (existingPending) {
        throw new Error('Username or email already has a pending registration');
      }

      const pendingAdmin = new PendingAdmin({
        ...adminData,
        requestedBy: requestedByAdminId,
        requestedByUsername: requestedByUsername
      });

      return await pendingAdmin.save();
    } catch (error) {
      console.error('Error creating pending admin:', error);
      throw error;
    }
  }

  static async getAllPendingAdmins() {
    try {
      return await PendingAdmin.find({ status: 'pending' })
        .populate('requestedBy', 'username fullName')
        .sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting pending admins:', error);
      throw error;
    }
  }

  static async getPendingAdminById(id) {
    try {
      return await PendingAdmin.findById(id)
        .populate('requestedBy', 'username fullName');
    } catch (error) {
      console.error('Error getting pending admin by id:', error);
      throw error;
    }
  }

  static async approvePendingAdmin(pendingAdminId, approvedByAdminId) {
    try {
      const pendingAdmin = await PendingAdmin.findById(pendingAdminId);
      if (!pendingAdmin) {
        throw new Error('Pending admin not found');
      }

      if (pendingAdmin.status !== 'pending') {
        throw new Error('Admin registration has already been processed');
      }

      // Create the actual admin account with already hashed password
      const admin = new Admin({
        username: pendingAdmin.username,
        password: pendingAdmin.password, // Already hashed in PendingAdmin
        email: pendingAdmin.email,
        fullName: pendingAdmin.fullName,
        role: pendingAdmin.role,
        permissions: pendingAdmin.permissions,
        isActive: true
      });

      // Mark password as not modified to skip hashing
      admin.markModified('password');
      admin.isModified = function(path) {
        if (path === 'password') return false;
        return mongoose.Document.prototype.isModified.call(this, path);
      };
      
      await admin.save();

      // Update pending admin status
      await pendingAdmin.approve(approvedByAdminId);

      return admin;
    } catch (error) {
      console.error('Error approving pending admin:', error);
      throw error;
    }
  }

  static async rejectPendingAdmin(pendingAdminId, rejectedByAdminId, rejectionReason = '') {
    try {
      const pendingAdmin = await PendingAdmin.findById(pendingAdminId);
      if (!pendingAdmin) {
        throw new Error('Pending admin not found');
      }

      if (pendingAdmin.status !== 'pending') {
        throw new Error('Admin registration has already been processed');
      }

      return await pendingAdmin.reject(rejectedByAdminId, rejectionReason);
    } catch (error) {
      console.error('Error rejecting pending admin:', error);
      throw error;
    }
  }

  static async getAllAdmins() {
    try {
      return await Admin.find({ isActive: true }).select('-password').sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting all admins:', error);
      throw error;
    }
  }

  // Settings operations
  static async getSetting(key, defaultValue = null) {
    try {
      return await Settings.getSetting(key, defaultValue);
    } catch (error) {
      console.error('Error getting setting:', error);
      return defaultValue;
    }
  }

  static async setSetting(key, value, description = '', category = 'general', modifiedBy = 'system') {
    try {
      return await Settings.setSetting(key, value, description, category, modifiedBy);
    } catch (error) {
      console.error('Error setting setting:', error);
      throw error;
    }
  }

  static async getSettingsByCategory(category) {
    try {
      return await Settings.getSettingsByCategory(category);
    } catch (error) {
      console.error('Error getting settings by category:', error);
      return {};
    }
  }

  // Tournament registration operations
  static async registerPlayerForTournament(playerId, tournamentId) {
    try {
      const player = await Player.findById(playerId);
      if (!player) {
        throw new Error('Player not found');
      }

      const tournament = await Tournament.findById(tournamentId);
      if (!tournament) {
        throw new Error('Tournament not found');
      }

      // Check if already registered
      const existingRegistration = player.tournaments.find(
        t => t.tournamentId.toString() === tournamentId
      );

      if (existingRegistration) {
        throw new Error('Player already registered for this tournament');
      }

      // Add tournament to player's tournaments
      player.tournaments.push({
        tournamentId,
        registrationDate: new Date(),
        status: 'registered'
      });

      return await player.save();
    } catch (error) {
      console.error('Error registering player for tournament:', error);
      throw error;
    }
  }

  static async unregisterPlayerFromTournament(playerId, tournamentId) {
    try {
      const player = await Player.findById(playerId);
      if (!player) {
        throw new Error('Player not found');
      }

      // Remove tournament from player's tournaments
      player.tournaments = player.tournaments.filter(
        t => t.tournamentId.toString() !== tournamentId
      );

      return await player.save();
    } catch (error) {
      console.error('Error unregistering player from tournament:', error);
      throw error;
    }
  }

  // Statistics operations
  static async getStatistics() {
    try {
      const [
        totalPlayers,
        activePlayers,
        totalTournaments,
        pendingRegistrations,
        totalAdmins
      ] = await Promise.all([
        Player.countDocuments(),
        Player.countDocuments({ status: 'active' }),
        Tournament.countDocuments(),
        PlayerRegistration.countDocuments({ status: 'pending' }),
        Admin.countDocuments({ isActive: true })
      ]);

      return {
        totalPlayers,
        activePlayers,
        totalTournaments,
        pendingRegistrations,
        totalAdmins
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw error;
    }
  }

  // Add method to check IC number availability
  static async checkIcNumberAvailability(icNumber) {
    try {
      const isPlayerRegistered = await Player.isIcNumberRegistered(icNumber);
      const isInRegistrationSystem = await PlayerRegistration.isIcNumberInSystem(icNumber);
      
      return {
        available: !isPlayerRegistered && !isInRegistrationSystem,
        isPlayerRegistered,
        isInRegistrationSystem
      };
    } catch (error) {
      console.error('Error checking IC number availability:', error);
      throw error;
    }
  }

  // Message operations
  static async createMessage(messageData) {
    try {
      const messageId = await Message.generateMessageId();
      const message = new Message({ ...messageData, messageId });
      return await message.save();
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  static async getPlayerMessages(playerId, page = 1, limit = 10) {
    try {
      return await Message.getPlayerMessages(playerId, page, limit);
    } catch (error) {
      console.error('Error getting player messages:', error);
      throw error;
    }
  }

  static async getUnreadMessageCount(playerId) {
    try {
      return await Message.getUnreadCount(playerId);
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  static async markMessageAsRead(messageId) {
    try {
      const message = await Message.findById(messageId);
      if (message) {
        return await message.markAsRead();
      }
      return null;
    } catch (error) {
      console.error('Error marking message as read:', error);
      throw error;
    }
  }

  static async getMessageById(messageId) {
    try {
      return await Message.findById(messageId);
    } catch (error) {
      console.error('Error getting message by ID:', error);
      throw error;
    }
  }

  static async sendWelcomeMessage(playerId, playerName) {
    try {
      const messageData = {
        recipientId: playerId,
        recipientType: 'player',
        senderType: 'system',
        senderName: 'Malaysia Pickleball Association',
        subject: 'Welcome to Malaysia Pickleball Association!',
        content: `Dear ${playerName},

Welcome to the Malaysia Pickleball Association! Your player registration has been approved and you are now an official member.

Your Player ID: ${playerId}

What you can do now:
• Register for tournaments
• View your ranking and statistics
• Connect with other players
• Access exclusive member benefits

We're excited to have you as part of our growing pickleball community!

Best regards,
Malaysia Pickleball Association Team`,
        type: 'approval',
        priority: 'normal'
      };

      return await this.createMessage(messageData);
    } catch (error) {
      console.error('Error sending welcome message:', error);
      throw error;
    }
  }

  // Notification operations
  static async createNotification(notificationData) {
    try {
      const notificationId = await Notification.generateNotificationId();
      const notification = new Notification({ ...notificationData, notificationId });
      return await notification.save();
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async getNotificationsForUser(userId, userType = 'player', page = 1, limit = 10) {
    try {
      return await Notification.getNotificationsForUser(userId, userType, page, limit);
    } catch (error) {
      console.error('Error getting notifications:', error);
      throw error;
    }
  }

  static async markNotificationAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findById(notificationId);
      if (notification) {
        return await notification.markAsReadByUser(userId);
      }
      return null;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  // Tournament Update operations
  static async createTournamentUpdate(updateData) {
    try {
      const updateId = await TournamentUpdate.generateUpdateId();
      const update = new TournamentUpdate({ ...updateData, updateId });
      return await update.save();
    } catch (error) {
      console.error('Error creating tournament update:', error);
      throw error;
    }
  }

  static async getTournamentUpdates(tournamentId, page = 1, limit = 10) {
    try {
      if (tournamentId) {
        return await TournamentUpdate.getUpdatesForTournament(tournamentId, page, limit);
      } else {
        return await TournamentUpdate.getAllActiveUpdates(page, limit);
      }
    } catch (error) {
      console.error('Error getting tournament updates:', error);
      throw error;
    }
  }

  // Announcement operations
  static async createAnnouncement(announcementData) {
    try {
      const announcementId = await Announcement.generateAnnouncementId();
      const announcement = new Announcement({ ...announcementData, announcementId });
      return await announcement.save();
    } catch (error) {
      console.error('Error creating announcement:', error);
      throw error;
    }
  }

  static async getAnnouncements(targetAudience = 'all', page = 1, limit = 10) {
    try {
      return await Announcement.getActiveAnnouncements(targetAudience, page, limit);
    } catch (error) {
      console.error('Error getting announcements:', error);
      throw error;
    }
  }

  static async getPinnedAnnouncements(targetAudience = 'all') {
    try {
      return await Announcement.getPinnedAnnouncements(targetAudience);
    } catch (error) {
      console.error('Error getting pinned announcements:', error);
      throw error;
    }
  }

  // ========================
  // NEWS OPERATIONS
  // ========================

  static async getAllNews() {
    try {
      const News = require('../models/News');
      return await News.find().sort({ createdAt: -1 });
    } catch (error) {
      console.error('Error getting all news:', error);
      throw error;
    }
  }

  static async getPublishedNews(limit = null) {
    try {
      const News = require('../models/News');
      let query = News.find({ status: 'published' }).sort({ publishedAt: -1 });
      if (limit) {
        query = query.limit(limit);
      }
      return await query;
    } catch (error) {
      console.error('Error getting published news:', error);
      throw error;
    }
  }

  static async getFeaturedNews() {
    try {
      const News = require('../models/News');
      return await News.find({ status: 'published', featured: true }).sort({ publishedAt: -1 }).limit(3);
    } catch (error) {
      console.error('Error getting featured news:', error);
      throw error;
    }
  }

  static async getNewsById(id) {
    try {
      const News = require('../models/News');
      return await News.findById(id);
    } catch (error) {
      console.error('Error getting news by ID:', error);
      throw error;
    }
  }

  static async createNews(newsData) {
    try {
      const News = require('../models/News');
      const news = new News(newsData);
      return await news.save();
    } catch (error) {
      console.error('Error creating news:', error);
      throw error;
    }
  }

  static async updateNews(id, updateData) {
    try {
      const News = require('../models/News');
      return await News.findByIdAndUpdate(id, updateData, { new: true });
    } catch (error) {
      console.error('Error updating news:', error);
      throw error;
    }
  }

  static async deleteNews(id) {
    try {
      const News = require('../models/News');
      return await News.findByIdAndDelete(id);
    } catch (error) {
      console.error('Error deleting news:', error);
      throw error;
    }
  }

  static async incrementNewsViews(id) {
    try {
      const News = require('../models/News');
      return await News.findByIdAndUpdate(id, { $inc: { viewCount: 1 } }, { new: true });
    } catch (error) {
      console.error('Error incrementing news views:', error);
      throw error;
    }
  }

  static async getNewsByCategory(category) {
    try {
      const News = require('../models/News');
      return await News.find({ category, status: 'published' }).sort({ publishedAt: -1 });
    } catch (error) {
      console.error('Error getting news by category:', error);
      throw error;
    }
  }

  static async searchNews(searchTerm) {
    try {
      const News = require('../models/News');
      return await News.find({
        $text: { $search: searchTerm },
        status: 'published'
      }).sort({ score: { $meta: 'textScore' } });
    } catch (error) {
      console.error('Error searching news:', error);
      throw error;
    }
  }

  static async getLatestNews(limit = 5) {
    try {
      const News = require('../models/News');
      return await News.find({ status: 'published' })
        .sort({ publishedAt: -1 })
        .limit(limit)
        .select('title summary content author publishedAt category featuredImage featuredVideo viewCount featured');
    } catch (error) {
      console.error('Error getting latest news:', error);
      throw error;
    }
  }


}

module.exports = DatabaseService; 