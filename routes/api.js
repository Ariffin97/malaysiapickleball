const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const DatabaseService = require('../services/databaseService');
const Player = require('../models/Player');
const Admin = require('../models/Admin');
const PlayerRegistration = require('../models/PlayerRegistration');
const UnregisteredPlayer = require('../models/UnregisteredPlayer');
// const APIKey = require('../models/APIKey'); // Commented out - API key model removed
const cloudinary = require('cloudinary').v2;

// Import utilities and middleware
const JWTUtil = require('../utils/jwt');
const APIResponse = require('../utils/apiResponse');
const { authRateLimiter, apiRateLimiter, mobileRateLimiter } = require('../middleware/rateLimiter');

// Rate limiting for API endpoints
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 100;

const checkApiRateLimit = (req, res, next) => {
  const clientIP = req.ip;
  const now = Date.now();
  
  if (!rateLimit.has(clientIP)) {
    rateLimit.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  const clientData = rateLimit.get(clientIP);
  
  if (now > clientData.resetTime) {
    rateLimit.set(clientIP, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return next();
  }
  
  if (clientData.count >= MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil((clientData.resetTime - now) / 1000)
    });
  }
  
  clientData.count++;
  next();
};

// Enhanced Authentication middleware that supports both session and JWT
const hybridAuth = async (req, res, next) => {
  // Try JWT first (for mobile apps)
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = JWTUtil.extractTokenFromHeader(authHeader);
      if (token) {
        const decoded = JWTUtil.verifyToken(token);
        req.user = decoded;
        req.authType = 'jwt';
        return next();
      }
    } catch (error) {
      // JWT failed, try session auth
    }
  }
  
  // Fall back to session auth (for web)
  if (req.session?.isPlayerAuthenticated || req.session?.isAuthenticated) {
    req.user = {
      id: req.session.playerId || req.session.adminId,
      type: req.session.isAuthenticated ? 'admin' : 'player',
      username: req.session.username || req.session.playerUsername
    };
    req.authType = 'session';
    return next();
  }
  
  return APIResponse.unauthorized(res, 'Authentication required');
};

// Player-only authentication
const playerAuth = async (req, res, next) => {
  await hybridAuth(req, res, () => {
    if (req.user.type !== 'player' && !req.session?.isPlayerAuthenticated) {
      return APIResponse.forbidden(res, 'Player authentication required');
    }
    next();
  });
};

// Admin-only authentication  
const adminAuth = async (req, res, next) => {
  await hybridAuth(req, res, async () => {
    if (req.user.type !== 'admin' && !req.session?.isAuthenticated) {
      return APIResponse.forbidden(res, 'Admin authentication required');
    }
    
    try {
      const admin = await DatabaseService.getAdminByUsername(req.user.username);
      if (!admin || !admin.isActive) {
        return APIResponse.unauthorized(res, 'Unauthorized admin access');
      }
      req.admin = admin;
      next();
    } catch (error) {
      console.error('Admin auth error:', error);
      return APIResponse.error(res, 'Authentication error', 500);
    }
  });
};

// =============================================================================
// AUTHENTICATION APIs
// =============================================================================

// Enhanced Player Login API with JWT support
router.post('/auth/player/login', authRateLimiter, [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return APIResponse.validationError(res, errors.array());
    }

    const { username, password } = req.body;
    
    // Get player from database
    const player = await DatabaseService.getPlayerByUsername(username);
    
    if (!player) {
      return APIResponse.unauthorized(res, 'Invalid username or password');
    }

    // Check if account is active
    if (player.status !== 'active') {
      return APIResponse.forbidden(res, 'Account is not active. Please contact admin.');
    }

    // Verify password
    const isValidPassword = await player.comparePassword(password);
    
    if (!isValidPassword) {
      return APIResponse.unauthorized(res, 'Invalid username or password');
    }

    // Generate JWT tokens for mobile
    const tokenPayload = {
      id: player._id,
      playerId: player.playerId,
      username: player.username,
      type: 'player'
    };
    
    const tokens = JWTUtil.generateTokens(tokenPayload);

    // Also create session for web compatibility
    req.session.isPlayerAuthenticated = true;
    req.session.playerId = player._id;
    req.session.playerUsername = player.username;
    req.session.playerLoginTime = Date.now();

    // Update last login
    await DatabaseService.updatePlayerLastLogin(player._id);

    return APIResponse.success(res, {
      player: {
        id: player._id,
        playerId: player.playerId,
        username: player.username,
        fullName: player.fullName,
        email: player.email,
        status: player.status,
        profilePicture: player.profilePicture
      },
      tokens,
      sessionId: req.sessionID
    }, 'Login successful');

  } catch (error) {
    console.error('Player login API error:', error);
    return APIResponse.error(res, 'Login failed', 500);
  }
});

// Enhanced Admin Login API
router.post('/auth/admin/login', authRateLimiter, [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return APIResponse.validationError(res, errors.array());
    }

    const { username, password } = req.body;
    
    // Get admin from database
    const admin = await DatabaseService.getAdminByUsername(username);
    
    if (!admin) {
      return APIResponse.unauthorized(res, 'Invalid username or password');
    }

    // Check if account is locked
    if (admin.isLocked && admin.isLocked()) {
      return APIResponse.forbidden(res, 'Account temporarily locked due to multiple failed attempts');
    }

    // Verify password
    const isValidPassword = await admin.comparePassword(password);
    
    if (!isValidPassword) {
      // Increment login attempts
      await admin.incLoginAttempts();
      return APIResponse.unauthorized(res, 'Invalid username or password');
    }

    // Reset login attempts on successful login
    if (admin.loginAttempts > 0) {
      await admin.resetLoginAttempts();
    }

    // Generate JWT tokens
    const tokenPayload = {
      id: admin._id,
      username: admin.username,
      role: admin.role,
      type: 'admin'
    };
    
    const tokens = JWTUtil.generateTokens(tokenPayload);

    // Create session
    req.session.isAuthenticated = true;
    req.session.adminId = admin._id;
    req.session.username = admin.username;
    req.session.role = admin.role;
    req.session.loginTime = Date.now();
    req.session.userAgent = req.get('User-Agent');

    // Update last login
    await DatabaseService.updateAdminLastLogin(admin._id);

    return APIResponse.success(res, {
      admin: {
        id: admin._id,
        username: admin.username,
        fullName: admin.fullName,
        role: admin.role,
        permissions: admin.permissions
      },
      tokens,
      sessionId: req.sessionID
    }, 'Login successful');

  } catch (error) {
    console.error('Admin login API error:', error);
    return APIResponse.error(res, 'Login failed', 500);
  }
});

// Token refresh endpoint
router.post('/auth/refresh', apiRateLimiter, async (req, res) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      return APIResponse.unauthorized(res, 'Refresh token required');
    }

    const decoded = JWTUtil.verifyToken(refreshToken);
    
    // Generate new tokens
    const tokenPayload = {
      id: decoded.id,
      username: decoded.username,
      type: decoded.type,
      ...(decoded.playerId && { playerId: decoded.playerId }),
      ...(decoded.role && { role: decoded.role })
    };
    
    const tokens = JWTUtil.generateTokens(tokenPayload);

    return APIResponse.success(res, { tokens }, 'Tokens refreshed successfully');

  } catch (error) {
    console.error('Token refresh error:', error);
    return APIResponse.unauthorized(res, 'Invalid refresh token');
  }
});

// Logout endpoint
router.post('/auth/logout', hybridAuth, (req, res) => {
  try {
    // Destroy session if exists
    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
      }
    });

    return APIResponse.success(res, null, 'Logout successful');
  } catch (error) {
    console.error('Logout error:', error);
    return APIResponse.error(res, 'Logout failed', 500);
  }
});

