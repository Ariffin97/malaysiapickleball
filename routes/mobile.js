const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');

// Import utilities and middleware
const JWTUtil = require('../utils/jwt');
const APIResponse = require('../utils/apiResponse');
const { mobileRateLimiter } = require('../middleware/rateLimiter');
const DatabaseService = require('../services/databaseService');

// Mobile authentication middleware
const mobileAuth = JWTUtil.authenticateToken;

// =============================================================================
// MOBILE APP INFO APIs
// =============================================================================

// App version and configuration
router.get('/app/info', (req, res) => {
  return APIResponse.mobile(res, {
    name: process.env.MOBILE_APP_NAME || 'PickleZone',
    version: process.env.MOBILE_APP_VERSION || '1.0.0',
    minSupportedVersion: '1.0.0',
    apiVersion: process.env.API_VERSION || '1.0',
    features: {
      profilePictures: true,
      pushNotifications: true,
      tournaments: true,
      rankings: true,
      messaging: true
    },
    supportedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || 
      ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880
  }, 'App info retrieved successfully');
});

// Health check for mobile
router.get('/health', (req, res) => {
  return APIResponse.mobile(res, {
    status: 'healthy',
    timestamp: Date.now(),
    server: 'online',
    database: 'connected'
  }, 'Service is healthy');
});

// =============================================================================
// MOBILE PLAYER APIs
// =============================================================================

// Get player essential data (lightweight for mobile)
router.get('/player/me', mobileAuth, mobileRateLimiter, async (req, res) => {
  try {
    const player = await DatabaseService.getPlayerById(req.user.id);
    
    if (!player) {
      return APIResponse.notFound(res, 'Player not found');
    }

    // Lightweight player data for mobile
    const playerData = {
      id: player._id,
      playerId: player.playerId,
      username: player.username,
      fullName: player.fullName,
      email: player.email,
      profilePicture: player.profilePicture,
      status: player.status,
      ranking: {
        points: player.ranking?.points || 0,
        position: player.ranking?.position || null
      },
      stats: {
        tournaments: player.tournaments?.length || 0,
        achievements: player.achievements?.length || 0
      },
      joinDate: player.joinDate,
      lastActive: player.lastLogin || player.updatedAt
    };

    return APIResponse.mobile(res, { player: playerData }, 'Player data retrieved');

  } catch (error) {
    console.error('Get mobile player data error:', error);
    return APIResponse.error(res, 'Failed to retrieve player data', 500);
  }
});

// Update player profile (mobile optimized)
router.put('/player/me', mobileAuth, mobileRateLimiter, [
  body('fullName').optional().trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phoneNumber').optional().isMobilePhone()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return APIResponse.validationError(res, errors.array());
    }

    const { fullName, email, phoneNumber, address } = req.body;
    const updateData = {};

    if (fullName) updateData.fullName = fullName;
    if (email) updateData.email = email;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (address) updateData.address = address;

    const updatedPlayer = await DatabaseService.updatePlayer(req.user.id, updateData);

    if (!updatedPlayer) {
      return APIResponse.notFound(res, 'Player not found');
    }

    return APIResponse.mobile(res, {
      player: {
        id: updatedPlayer._id,
        fullName: updatedPlayer.fullName,
        email: updatedPlayer.email,
        phoneNumber: updatedPlayer.phoneNumber,
        address: updatedPlayer.address
      }
    }, 'Profile updated successfully');

  } catch (error) {
    console.error('Update mobile player profile error:', error);
    return APIResponse.error(res, 'Failed to update profile', 500);
  }
});

// =============================================================================
// MOBILE TOURNAMENT APIs
// =============================================================================

