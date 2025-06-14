const Tournament = require('../models/Tournament');
const Player = require('../models/Player');
const PlayerRegistration = require('../models/PlayerRegistration');
const Admin = require('../models/Admin');
const Message = require('../models/Message');
const Settings = require('../models/Settings');

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
}

module.exports = DatabaseService; 