// =============================================================================
// REGISTRATION APIs
// =============================================================================

// Player Registration API
router.post('/player/register', checkApiRateLimit, [
  body('fullName').isLength({ min: 2 }).trim().escape(),
  body('icNumber').isLength({ min: 12, max: 12 }).matches(/^\d{12}$/),
  body('age').isInt({ min: 12, max: 100 }),
  body('address').isLength({ min: 10 }).trim().escape(),
  body('phoneNumber').isMobilePhone().withMessage('Valid phone number required'),
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 20 }).matches(/^[a-zA-Z0-9_]+$/),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { fullName, icNumber, age, address, phoneNumber, email, username, password } = req.body;

    // Check if IC number is already registered
    const icCheck = await DatabaseService.checkIcNumberAvailability(icNumber);
    if (!icCheck.available) {
      return res.status(409).json({
        success: false,
        message: 'IC number already registered in the system'
      });
    }

    // Check if username or email already exists
    const existingUser = await Player.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Create player registration
    const registrationData = {
      fullName,
      icNumber,
      age: parseInt(age),
      address,
      phoneNumber,
      email,
      username,
      password
    };

    const registrationId = await DatabaseService.createPlayerRegistration(registrationData);
    
    res.status(201).json({
      success: true,
      message: 'Registration submitted successfully. Please wait for admin approval.',
      data: {
        registrationId
      }
    });

  } catch (error) {
    console.error('Player registration API error:', error);
    
    if (error.message.includes('already registered')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.'
    });
  }
});

// =============================================================================
// APPROVAL APIs (Admin Only)
// =============================================================================

// Get Pending Registrations API
router.get('/admin/registrations/pending', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const registrations = await PlayerRegistration.find({ status: 'pending' })
      .sort({ submittedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await PlayerRegistration.countDocuments({ status: 'pending' });

    res.json({
      success: true,
      data: {
        registrations,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get pending registrations API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending registrations'
    });
  }
});

// Approve Registration API
router.post('/admin/registrations/:id/approve', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const result = await DatabaseService.approvePlayerRegistration(id, req.session.username, notes);
    
    res.json({
      success: true,
      message: 'Registration approved successfully',
      data: {
        playerId: result.playerId
      }
    });

  } catch (error) {
    console.error('Approve registration API error:', error);
    
    if (error.message.includes('not found') || error.message.includes('already processed')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to approve registration'
    });
  }
});

// Reject Registration API
router.post('/admin/registrations/:id/reject', adminAuth, [
  body('notes').isLength({ min: 10 }).withMessage('Rejection reason must be at least 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { notes } = req.body;

    await DatabaseService.rejectPlayerRegistration(id, req.session.username, notes);
    
    res.json({
      success: true,
      message: 'Registration rejected'
    });

  } catch (error) {
    console.error('Reject registration API error:', error);
    
    if (error.message.includes('not found') || error.message.includes('already processed')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to reject registration'
    });
  }
});

// =============================================================================
// USER DATA APIs
// =============================================================================

// Get Current User Profile (Player)
router.get('/player/profile', async (req, res) => {
  if (!req.session?.isPlayerAuthenticated || !req.session?.playerId) {
    return res.status(401).json({
      success: false,
      message: 'Player authentication required'
    });
  }

  try {
    const player = await DatabaseService.getPlayerById(req.session.playerId);
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Don't send password
    const playerData = {
      id: player._id,
      playerId: player.playerId,
      fullName: player.fullName,
      icNumber: player.icNumber,
      age: player.age,
      address: player.address,
      phoneNumber: player.phoneNumber,
      email: player.email,
      username: player.username,
      profilePicture: player.profilePicture,
      status: player.status,
      joinDate: player.joinDate,
      tournaments: player.tournaments,
      ranking: player.ranking
    };

    res.json({
      success: true,
      data: { player: playerData }
    });

  } catch (error) {
    console.error('Get player profile API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// Get Current Admin Profile
router.get('/admin/profile', adminAuth, async (req, res) => {
  try {
    const adminData = {
      id: req.admin._id,
      username: req.admin.username,
      email: req.admin.email,
      fullName: req.admin.fullName,
      role: req.admin.role,
      permissions: req.admin.permissions,
      lastLogin: req.admin.lastLogin
    };

    res.json({
      success: true,
      data: { admin: adminData }
    });

  } catch (error) {
    console.error('Get admin profile API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin profile'
    });
  }
});

// Get All Players (Admin Only)
router.get('/admin/players', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';
    const status = req.query.status || 'all';

    let query = {};
    
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { playerId: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status !== 'all') {
      query.status = status;
    }

    const players = await Player.find(query)
      .select('-password') // Exclude password
      .sort({ joinDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Player.countDocuments(query);

    res.json({
      success: true,
      data: {
        players,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get players API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch players'
    });
  }
});

// =============================================================================
// UTILITY APIs
// =============================================================================

// Check IC Number Availability API
router.get('/check-ic/:icNumber', checkApiRateLimit, async (req, res) => {
  try {
    const { icNumber } = req.params;
    console.log('🔍 API IC Check called for:', icNumber);
    
    // Only accept dashed format: 123456-78-9012 (frontend auto-formats to this)
    const icRegex = /^[0-9]{6}-[0-9]{2}-[0-9]{4}$/;
    if (!icRegex.test(icNumber)) {
      console.log('❌ API IC format invalid:', icNumber);
      return res.status(200).json({
        success: false,
        available: false,
        message: 'Invalid IC number format. Please use format: 123456-78-9012'
      });
    }
    
    console.log('✅ API IC format valid, checking availability...');

    const result = await DatabaseService.checkIcNumberAvailability(icNumber);
    
    let message = '';
    if (result.available) {
      message = 'IC number is available for registration';
    } else if (result.isPlayerRegistered) {
      message = 'This IC number is already registered as an active player';
    } else if (result.isInRegistrationSystem) {
      message = 'This IC number already has a pending registration';
    }
    
    console.log('✅ API IC availability result:', {
      available: result.available,
      message: message
    });
    
    res.status(200).json({
      success: true,
      available: result.available,
      message: message,
      isPlayerRegistered: result.isPlayerRegistered,
      isInRegistrationSystem: result.isInRegistrationSystem
    });

  } catch (error) {
    console.error('❌ API IC check error:', error);
    res.status(200).json({
      success: false,
      available: false,
      message: 'Error checking IC number availability'
    });
  }
});

// Check Registration Status API
router.get('/registration/status/:registrationId', checkApiRateLimit, async (req, res) => {
  try {
    const { registrationId } = req.params;
    
    const registration = await PlayerRegistration.findOne({ registrationId });
    
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    const responseData = {
      registrationId: registration.registrationId,
      fullName: registration.fullName,
      status: registration.status,
      submittedAt: registration.submittedAt,
      processedAt: registration.processedAt,
      processedBy: registration.processedBy,
      notes: registration.notes
    };

    // If approved, include player ID
    if (registration.status === 'approved') {
      const player = await Player.findOne({ icNumber: registration.icNumber });
      if (player) {
        responseData.playerId = player.playerId;
      }
    }

    res.json({
      success: true,
      data: responseData
    });

  } catch (error) {
    console.error('Check registration status API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check registration status'
    });
  }
});

// Get Registration by IC Number (for users to check their own status)
router.get('/registration/check-by-ic/:icNumber', checkApiRateLimit, async (req, res) => {
  try {
    const { icNumber } = req.params;
    
    if (!/^\d{12}$/.test(icNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IC number format'
      });
    }

    // Check if already a player
    const existingPlayer = await Player.findOne({ icNumber });
    if (existingPlayer) {
      return res.json({
        success: true,
        data: {
          status: 'approved',
          playerId: existingPlayer.playerId,
          fullName: existingPlayer.fullName,
          approvedAt: existingPlayer.joinDate
        }
      });
    }

    // Check pending registration
    const registration = await PlayerRegistration.findOne({ icNumber })
      .sort({ submittedAt: -1 }); // Get most recent registration

    if (!registration) {
      return res.json({
        success: true,
        data: {
          status: 'not_found',
          message: 'No registration found for this IC number'
        }
      });
    }

    res.json({
      success: true,
      data: {
        registrationId: registration.registrationId,
        status: registration.status,
        fullName: registration.fullName,
        submittedAt: registration.submittedAt,
        processedAt: registration.processedAt,
        notes: registration.notes
      }
    });

  } catch (error) {
    console.error('Check registration by IC API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check registration'
    });
  }
});

// =============================================================================
// MOBILE-OPTIMIZED ENDPOINTS
// =============================================================================

// Get Essential Player Data (Mobile Optimized)
router.get('/mobile/player/essential', async (req, res) => {
  if (!req.session?.isPlayerAuthenticated || !req.session?.playerId) {
    return res.status(401).json({
      success: false,
      message: 'Player authentication required'
    });
  }

  try {
    const player = await DatabaseService.getPlayerById(req.session.playerId);
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Mobile-optimized response with essential data only
    const essentialData = {
      playerId: player.playerId,
      fullName: player.fullName,
      email: player.email,
      status: player.status,
      profilePicture: player.profilePicture,
      ranking: {
        points: player.ranking?.points || 0,
        position: player.ranking?.position || null
      },
      tournamentsCount: player.tournaments?.length || 0,
      joinDate: player.joinDate
    };

    res.json({
      success: true,
      data: { player: essentialData }
    });

  } catch (error) {
    console.error('Get essential player data API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch essential data'
    });
  }
});