// Get tournaments (mobile optimized)
router.get('/tournaments', mobileRateLimiter, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status; // upcoming, ongoing, completed
    const type = req.query.type; // local, state, national

    const query = {};
    
    if (status === 'upcoming') {
      query.startDate = { $gt: new Date() };
    } else if (status === 'ongoing') {
      query.startDate = { $lte: new Date() };
      query.endDate = { $gte: new Date() };
    } else if (status === 'completed') {
      query.endDate = { $lt: new Date() };
    }
    
    if (type) {
      query.type = type;
    }

    const tournaments = await DatabaseService.getTournaments(query, page, limit);
    
    // Lightweight tournament data for mobile
    const mobileData = tournaments.data.map(tournament => ({
      id: tournament._id,
      name: tournament.name,
      type: tournament.type,
      startDate: tournament.startDate,
      endDate: tournament.endDate,
      location: tournament.location,
      maxParticipants: tournament.maxParticipants,
      registeredCount: tournament.participants?.length || 0,
      status: tournament.status,
      image: tournament.image,
      isRegistrationOpen: tournament.registrationDeadline > new Date()
    }));

    return APIResponse.mobile(res, {
      tournaments: mobileData,
      pagination: tournaments.pagination
    }, 'Tournaments retrieved');

  } catch (error) {
    console.error('Get mobile tournaments error:', error);
    return APIResponse.error(res, 'Failed to retrieve tournaments', 500);
  }
});

// Register for tournament (mobile)
router.post('/tournaments/:id/register', mobileAuth, mobileRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const playerId = req.user.id;

    const result = await DatabaseService.registerPlayerForTournament(playerId, id);

    if (!result.success) {
      return APIResponse.error(res, result.message, 400);
    }

    return APIResponse.mobile(res, {
      registration: result.data
    }, 'Successfully registered for tournament');

  } catch (error) {
    console.error('Mobile tournament registration error:', error);
    return APIResponse.error(res, 'Failed to register for tournament', 500);
  }
});

// =============================================================================
// MOBILE RANKING APIs
// =============================================================================

// Get rankings (mobile optimized)
router.get('/rankings', mobileRateLimiter, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const rankings = await DatabaseService.getRankings(page, limit);

    // Lightweight ranking data
    const mobileData = rankings.data.map((player, index) => ({
      position: (page - 1) * limit + index + 1,
      playerId: player.playerId,
      fullName: player.fullName,
      points: player.ranking?.points || 0,
      profilePicture: player.profilePicture
    }));

    return APIResponse.mobile(res, {
      rankings: mobileData,
      pagination: rankings.pagination
    }, 'Rankings retrieved');

  } catch (error) {
    console.error('Get mobile rankings error:', error);
    return APIResponse.error(res, 'Failed to retrieve rankings', 500);
  }
});

// Get player's ranking
router.get('/player/ranking', mobileAuth, mobileRateLimiter, async (req, res) => {
  try {
    const player = await DatabaseService.getPlayerById(req.user.id);
    
    if (!player) {
      return APIResponse.notFound(res, 'Player not found');
    }

    const ranking = {
      points: player.ranking?.points || 0,
      position: player.ranking?.position || null,
      totalPlayers: await DatabaseService.getTotalActivePlayers(),
      lastUpdated: player.ranking?.lastUpdated || null
    };

    return APIResponse.mobile(res, { ranking }, 'Player ranking retrieved');

  } catch (error) {
    console.error('Get mobile player ranking error:', error);
    return APIResponse.error(res, 'Failed to retrieve ranking', 500);
  }
});

// =============================================================================
// MOBILE MESSAGING APIs
// =============================================================================

// Get messages (mobile optimized)
router.get('/messages', mobileAuth, mobileRateLimiter, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const messages = await DatabaseService.getPlayerMessages(req.user.id, page, limit);

    // Lightweight message data
    const mobileData = messages.data.map(message => ({
      id: message._id,
      title: message.title,
      preview: message.content.substring(0, 100) + '...',
      isRead: message.isRead,
      createdAt: message.createdAt,
      type: message.type || 'general'
    }));

    return APIResponse.mobile(res, {
      messages: mobileData,
      unreadCount: messages.unreadCount,
      pagination: messages.pagination
    }, 'Messages retrieved');

  } catch (error) {
    console.error('Get mobile messages error:', error);
    return APIResponse.error(res, 'Failed to retrieve messages', 500);
  }
});

// Mark message as read
router.put('/messages/:id/read', mobileAuth, mobileRateLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    
    await DatabaseService.markMessageAsRead(id, req.user.id);

    return APIResponse.mobile(res, null, 'Message marked as read');

  } catch (error) {
    console.error('Mark mobile message as read error:', error);
    return APIResponse.error(res, 'Failed to mark message as read', 500);
  }
});

module.exports = router; 