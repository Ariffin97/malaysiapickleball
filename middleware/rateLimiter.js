const rateLimit = require('express-rate-limit');
const APIResponse = require('../utils/apiResponse');

// General API rate limiter
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message,
      statusCode: 429,
      errorCode: 'RATE_LIMIT_EXCEEDED'
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      APIResponse.rateLimitExceeded(res, message, Math.ceil(windowMs / 1000));
    }
  });
};

// Strict rate limiter for authentication endpoints
const authRateLimiter = createRateLimiter(
  parseInt(process.env.API_RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
  parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5, // 5 attempts
  'Too many authentication attempts. Please try again later.'
);

// General API rate limiter
const apiRateLimiter = createRateLimiter(
  parseInt(process.env.API_RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes  
  parseInt(process.env.API_RATE_LIMIT_MAX) || 100, // 100 requests
  'Too many API requests. Please try again later.'
);

// File upload rate limiter
const uploadRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // 10 uploads
  'Too many file uploads. Please try again later.'
);

// Mobile API rate limiter (more lenient)
const mobileRateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  200, // 200 requests for mobile
  'Too many mobile API requests. Please try again later.'
);

module.exports = {
  authRateLimiter,
  apiRateLimiter,
  uploadRateLimiter,
  mobileRateLimiter,
  createRateLimiter
}; 