// Get Player Tournament History (Mobile Optimized)
router.get('/mobile/player/tournaments', async (req, res) => {
  if (!req.session?.isPlayerAuthenticated || !req.session?.playerId) {
    return res.status(401).json({
      success: false,
      message: 'Player authentication required'
    });
  }

  try {
    const player = await DatabaseService.getPlayerById(req.session.playerId);
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    const tournaments = player.tournaments || [];

    res.json({
      success: true,
      data: { 
        tournaments,
        totalCount: tournaments.length
      }
    });

  } catch (error) {
    console.error('Get player tournaments API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tournaments'
    });
  }
});

// =============================================================================
// PROFILE PICTURE APIS (Enhanced)
// =============================================================================

// Upload/Update Player Profile Picture (Enhanced)
router.post('/player/profile/picture', playerAuth, async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.files || !req.files.profilePicture) {
      return APIResponse.validationError(res, [{ msg: 'Profile picture file is required' }]);
    }

    const profilePicture = req.files.profilePicture;
    
    // Validate file type
    const allowedMimeTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || 
      ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    
    if (!allowedMimeTypes.includes(profilePicture.mimetype)) {
      return APIResponse.validationError(res, [{ 
        msg: 'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed' 
      }]);
    }

    // Validate file size
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024; // 5MB
    if (profilePicture.size > maxSize) {
      return APIResponse.validationError(res, [{ 
        msg: `File size too large. Maximum ${Math.round(maxSize / 1024 / 1024)}MB allowed` 
      }]);
    }

    // Generate unique filename
    const fileExtension = profilePicture.name.split('.').pop();
    const userId = req.user.id;
    const fileName = `profile_${userId}_${Date.now()}.${fileExtension}`;
    
    // Create upload directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const uploadPath = process.env.UPLOAD_PATH || './public/uploads';
    const profilesDir = path.join(__dirname, '..', uploadPath, 'profiles');
    
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
    }

    // Upload to Cloudinary instead of local storage
    const cloudinaryResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: `profile_${userId}_${Date.now()}`,
          folder: 'player_profiles',
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' },
            { format: 'auto' }
          ],
          tags: ['profile_picture', `user_${userId}`]
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(profilePicture.data);
    });

    // Update player profile picture in database with CLOUDINARY URL
    const profilePictureUrl = cloudinaryResult.secure_url;
    await Player.findByIdAndUpdate(userId, {
      profilePicture: profilePictureUrl,
      profilePictureCloudinaryId: cloudinaryResult.public_id
    });

    return APIResponse.success(res, {
      profilePicture: profilePictureUrl,
      cloudinaryId: cloudinaryResult.public_id,
      size: profilePicture.size,
      type: profilePicture.mimetype
    }, 'Profile picture updated successfully');

  } catch (error) {
    console.error('Profile picture upload API error:', error);
    return APIResponse.error(res, 'Failed to upload profile picture', 500);
  }
});

// Update Player Profile (including profile picture URL)
router.put('/player/profile', checkApiRateLimit, [
  body('fullName').optional().trim().isLength({ min: 2, max: 100 }),
  body('phoneNumber').optional().trim().matches(/^[0-9+\-\s\(\)]+$/),
  body('email').optional().isEmail().normalizeEmail(),
  body('profilePicture').optional().isURL()
], async (req, res) => {
  if (!req.session?.isPlayerAuthenticated || !req.session?.playerId) {
    return res.status(401).json({
      success: false,
      message: 'Player authentication required'
    });
  }

  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { fullName, phoneNumber, email, profilePicture, address } = req.body;
    const updateData = {};

    // Only update provided fields
    if (fullName) updateData.fullName = fullName;
    if (phoneNumber) updateData.phoneNumber = phoneNumber;
    if (email) updateData.email = email;
    if (profilePicture) updateData.profilePicture = profilePicture;
    if (address) updateData.address = address;

    // Update player in database
    const updatedPlayer = await Player.findByIdAndUpdate(
      req.session.playerId, 
      updateData, 
      { new: true, select: '-password' }
    );

    if (!updatedPlayer) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        player: {
          playerId: updatedPlayer.playerId,
          fullName: updatedPlayer.fullName,
          email: updatedPlayer.email,
          phoneNumber: updatedPlayer.phoneNumber,
          address: updatedPlayer.address,
          profilePicture: updatedPlayer.profilePicture,
          status: updatedPlayer.status
        }
      }
    });

  } catch (error) {
    console.error('Update player profile API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// =============================================================================
// DASHBOARD STATS APIS
// =============================================================================

// Get Player Dashboard Stats
router.get('/player/dashboard/stats', async (req, res) => {
  if (!req.session?.isPlayerAuthenticated || !req.session?.playerId) {
    return res.status(401).json({
      success: false,
      message: 'Player authentication required'
    });
  }

  try {
    const player = await Player.findById(req.session.playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Get unread message count
    const Message = require('../models/Message');
    const unreadCount = await Message.getUnreadCount(player._id);

    // Calculate achievements (placeholder - you can extend this)
    const achievements = 0; // TODO: Implement achievement system

    const stats = {
      tournaments: {
        total: player.tournaments?.length || 0,
        registered: player.tournaments?.filter(t => t.status === 'registered').length || 0,
        confirmed: player.tournaments?.filter(t => t.status === 'confirmed').length || 0
      },
      ranking: {
        points: player.ranking?.points || 0,
        position: player.ranking?.position || null,
        lastUpdated: player.ranking?.lastUpdated || null
      },
      achievements: {
        total: achievements
      },
      messages: {
        unreadCount: unreadCount
      },
      profile: {
        completeness: calculateProfileCompleteness(player)
      }
    };

    res.json({
      success: true,
      data: { stats }
    });

  } catch (error) {
    console.error('Get dashboard stats API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats'
    });
  }
});

// Helper function to calculate profile completeness
function calculateProfileCompleteness(player) {
  let completed = 0;
  let total = 8;

  if (player.fullName) completed++;
  if (player.email) completed++;
  if (player.phoneNumber) completed++;
  if (player.address) completed++;
  if (player.icNumber) completed++;
  if (player.age) completed++;
  if (player.username) completed++;
  if (player.profilePicture) completed++;

  return Math.round((completed / total) * 100);
}

// =============================================================================
// TOURNAMENT APIS
// =============================================================================

// Get All Available Tournaments
router.get('/tournaments', checkApiRateLimit, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const type = req.query.type || 'all';

    let query = { registrationOpen: true };
    
    if (type !== 'all') {
      query.type = type;
    }

    const tournaments = await DatabaseService.getAllTournaments();
    
    // Filter tournaments
    let filteredTournaments = tournaments.filter(tournament => {
      if (type !== 'all' && tournament.type !== type) return false;
      return tournament.registrationOpen !== false;
    });

    // Pagination
    const total = filteredTournaments.length;
    const paginatedTournaments = filteredTournaments.slice(skip, skip + limit);

    res.json({
      success: true,
      data: {
        tournaments: paginatedTournaments,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get tournaments API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tournaments'
    });
  }
});

// Register for Tournament
router.post('/tournaments/:tournamentId/register', checkApiRateLimit, async (req, res) => {
  if (!req.session?.isPlayerAuthenticated || !req.session?.playerId) {
    return res.status(401).json({
      success: false,
      message: 'Player authentication required'
    });
  }

  try {
    const { tournamentId } = req.params;
    const playerId = req.session.playerId;

    const player = await Player.findById(playerId);
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Check if already registered
    const alreadyRegistered = player.tournaments?.some(
      t => t.tournamentId.toString() === tournamentId
    );

    if (alreadyRegistered) {
      return res.status(400).json({
        success: false,
        message: 'Already registered for this tournament'
      });
    }

    // Add tournament to player's tournaments
    player.tournaments.push({
      tournamentId: tournamentId,
      registrationDate: new Date(),
      status: 'registered'
    });

    await player.save();

    res.json({
      success: true,
      message: 'Successfully registered for tournament',
      data: {
        tournamentId: tournamentId,
        registrationDate: new Date(),
        status: 'registered'
      }
    });

  } catch (error) {
    console.error('Tournament registration API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register for tournament'
    });
  }
});

