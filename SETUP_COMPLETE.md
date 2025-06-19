# 🚀 Malaysia Pickleball - Complete Setup Guide

## ✅ What Has Been Implemented

### 🔐 Security Enhancements
- **JWT Authentication**: Added JWT token support for mobile apps alongside session-based auth
- **Enhanced CORS**: Configured proper CORS with environment-based origin control
- **Security Headers**: Restored proper Helmet configuration with CSP
- **Rate Limiting**: Implemented sophisticated rate limiting for different endpoint types
- **Password Security**: Fixed hardcoded secrets and improved password handling
- **File Upload Security**: Added comprehensive file validation and secure upload handling

### 📱 Mobile API Support (PickleZone Ready)
- **Hybrid Authentication**: Support for both JWT (mobile) and session (web) authentication
- **Mobile-Optimized Routes**: Dedicated `/api/mobile/*` endpoints with lightweight responses
- **Standardized API Responses**: Consistent JSON structure across all endpoints
- **Profile Picture API**: Enhanced with mobile-specific features
- **Tournament APIs**: Mobile-optimized tournament listing and registration
- **Ranking APIs**: Lightweight ranking data for mobile consumption
- **Messaging APIs**: Mobile-friendly messaging system

### 🛠️ Technical Improvements
- **Environment Configuration**: Comprehensive `.env` setup with all necessary variables
- **Error Handling**: Centralized error handling with proper HTTP status codes
- **Logging**: Request logging with Morgan for debugging and monitoring
- **File Management**: Organized upload directories and file handling
- **Code Organization**: Modular utilities for JWT, API responses, and rate limiting

## 📁 New File Structure

```
malaysia-pickleball/
├── utils/
│   ├── jwt.js              # JWT token management
│   └── apiResponse.js      # Standardized API responses
├── middleware/
│   └── rateLimiter.js      # Rate limiting configurations
├── routes/
│   ├── api.js              # Enhanced API routes (existing, improved)
│   └── mobile.js           # Mobile-specific API routes (NEW)
├── public/uploads/
│   ├── profiles/           # Profile picture uploads
│   └── temp/              # Temporary file storage
└── .env                   # Enhanced environment variables
```

## 🔧 Environment Variables Added

```env
# JWT Configuration for Mobile API
JWT_SECRET=jwt_super_secret_key_change_in_production_2024_picklezone_malaysia
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# API Configuration
API_VERSION=v1
API_RATE_LIMIT_WINDOW=900000
API_RATE_LIMIT_MAX=100
AUTH_RATE_LIMIT_MAX=5

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,https://picklezone-app.com

# File Upload Configuration  
ALLOWED_FILE_TYPES=image/jpeg,image/jpg,image/png,image/gif,image/webp
UPLOAD_PATH=./public/uploads

# Mobile App Configuration
MOBILE_APP_NAME=PickleZone
MOBILE_APP_VERSION=1.0.0
```

## 📱 Mobile API Endpoints (For PickleZone)

### Authentication
```
POST /api/auth/player/login     # Login with JWT response
POST /api/auth/admin/login      # Admin login with JWT
POST /api/auth/refresh          # Refresh JWT tokens
POST /api/auth/logout           # Logout (clears session)
```

### Mobile-Specific
```
GET  /api/mobile/app/info       # App configuration & features
GET  /api/mobile/health         # Health check
GET  /api/mobile/player/me      # Lightweight player data
PUT  /api/mobile/player/me      # Update player profile
```

### Tournaments
```
GET  /api/mobile/tournaments    # Mobile-optimized tournament list
POST /api/mobile/tournaments/:id/register  # Tournament registration
```

### Rankings & Messaging
```
GET  /api/mobile/rankings       # Mobile-optimized rankings
GET  /api/mobile/player/ranking # Player's ranking
GET  /api/mobile/messages       # Mobile-optimized messages
PUT  /api/mobile/messages/:id/read  # Mark as read
```

### Profile Pictures
```
POST /api/player/profile/picture  # Upload profile picture
GET  /api/player/profile/picture  # Get profile picture
DELETE /api/player/profile/picture # Delete profile picture
```

## 🔐 Authentication Methods

### For Web Application (Existing)
```javascript
// Session-based authentication
// Automatically handled by existing login forms
```

### For Mobile Application (NEW)
```javascript
// JWT-based authentication
const response = await fetch('/api/auth/player/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password })
});

const { tokens } = response.data;
// Use tokens.accessToken for subsequent requests
```

## 📊 API Response Format

### Standardized Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z",
  "statusCode": 200
}
```

### Mobile-Optimized Response
```json
{
  "success": true,
  "message": "Success",
  "data": { ... },
  "ts": 1705312200000,
  "v": "1.0"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_TYPE",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "statusCode": 400
}
```

## 🚀 Getting Started

### 1. Start the Server
```bash
npm start  # Uses server-new.js (recommended)
# or
npm run dev  # Development mode with nodemon
```

### 2. Test the APIs

#### Web Authentication (Session-based)
- Login via existing web forms
- APIs will use session authentication automatically

#### Mobile Authentication (JWT-based)
```bash
# Login and get JWT tokens
curl -X POST http://localhost:3000/api/auth/player/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# Use JWT token for subsequent requests  
curl -X GET http://localhost:3000/api/mobile/player/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Mobile App Configuration
```javascript
// PickleZone mobile app configuration
const API_BASE_URL = 'https://your-server.com/api';

// Get app info
const appInfo = await fetch(`${API_BASE_URL}/mobile/app/info`);
```

## 🔧 Security Features

### Rate Limiting
- **Authentication**: 5 attempts per 15 minutes
- **General API**: 100 requests per 15 minutes  
- **File Uploads**: 10 uploads per 15 minutes
- **Mobile API**: 200 requests per 15 minutes (more lenient)

### File Upload Security
- **Allowed Types**: JPEG, PNG, GIF, WebP
- **Size Limit**: 5MB maximum
- **Validation**: MIME type and file size checking
- **Safe Storage**: Organized upload directories

### CORS Protection
- **Environment-based**: Origins controlled via `.env`
- **Development**: Localhost allowed
- **Production**: Strict origin checking

## ⚠️ Important Notes

### For Production Deployment
1. **Change JWT Secrets**: Update `JWT_SECRET` and `SESSION_SECRET`
2. **Set NODE_ENV**: Set to `production` 
3. **Configure CORS**: Add your production domains to `ALLOWED_ORIGINS`
4. **HTTPS**: Enable secure cookies in production
5. **Database**: Ensure MongoDB connection is secure

### For PickleZone Development
1. **API Base URL**: Update in your mobile app config
2. **Authentication Flow**: Use JWT tokens for API calls
3. **File Uploads**: Use multipart/form-data for profile pictures
4. **Error Handling**: Check `success` field in all responses

## 🎯 Next Steps

1. **Test all endpoints** with Postman or similar tool
2. **Update your mobile app** to use the new JWT authentication
3. **Configure production environment** variables
4. **Set up monitoring** for API usage and errors
5. **Implement push notifications** (optional)

## 📞 Support

If you encounter any issues:
1. Check the server logs for error details
2. Verify environment variables are set correctly
3. Ensure MongoDB is running and accessible
4. Test with the provided curl examples

---

✅ **Your Malaysia Pickleball system is now ready for both web and mobile applications!** 