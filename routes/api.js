const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const DatabaseService = require('../services/databaseService');
const Player = require('../models/Player');
const Admin = require('../models/Admin');
const PlayerRegistration = require('../models/PlayerRegistration');

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

// API Authentication middleware
const apiAuth = async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Authentication token required'
    });
  }
  
  // For session-based auth, check if user is logged in
  if (req.session?.isAuthenticated || req.session?.isPlayerAuthenticated) {
    return next();
  }
  
  return res.status(401).json({
    success: false,
    message: 'Invalid or expired token'
  });
};

// Admin API Authentication
const adminApiAuth = async (req, res, next) => {
  if (!req.session?.isAuthenticated || !req.session?.adminId) {
    return res.status(401).json({
      success: false,
      message: 'Admin authentication required'
    });
  }
  
  try {
    const admin = await DatabaseService.getAdminByUsername(req.session.username);
    if (!admin || !admin.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized admin access'
      });
    }
    
    req.admin = admin;
    next();
  } catch (error) {
    console.error('Admin API auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

// =============================================================================
// AUTHENTICATION APIs
// =============================================================================

// Admin Login API
router.post('/admin/login', checkApiRateLimit, [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('password').isLength({ min: 6 })
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

    const { username, password } = req.body;
    
    // Get admin from database
    const admin = await DatabaseService.getAdminByUsername(username);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Check if account is locked
    if (admin.isLocked && admin.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to multiple failed attempts'
      });
    }

    // Verify password
    const isValidPassword = await admin.comparePassword(password);
    
    if (!isValidPassword) {
      // Increment login attempts
      await admin.incLoginAttempts();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Reset login attempts on successful login
    if (admin.loginAttempts > 0) {
      await admin.resetLoginAttempts();
    }

    // Update last login
    await DatabaseService.updateAdminLastLogin(admin._id);

    // Create session
    req.session.isAuthenticated = true;
    req.session.adminId = admin._id;
    req.session.username = admin.username;
    req.session.role = admin.role;
    req.session.loginTime = Date.now();
    req.session.userAgent = req.get('User-Agent');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        admin: {
          id: admin._id,
          username: admin.username,
          fullName: admin.fullName,
          role: admin.role,
          permissions: admin.permissions
        }
      }
    });

  } catch (error) {
    console.error('Admin login API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Player Login API
router.post('/player/login', checkApiRateLimit, [
  body('username').isLength({ min: 3 }).trim().escape(),
  body('password').isLength({ min: 6 })
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

    const { username, password } = req.body;
    
    // Get player from database
    const player = await DatabaseService.getPlayerByUsername(username);
    
    if (!player) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Check if player account is active
    if (player.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active. Please contact administrator.'
      });
    }

    // Verify password
    const isValidPassword = await player.comparePassword(password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password'
      });
    }

    // Create session
    req.session.isPlayerAuthenticated = true;
    req.session.playerId = player._id;
    req.session.playerUsername = player.username;
    req.session.playerLoginTime = Date.now();

    res.json({
      success: true,
      message: 'Player login successful',
      data: {
        player: {
          id: player._id,
          playerId: player.playerId,
          username: player.username,
          fullName: player.fullName,
          email: player.email,
          status: player.status
        }
      }
    });

  } catch (error) {
    console.error('Player login API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout API (works for both admin and player)
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Logout failed'
      });
    }
    
    res.json({
      success: true,
      message: 'Logout successful'
    });
  });
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
router.get('/admin/registrations/pending', adminApiAuth, async (req, res) => {
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
router.post('/admin/registrations/:id/approve', adminApiAuth, async (req, res) => {
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
router.post('/admin/registrations/:id/reject', adminApiAuth, [
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
router.get('/admin/profile', adminApiAuth, async (req, res) => {
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
router.get('/admin/players', adminApiAuth, async (req, res) => {
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
    
    if (!/^\d{12}$/.test(icNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid IC number format'
      });
    }

    const result = await DatabaseService.checkIcNumberAvailability(icNumber);
    
    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('IC check API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check IC number'
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
// PROFILE PICTURE UPLOAD APIS
// =============================================================================

// Upload/Update Player Profile Picture
router.post('/player/profile/picture', checkApiRateLimit, async (req, res) => {
  if (!req.session?.isPlayerAuthenticated || !req.session?.playerId) {
    return res.status(401).json({
      success: false,
      message: 'Player authentication required'
    });
  }

  try {
    // Check if file was uploaded
    if (!req.files || !req.files.profilePicture) {
      return res.status(400).json({
        success: false,
        message: 'Profile picture file is required'
      });
    }

    const profilePicture = req.files.profilePicture;
    
    // Validate file type
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!allowedMimeTypes.includes(profilePicture.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Only JPEG, PNG, and GIF are allowed'
      });
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (profilePicture.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum 5MB allowed'
      });
    }

    // Generate unique filename
    const fileExtension = profilePicture.name.split('.').pop();
    const fileName = `profile_${req.session.playerId}_${Date.now()}.${fileExtension}`;
    const uploadPath = `public/images/profiles/${fileName}`;

    // Create profiles directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const profilesDir = path.join(__dirname, '..', 'public', 'images', 'profiles');
    
    if (!fs.existsSync(profilesDir)) {
      fs.mkdirSync(profilesDir, { recursive: true });
    }

    // Move file to upload directory
    await profilePicture.mv(path.join(__dirname, '..', uploadPath));

    // Update player profile picture in database
    const profilePictureUrl = `/images/profiles/${fileName}`;
    await Player.findByIdAndUpdate(req.session.playerId, {
      profilePicture: profilePictureUrl
    });

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: {
        profilePicture: profilePictureUrl
      }
    });

  } catch (error) {
    console.error('Profile picture upload API error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture'
    });
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

// Check API Health
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 