// Get Player's Tournament History
router.get('/player/tournaments', async (req, res) => {
  if (!req.session?.isPlayerAuthenticated || !req.session?.playerId) {
    return res.status(401).json({
      success: false,
      message: 'Player authentication required'
    });
  }

  try {
    const player = await Player.findById(req.session.playerId).populate('tournaments.tournamentId');
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    const tournaments = player.tournaments || [];

    res.json({
      success: true,
      data: {
        tournaments: tournaments,
        totalCount: tournaments.length
      }
    });

  } catch (error) {
    console.error('Get player tournaments API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player tournaments'
    });
  }
});

// =============================================================================
// RANKING APIS
// =============================================================================

// Get Player Rankings/Leaderboard
router.get('/rankings', checkApiRateLimit, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const players = await Player.find({ status: 'active' })
      .select('playerId fullName ranking profilePicture')
      .sort({ 'ranking.points': -1 })
      .skip(skip)
      .limit(limit);

    // Add position numbers
    const rankings = players.map((player, index) => ({
      position: skip + index + 1,
      playerId: player.playerId,
      fullName: player.fullName,
      points: player.ranking?.points || 0,
      profilePicture: player.profilePicture
    }));

    const total = await Player.countDocuments({ status: 'active' });

    res.json({
      success: true,
      data: {
        rankings: rankings,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total: total
        }
      }
    });

  } catch (error) {
    console.error('Get rankings API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch rankings'
    });
  }
});

// Get Player's Ranking Position
router.get('/player/ranking', async (req, res) => {
  if (!req.session?.isPlayerAuthenticated || !req.session?.playerId) {
    return res.status(401).json({
      success: false,
      message: 'Player authentication required'
    });
  }

  try {
    const player = await Player.findById(req.session.playerId);
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }

    // Calculate position by counting players with higher points
    const higherRankedCount = await Player.countDocuments({
      status: 'active',
      'ranking.points': { $gt: player.ranking?.points || 0 }
    });

    const position = higherRankedCount + 1;

    res.json({
      success: true,
      data: {
        ranking: {
          position: position,
          points: player.ranking?.points || 0,
          lastUpdated: player.ranking?.lastUpdated || null
        }
      }
    });

  } catch (error) {
    console.error('Get player ranking API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch player ranking'
    });
  }
});

// =============================================================================
// MESSAGING APIS
// =============================================================================

// Get Player Messages (Inbox)
router.get('/player/messages', checkApiRateLimit, async (req, res) => {
  if (!req.session?.isPlayerAuthenticated || !req.session?.playerId) {
    return res.status(401).json({
      success: false,
      message: 'Player authentication required'
    });
  }

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const Message = require('../models/Message');
    
    let query = { 
      recipientId: req.session.playerId, 
      recipientType: 'player' 
    };

    if (unreadOnly) {
      query.isRead = false;
    }

    const skip = (page - 1) * limit;
    
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Message.countDocuments(query);
    const unreadCount = await Message.countDocuments({
      recipientId: req.session.playerId,
      recipientType: 'player',
      isRead: false
    });

    res.json({
      success: true,
      data: {
        messages: messages,
        unreadCount: unreadCount,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get player messages API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch messages'
    });
  }
});

// Get Single Message
router.get('/player/messages/:messageId', async (req, res) => {
  if (!req.session?.isPlayerAuthenticated || !req.session?.playerId) {
    return res.status(401).json({
      success: false,
      message: 'Player authentication required'
    });
  }

  try {
    const { messageId } = req.params;
    const Message = require('../models/Message');
    
    const message = await Message.findOne({
      messageId: messageId,
      recipientId: req.session.playerId,
      recipientType: 'player'
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      data: { message }
    });

  } catch (error) {
    console.error('Get message API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch message'
    });
  }
});

// Mark Message as Read
router.put('/player/messages/:messageId/read', async (req, res) => {
  if (!req.session?.isPlayerAuthenticated || !req.session?.playerId) {
    return res.status(401).json({
      success: false,
      message: 'Player authentication required'
    });
  }

  try {
    const { messageId } = req.params;
    const Message = require('../models/Message');
    
    const message = await Message.findOne({
      messageId: messageId,
      recipientId: req.session.playerId,
      recipientType: 'player'
    });

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await message.markAsRead();

    res.json({
      success: true,
      message: 'Message marked as read',
      data: { 
        messageId: messageId,
        isRead: true,
        readAt: message.readAt 
      }
    });

  } catch (error) {
    console.error('Mark message as read API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark message as read'
    });
  }
});

// Mark All Messages as Read
router.put('/player/messages/mark-all-read', async (req, res) => {
  if (!req.session?.isPlayerAuthenticated || !req.session?.playerId) {
    return res.status(401).json({
      success: false,
      message: 'Player authentication required'
    });
  }

  try {
    const Message = require('../models/Message');
    
    const result = await Message.updateMany(
      {
        recipientId: req.session.playerId,
        recipientType: 'player',
        isRead: false
      },
      {
        $set: {
          isRead: true,
          readAt: new Date()
        }
      }
    );

    res.json({
      success: true,
      message: 'All messages marked as read',
      data: {
        modifiedCount: result.modifiedCount
      }
    });

  } catch (error) {
    console.error('Mark all messages as read API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all messages as read'
    });
  }
});

