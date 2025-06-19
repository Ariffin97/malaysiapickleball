const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const DatabaseService = require('../services/databaseService');
const Player = require('../models/Player');
const Admin = require('../models/Admin');
const PlayerRegistration = require('../models/PlayerRegistration');

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
    
    // Only accept dashed format: 970727-13-6097 (frontend auto-formats to this)
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

    const filePath = path.join(profilesDir, fileName);

    // Move file to upload directory
    await profilePicture.mv(filePath);

    // Update player profile picture in database
    const profilePictureUrl = `/uploads/profiles/${fileName}`;
    await Player.findByIdAndUpdate(userId, {
      profilePicture: profilePictureUrl
    });

    return APIResponse.success(res, {
      profilePicture: profilePictureUrl,
      fileName: fileName,
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

// Check API Health
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 