// Delete Message
router.delete('/player/messages/:messageId', async (req, res) => {
  if (!req.session?.isPlayerAuthenticated || !req.session?.playerId) {
    return res.status(401).json({
      success: false,
      message: 'Player authentication required'
    });
  }

  try {
    const { messageId } = req.params;
    const Message = require('../models/Message');
    
    const result = await Message.deleteOne({
      messageId: messageId,
      recipientId: req.session.playerId,
      recipientType: 'player'
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });

  } catch (error) {
    console.error('Delete message API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete message'
    });
  }
});

// =============================================================================
// ACHIEVEMENT APIS (Placeholder for future implementation)
// =============================================================================

// Get Player Achievements
router.get('/player/achievements', async (req, res) => {
  if (!req.session?.isPlayerAuthenticated || !req.session?.playerId) {
    return res.status(401).json({
      success: false,
      message: 'Player authentication required'
    });
  }

  try {
    // Placeholder - implement achievement system later
    const achievements = [];

    res.json({
      success: true,
      data: {
        achievements: achievements,
        totalCount: achievements.length
      }
    });

  } catch (error) {
    console.error('Get achievements API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch achievements'
    });
  }
});

// =============================================================================
// MISSING MOBILE APP ENDPOINTS
// =============================================================================

// Get Messages (Missing /api/messages endpoint)
router.get('/messages', checkApiRateLimit, async (req, res) => {
  // Extract user ID from JWT token if provided
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = JWTUtil.extractTokenFromHeader(authHeader);
      if (token) {
        const decoded = JWTUtil.verifyToken(token);
        userId = decoded.id;
      }
    } catch (error) {
      // If JWT fails, check session
      if (req.session?.isPlayerAuthenticated) {
        userId = req.session.playerId;
      }
    }
  } else if (req.session?.isPlayerAuthenticated) {
    userId = req.session.playerId;
  }

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Player authentication required'
    });
  }
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await DatabaseService.getPlayerMessages(userId, page, limit);
    const unreadCount = await DatabaseService.getUnreadMessageCount(userId);
    
    // Format messages for mobile app
    const messages = result.messages.map(message => ({
      id: message._id,
      messageId: message.messageId,
      title: message.subject,
      content: message.content,
      type: message.type,
      priority: message.priority,
      isRead: message.isRead,
      readAt: message.readAt,
      createdAt: message.createdAt,
      senderName: message.senderName
    }));

    return APIResponse.success(res, {
      messages: messages,
      unreadCount: unreadCount,
      pagination: result.pagination || {
        page: result.page,
        pages: result.pages,
        total: result.total,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    }, 'Messages retrieved successfully');

  } catch (error) {
    console.error('Get messages API error:', error);
    return APIResponse.error(res, 'Failed to retrieve messages', 500);
  }
});

// Mark Message as Read (for /api/messages/{messageId}/read)
router.post('/messages/:messageId/read', checkApiRateLimit, async (req, res) => {
  // Extract user ID from JWT token if provided
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = JWTUtil.extractTokenFromHeader(authHeader);
      if (token) {
        const decoded = JWTUtil.verifyToken(token);
        userId = decoded.id;
      }
    } catch (error) {
      // If JWT fails, check session
      if (req.session?.isPlayerAuthenticated) {
        userId = req.session.playerId;
      }
    }
  } else if (req.session?.isPlayerAuthenticated) {
    userId = req.session.playerId;
  }

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Player authentication required'
    });
  }
  try {
    const { messageId } = req.params;
    
    const message = await DatabaseService.markMessageAsRead(messageId);
    
    if (!message) {
      return APIResponse.notFound(res, 'Message not found');
    }

    return APIResponse.success(res, {
      messageId: messageId,
      isRead: true,
      readAt: message.readAt
    }, 'Message marked as read');

  } catch (error) {
    console.error('Mark message as read API error:', error);
    return APIResponse.error(res, 'Failed to mark message as read', 500);
  }
});

// Get Notifications (Missing /api/notifications endpoint)
router.get('/notifications', checkApiRateLimit, async (req, res) => {
  // Extract user ID from JWT token if provided
  let userId = null;
  let userType = 'player';
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = JWTUtil.extractTokenFromHeader(authHeader);
      if (token) {
        const decoded = JWTUtil.verifyToken(token);
        userId = decoded.id;
        userType = decoded.type || 'player';
      }
    } catch (error) {
      // If JWT fails, check session
      if (req.session?.isPlayerAuthenticated) {
        userId = req.session.playerId;
        userType = 'player';
      } else if (req.session?.isAuthenticated) {
        userId = req.session.adminId;
        userType = 'admin';
      }
    }
  } else if (req.session?.isPlayerAuthenticated) {
    userId = req.session.playerId;
    userType = 'player';
  } else if (req.session?.isAuthenticated) {
    userId = req.session.adminId;
    userType = 'admin';
  }

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await DatabaseService.getNotificationsForUser(userId, userType, page, limit);
    
    // Format notifications for mobile app
    const notifications = result.notifications.map(notification => ({
      id: notification._id,
      notificationId: notification.notificationId,
      title: notification.title,
      content: notification.content,
      type: notification.type,
      priority: notification.priority,
      isRead: notification.readBy.some(r => r.userId === userId),
      createdAt: notification.createdAt,
      expiresAt: notification.expiresAt,
      metadata: notification.metadata
    }));

    return APIResponse.success(res, {
      notifications: notifications,
      pagination: {
        page: result.page,
        pages: result.pages,
        total: result.total,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    }, 'Notifications retrieved successfully');

  } catch (error) {
    console.error('Get notifications API error:', error);
    return APIResponse.error(res, 'Failed to retrieve notifications', 500);
  }
});

// Mark Notification as Read
router.post('/notifications/:notificationId/read', checkApiRateLimit, async (req, res) => {
  // Extract user ID from JWT token if provided
  let userId = null;
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = JWTUtil.extractTokenFromHeader(authHeader);
      if (token) {
        const decoded = JWTUtil.verifyToken(token);
        userId = decoded.id;
      }
    } catch (error) {
      // If JWT fails, check session
      if (req.session?.isPlayerAuthenticated) {
        userId = req.session.playerId;
      } else if (req.session?.isAuthenticated) {
        userId = req.session.adminId;
      }
    }
  } else if (req.session?.isPlayerAuthenticated) {
    userId = req.session.playerId;
  } else if (req.session?.isAuthenticated) {
    userId = req.session.adminId;
  }

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  try {
    const { notificationId } = req.params;
    
    const notification = await DatabaseService.markNotificationAsRead(notificationId, userId);
    
    if (!notification) {
      return APIResponse.notFound(res, 'Notification not found');
    }

    return APIResponse.success(res, {
      notificationId: notificationId,
      isRead: true
    }, 'Notification marked as read');

  } catch (error) {
    console.error('Mark notification as read API error:', error);
    return APIResponse.error(res, 'Failed to mark notification as read', 500);
  }
});

// Get Tournament Updates (Missing /api/tournament-updates endpoint)
router.get('/tournament-updates', checkApiRateLimit, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const tournamentId = req.query.tournamentId;
    
    const result = await DatabaseService.getTournamentUpdates(tournamentId, page, limit);
    
    // Format tournament updates for mobile app
    const updates = result.updates.map(update => ({
      id: update._id,
      updateId: update.updateId,
      tournamentId: update.tournamentId,
      tournamentName: update.tournamentId?.name,
      title: update.title,
      content: update.content,
      type: update.type,
      priority: update.priority,
      publishedAt: update.publishedAt,
      publishedBy: update.publishedByName,
      metadata: update.metadata
    }));

    return APIResponse.success(res, {
      updates: updates,
      pagination: {
        page: result.page,
        pages: result.pages,
        total: result.total,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    }, 'Tournament updates retrieved successfully');

  } catch (error) {
    console.error('Get tournament updates API error:', error);
    return APIResponse.error(res, 'Failed to retrieve tournament updates', 500);
  }
});

// Get Announcements (Missing /api/announcements endpoint)
router.get('/announcements', checkApiRateLimit, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const targetAudience = req.query.audience || 'players';
    
    const result = await DatabaseService.getAnnouncements(targetAudience, page, limit);
    const pinnedAnnouncements = await DatabaseService.getPinnedAnnouncements(targetAudience);
    
    // Format announcements for mobile app
    const announcements = result.announcements.map(announcement => ({
      id: announcement._id,
      announcementId: announcement.announcementId,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      isPinned: announcement.isPinned,
      publishedAt: announcement.publishedAt,
      publishedBy: announcement.publishedByName,
      expiresAt: announcement.expiresAt,
      attachments: announcement.attachments,
      metadata: announcement.metadata
    }));

    const pinned = pinnedAnnouncements.map(announcement => ({
      id: announcement._id,
      announcementId: announcement.announcementId,
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
      priority: announcement.priority,
      isPinned: true,
      publishedAt: announcement.publishedAt,
      publishedBy: announcement.publishedByName,
      expiresAt: announcement.expiresAt,
      metadata: announcement.metadata
    }));

    return APIResponse.success(res, {
      announcements: announcements,
      pinnedAnnouncements: pinned,
      pagination: {
        page: result.page,
        pages: result.pages,
        total: result.total,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    }, 'Announcements retrieved successfully');

  } catch (error) {
    console.error('Get announcements API error:', error);
    return APIResponse.error(res, 'Failed to retrieve announcements', 500);
  }
});

// =============================================================================
// NEW UNREGISTERED PLAYER API ENDPOINTS
// =============================================================================

// Generate MPA ID from name
function generateMPAId(name) {
  // Clean name: remove spaces, convert to uppercase, take first 6 characters
  const cleanName = name.replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 6);
  
  // Generate random 4-digit number
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  
  // Combine: MPA + clean name + random number
  return `MPA${cleanName}${randomNum}`;
}

// Middleware to validate API key
const validateApiKey = async (req, res, next) => {
  // API key validation disabled - admin interface removed
  console.warn('⚠️ API key validation is disabled - allowing request through');
  next();
};

// Create new unregistered player API endpoint
router.post('/unregistered-player', validateApiKey, [
  body('name').isLength({ min: 2 }).trim().escape().withMessage('Name must be at least 2 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return APIResponse.validationError(res, errors.array());
    }

    const { name } = req.body;

    // Generate unique MPA ID
    let mpaId;
    let attempts = 0;
    const maxAttempts = 5;
    
    do {
      mpaId = generateMPAId(name);
      attempts++;
      
      // Check if MPA ID already exists in players
      const existingPlayer = await Player.findOne({ playerId: mpaId });
      if (!existingPlayer) break;
      
    } while (attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
      return APIResponse.error(res, 'Unable to generate unique MPA ID', 500);
    }

    // Save to database
    const unregisteredPlayer = new UnregisteredPlayer({
      mpaId: mpaId,
      fullName: name,
      apiKeyUsed: req.apiKeyData.keyId // Store key ID for tracking
    });

    await unregisteredPlayer.save();
    
    // Log the registration for tracking
    console.log(`📋 New unregistered player saved: ${name} -> MPA ID: ${mpaId} -> DB ID: ${unregisteredPlayer._id}`);

    return APIResponse.success(res, {
      name: name,
      mpaId: mpaId,
      registrationDate: unregisteredPlayer.registrationDate.toISOString(),
      status: 'unregistered',
      dbId: unregisteredPlayer._id,
      expiresAt: unregisteredPlayer.expiresAt.toISOString(),
      message: 'MPA ID generated and saved successfully. Player can now register using this ID.'
    }, 'New unregistered player processed and saved successfully');

  } catch (error) {
    console.error('Unregistered player API error:', error);
    return APIResponse.error(res, 'Failed to process unregistered player', 500);
  }
});

// Generate new API key endpoint (admin only)
router.post('/admin/generate-api-key', adminAuth, [
  body('description').isLength({ min: 1 }).trim().withMessage('API key description required'),
  body('permissions').optional().isArray().withMessage('Permissions must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return APIResponse.validationError(res, errors.array());
    }

    const { description, permissions = [] } = req.body;
    
    // Validate permissions
    const validPermissions = ['unregistered-player', 'player-details', 'players-list'];
    const invalidPermissions = permissions.filter(p => !validPermissions.includes(p));
    if (invalidPermissions.length > 0) {
      return APIResponse.validationError(res, [{ 
        msg: `Invalid permissions: ${invalidPermissions.join(', ')}. Valid permissions are: ${validPermissions.join(', ')}` 
      }]);
    }
    
    if (permissions.length === 0) {
      return APIResponse.validationError(res, [{ msg: 'At least one permission is required' }]);
    }
    
    // Generate new API key
    const apiKey = APIKey.generateAPIKey();
    const keyHash = APIKey.hashAPIKey(apiKey);
    
    // Save API key to database
    const keyRecord = new APIKey({
      keyHash: keyHash,
      description: description,
      permissions: permissions,
      createdBy: req.admin.username
    });
    
    await keyRecord.save();
    
    console.log(`🔑 New API key generated by ${req.admin.username}: ${description} (${keyRecord.keyId})`);
    
    return APIResponse.success(res, {
      apiKey: apiKey,
      keyId: keyRecord.keyId,
      description: description,
      permissions: permissions,
      createdAt: keyRecord.createdAt,
      usage: 'Include this key in the X-API-Key header or as apikey query parameter'
    }, 'API key generated successfully');

  } catch (error) {
    console.error('Generate API key error:', error);
    return APIResponse.error(res, 'Failed to generate API key', 500);
  }
});

// List API keys endpoint (admin only)
router.get('/admin/api-keys', adminAuth, async (req, res) => {
  try {
    const apiKeys = await APIKey.find({ isActive: true })
      .sort({ createdAt: -1 });

    const keys = apiKeys.map(keyRecord => ({
      keyId: keyRecord.keyId,
      description: keyRecord.description,
      permissions: keyRecord.permissions,
      createdBy: keyRecord.createdBy,
      createdAt: keyRecord.createdAt,
      lastUsed: keyRecord.lastUsed,
      usageCount: keyRecord.usageCount,
      isActive: keyRecord.isActive
    }));

    return APIResponse.success(res, {
      apiKeys: keys,
      total: keys.length
    }, 'API keys retrieved successfully');

  } catch (error) {
    console.error('List API keys error:', error);
    return APIResponse.error(res, 'Failed to retrieve API keys', 500);
  }
});

// Revoke API key endpoint (admin only)
router.delete('/admin/api-keys/:keyId', adminAuth, async (req, res) => {
  try {
    const { keyId } = req.params;
    
    // Find the API key by keyId
    const keyRecord = await APIKey.findOne({ keyId: keyId, isActive: true });
    
    if (!keyRecord) {
      return APIResponse.notFound(res, 'API key not found');
    }
    
    // Revoke the API key using the model method
    await keyRecord.revoke(req.admin.username);
    
    console.log(`🗑️ API key revoked by ${req.admin.username}: ${keyId}`);
    
    return APIResponse.success(res, null, 'API key revoked successfully');

  } catch (error) {
    console.error('Revoke API key error:', error);
    return APIResponse.error(res, 'Failed to revoke API key', 500);
  }
});

// Get Unregistered Players List (Admin only)
router.get('/admin/unregistered-players', adminAuth, async (req, res) => {
  try {
    const { status = 'pending', limit = 50, offset = 0 } = req.query;
    
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }
    
    const unregisteredPlayers = await UnregisteredPlayer.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const total = await UnregisteredPlayer.countDocuments(query);
    const stats = await UnregisteredPlayer.getStats();
    
    return APIResponse.success(res, {
      unregisteredPlayers: unregisteredPlayers,
      total: total,
      stats: stats,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (parseInt(offset) + parseInt(limit)) < total
    }, 'Unregistered players retrieved successfully');
    
  } catch (error) {
    console.error('Get unregistered players error:', error);
    return APIResponse.error(res, 'Failed to retrieve unregistered players', 500);
  }
});

// Convert Unregistered Player to Full Player (Admin only)
router.post('/admin/unregistered-players/:id/convert', adminAuth, [
  body('playerData').optional().isObject().withMessage('Player data must be an object')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return APIResponse.validationError(res, errors.array());
    }

    const { id } = req.params;
    const { playerData = {} } = req.body;
    
    const unregisteredPlayer = await UnregisteredPlayer.findById(id);
    if (!unregisteredPlayer) {
      return APIResponse.notFound(res, 'Unregistered player not found');
    }
    
    if (unregisteredPlayer.status !== 'pending') {
      return APIResponse.error(res, 'Player has already been processed', 400);
    }
    
    // Create full player record using the MPA ID
    const fullPlayerData = {
      playerId: unregisteredPlayer.mpaId,
      fullName: unregisteredPlayer.fullName,
      icNumber: playerData.icNumber || `TEMP_${Date.now()}`,
      age: playerData.age || 18,
      email: playerData.email || `${unregisteredPlayer.mpaId.toLowerCase()}@temp.com`,
      phoneNumber: playerData.phoneNumber || '012-3456789',
      address: playerData.address || 'Address not provided',
      username: unregisteredPlayer.mpaId.toLowerCase(),
      password: 'temp_password_123',
      ...playerData
    };
    
    const player = new Player(fullPlayerData);
    await player.save();
    
    // Mark unregistered player as converted
    await unregisteredPlayer.markAsConverted(player.playerId);
    
    console.log(`✅ Converted unregistered player ${unregisteredPlayer.mpaId} to full player ${player.playerId}`);
    
    return APIResponse.success(res, {
      convertedPlayer: {
        playerId: player.playerId,
        fullName: player.fullName,
        email: player.email,
        status: player.status
      },
      originalRecord: unregisteredPlayer
    }, 'Unregistered player converted successfully');
    
  } catch (error) {
    console.error('Convert unregistered player error:', error);
    
    if (error.code === 11000) {
      return APIResponse.error(res, 'Player with this MPA ID or details already exists', 409);
    }
    
    return APIResponse.error(res, 'Failed to convert unregistered player', 500);
  }
});

// =============================================================================
// PLAYER DETAILS API ENDPOINTS
// =============================================================================

// Get Player Details by Player ID
router.get('/player-details/:playerId', validateApiKey, async (req, res) => {
  try {
    const { playerId } = req.params;

    // Check if API key has player-details permission
    if (!req.apiKeyData.permissions.includes('player-details')) {
      return APIResponse.forbidden(res, 'API key does not have player-details permission');
    }

    // Find player by playerId
    const player = await Player.findOne({ playerId });
    
    if (!player) {
      return APIResponse.notFound(res, 'Player not found');
    }

    // Return player details (excluding sensitive data)
    const playerDetails = {
      playerId: player.playerId,
      fullName: player.fullName,
      dateOfBirth: player.dateOfBirth,
      age: player.age,
      state: player.state,
      division: player.division,
      email: player.email,
      phoneNumber: player.phoneNumber,
      address: player.address,
      status: player.status,
      joinDate: player.joinDate,
      profilePicture: player.profilePicture,
      ranking: player.ranking,
      tournaments: player.tournaments?.length || 0
    };

    return APIResponse.success(res, {
      player: playerDetails
    }, 'Player details retrieved successfully');

  } catch (error) {
    console.error('Get player details API error:', error);
    return APIResponse.error(res, 'Failed to retrieve player details', 500);
  }
});

// Create/Update Player Details
router.post('/player-details', validateApiKey, [
  body('playerId').optional().isLength({ min: 3 }).withMessage('Player ID must be at least 3 characters'),
  body('fullName').isLength({ min: 2 }).trim().withMessage('Full name must be at least 2 characters'),
  body('dateOfBirth').optional().isISO8601().withMessage('Date of birth must be a valid date (YYYY-MM-DD)'),
  body('age').optional().isInt({ min: 12, max: 100 }).withMessage('Age must be between 12 and 100'),
  body('state').optional().isIn([
    'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Malacca', 
    'Negeri Sembilan', 'Pahang', 'Penang', 'Perak', 'Perlis', 'Putrajaya', 
    'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
  ]).withMessage('Invalid state'),
  body('division').optional().isIn([
    'Youth (Under 16)', 'Junior (16-18)', 'Open (19-39)', 'Senior (40-49)', 
    'Masters (50-59)', 'Grand Masters (60+)', 'Professional'
  ]).withMessage('Invalid division'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phoneNumber').optional().isMobilePhone('ms-MY').withMessage('Invalid Malaysian phone number'),
  body('address').optional().isLength({ min: 10 }).withMessage('Address must be at least 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return APIResponse.validationError(res, errors.array());
    }

    // Check if API key has player-details permission
    if (!req.apiKeyData.permissions.includes('player-details')) {
      return APIResponse.forbidden(res, 'API key does not have player-details permission');
    }

    const { 
      playerId, fullName, dateOfBirth, age, state, division, 
      email, phoneNumber, address 
    } = req.body;

    let player;
    let isNewPlayer = false;

    if (playerId) {
      // Update existing player
      player = await Player.findOne({ playerId });
      if (!player) {
        return APIResponse.notFound(res, 'Player not found');
      }
    } else {
      // Create new player - generate playerId from name
      if (!fullName) {
        return APIResponse.validationError(res, [{ msg: 'Full name is required for new player' }]);
      }
      
      // Generate unique MPA ID for new player
      let newPlayerId;
      let attempts = 0;
      const maxAttempts = 5;
      
      do {
        newPlayerId = generateMPAId(fullName);
        attempts++;
        
        const existingPlayer = await Player.findOne({ playerId: newPlayerId });
        if (!existingPlayer) break;
        
      } while (attempts < maxAttempts);
      
      if (attempts >= maxAttempts) {
        return APIResponse.error(res, 'Unable to generate unique MPA ID', 500);
      }

      player = new Player({
        playerId: newPlayerId,
        fullName: fullName,
        icNumber: `TEMP_${Date.now()}`, // Temporary IC for API-created players
        age: age || 18,
        email: email || `${newPlayerId.toLowerCase()}@temp.com`,
        phoneNumber: phoneNumber || '012-3456789',
        address: address || 'Address not provided',
        username: newPlayerId.toLowerCase(),
        password: 'temp_password_123' // Will be hashed by pre-save middleware
      });
      isNewPlayer = true;
    }

    // Update player fields
    if (fullName) player.fullName = fullName;
    if (dateOfBirth) player.dateOfBirth = new Date(dateOfBirth);
    if (age) player.age = age;
    if (state) player.state = state;
    if (division) player.division = division;
    if (email) player.email = email;
    if (phoneNumber) player.phoneNumber = phoneNumber;
    if (address) player.address = address;

    // Save player
    await player.save();

    // Log the action
    console.log(`📝 Player details ${isNewPlayer ? 'created' : 'updated'}: ${player.playerId} (${player.fullName})`);

    return APIResponse.success(res, {
      player: {
        playerId: player.playerId,
        fullName: player.fullName,
        dateOfBirth: player.dateOfBirth,
        age: player.age,
        state: player.state,
        division: player.division,
        email: player.email,
        phoneNumber: player.phoneNumber,
        address: player.address,
        status: player.status,
        joinDate: player.joinDate
      },
      action: isNewPlayer ? 'created' : 'updated'
    }, `Player details ${isNewPlayer ? 'created' : 'updated'} successfully`);

  } catch (error) {
    console.error('Player details API error:', error);
    
    if (error.code === 11000) {
      return APIResponse.error(res, 'Player with this email or IC number already exists', 409);
    }
    
    return APIResponse.error(res, 'Failed to save player details', 500);
  }
});

// Update Player Details by Player ID
router.put('/player-details/:playerId', validateApiKey, [
  body('fullName').optional().isLength({ min: 2 }).trim().withMessage('Full name must be at least 2 characters'),
  body('dateOfBirth').optional().isISO8601().withMessage('Date of birth must be a valid date (YYYY-MM-DD)'),
  body('age').optional().isInt({ min: 12, max: 100 }).withMessage('Age must be between 12 and 100'),
  body('state').optional().isIn([
    'Johor', 'Kedah', 'Kelantan', 'Kuala Lumpur', 'Labuan', 'Malacca', 
    'Negeri Sembilan', 'Pahang', 'Penang', 'Perak', 'Perlis', 'Putrajaya', 
    'Sabah', 'Sarawak', 'Selangor', 'Terengganu'
  ]).withMessage('Invalid state'),
  body('division').optional().isIn([
    'Youth (Under 16)', 'Junior (16-18)', 'Open (19-39)', 'Senior (40-49)', 
    'Masters (50-59)', 'Grand Masters (60+)', 'Professional'
  ]).withMessage('Invalid division'),
  body('email').optional().isEmail().withMessage('Invalid email format'),
  body('phoneNumber').optional().isMobilePhone('ms-MY').withMessage('Invalid Malaysian phone number'),
  body('address').optional().isLength({ min: 10 }).withMessage('Address must be at least 10 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return APIResponse.validationError(res, errors.array());
    }

    // Check if API key has player-details permission
    if (!req.apiKeyData.permissions.includes('player-details')) {
      return APIResponse.forbidden(res, 'API key does not have player-details permission');
    }

    const { playerId } = req.params;
    const updateData = req.body;

    // Find and update player
    const player = await Player.findOne({ playerId });
    if (!player) {
      return APIResponse.notFound(res, 'Player not found');
    }

    // Update only provided fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (key === 'dateOfBirth') {
          player[key] = new Date(updateData[key]);
        } else {
          player[key] = updateData[key];
        }
      }
    });

    await player.save();

    console.log(`📝 Player details updated: ${player.playerId} (${player.fullName})`);

    return APIResponse.success(res, {
      player: {
        playerId: player.playerId,
        fullName: player.fullName,
        dateOfBirth: player.dateOfBirth,
        age: player.age,
        state: player.state,
        division: player.division,
        email: player.email,
        phoneNumber: player.phoneNumber,
        address: player.address,
        status: player.status
      }
    }, 'Player details updated successfully');

  } catch (error) {
    console.error('Update player details API error:', error);
    
    if (error.code === 11000) {
      return APIResponse.error(res, 'Email already exists for another player', 409);
    }
    
    return APIResponse.error(res, 'Failed to update player details', 500);
  }
});

// Search Players by State or Division
router.get('/players/search', validateApiKey, [
  // Optional query parameters
], async (req, res) => {
  try {
    // Check if API key has player-details permission
    if (!req.apiKeyData.permissions.includes('player-details')) {
      return APIResponse.forbidden(res, 'API key does not have player-details permission');
    }

    const { state, division, limit = 50, offset = 0 } = req.query;
    
    // Build search query
    let query = { status: 'active' };
    if (state) query.state = state;
    if (division) query.division = division;

    // Execute search
    const players = await Player.find(query)
      .select('playerId fullName dateOfBirth age state division email phoneNumber status joinDate')
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .sort({ fullName: 1 });

    const total = await Player.countDocuments(query);

    return APIResponse.success(res, {
      players: players,
      total: total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      hasMore: (parseInt(offset) + parseInt(limit)) < total
    }, 'Players retrieved successfully');

  } catch (error) {
    console.error('Search players API error:', error);
    return APIResponse.error(res, 'Failed to search players', 500);
  }
});

// =============================================================================
// MOBILE-SPECIFIC ENDPOINTS
// =============================================================================

// Mobile Player Messages (Missing /api/mobile/player/messages endpoint)
router.get('/mobile/player/messages', checkApiRateLimit, async (req, res) => {
  // Extract user ID from JWT token if provided
  let userId = null;
  let userType = 'player';
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = JWTUtil.extractTokenFromHeader(authHeader);
      if (token) {
        const decoded = JWTUtil.verifyToken(token);
        userId = decoded.id;
        userType = decoded.type || 'player';
      }
    } catch (error) {
      // If JWT fails, check session
      if (req.session?.isPlayerAuthenticated) {
        userId = req.session.playerId;
        userType = 'player';
      }
    }
  } else if (req.session?.isPlayerAuthenticated) {
    userId = req.session.playerId;
    userType = 'player';
  }

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: 'Player authentication required'
    });
  }

  try {
    // Ensure this is a player
    if (userType !== 'player') {
      return APIResponse.forbidden(res, 'Player access required');
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    const result = await DatabaseService.getPlayerMessages(userId, page, limit);
    const unreadCount = await DatabaseService.getUnreadMessageCount(userId);
    
    // Format messages for mobile app (matching expected format)
    const messages = result.messages.map(message => ({
      id: message._id,
      messageId: message.messageId,
      title: message.subject,
      content: message.content,
      type: message.type,
      priority: message.priority,
      read: message.isRead,
      createdAt: message.createdAt,
      senderName: message.senderName,
      metadata: message.metadata
    }));

    return APIResponse.success(res, {
      messages: messages,
      unreadCount: unreadCount,
      pagination: {
        page: result.page,
        pages: result.pages,
        total: result.total,
        hasNext: result.hasNext,
        hasPrev: result.hasPrev
      }
    }, 'Player messages retrieved successfully');

  } catch (error) {
    console.error('Get mobile player messages API error:', error);
    return APIResponse.error(res, 'Failed to retrieve player messages', 500);
  }
});

// Check API Health
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

// =============================================================================
// PLAYERS LIST API ENDPOINT
// =============================================================================

// Get All Approved Players List
router.get('/players-list', validateApiKey, async (req, res) => {
  try {
    // API key permission check disabled - admin interface removed

    const { limit = 100, offset = 0, state, division } = req.query;
    
    // Build query for approved players only
    let query = { 
      status: 'approved' // Only get approved players
    };
    
    // Add optional filters
    if (state) {
      query.state = state;
    }
    if (division) {
      query.division = division;
    }
    
    // Get players with pagination
    const players = await Player.find(query)
      .select('playerId fullName email phoneNumber state division dateOfBirth age address joinDate status')
      .sort({ joinDate: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));
    
    const totalCount = await Player.countDocuments(query);
    
    return APIResponse.success(res, {
      players: players,
      pagination: {
        total: totalCount,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + players.length) < totalCount
      },
      filters: {
        state: state || null,
        division: division || null
      }
    }, 'Approved players retrieved successfully');
    
  } catch (error) {
    console.error('Error retrieving approved players list:', error);
    return APIResponse.error(res, 'Failed to retrieve approved players list', 500);
  }
});

module.exports = router; 