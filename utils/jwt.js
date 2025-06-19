const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

class JWTUtil {
  // Generate access token
  static generateAccessToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'malaysia-pickleball-api',
      audience: 'picklezone-mobile'
    });
  }

  // Generate refresh token
  static generateRefreshToken(payload) {
    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_REFRESH_EXPIRES_IN,
      issuer: 'malaysia-pickleball-api',
      audience: 'picklezone-mobile'
    });
  }

  // Generate both tokens
  static generateTokens(payload) {
    const accessToken = this.generateAccessToken(payload);
    const refreshToken = this.generateRefreshToken(payload);
    
    return {
      accessToken,
      refreshToken,
      expiresIn: JWT_EXPIRES_IN
    };
  }

  // Verify token
  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'malaysia-pickleball-api',
        audience: 'picklezone-mobile'
      });
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Decode token without verification (for expired token info)
  static decodeToken(token) {
    return jwt.decode(token);
  }

  // Check if token is expired
  static isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token);
      if (!decoded || !decoded.exp) return true;
      
      const now = Math.floor(Date.now() / 1000);
      return decoded.exp < now;
    } catch (error) {
      return true;
    }
  }

  // Extract token from Authorization header
  static extractTokenFromHeader(authHeader) {
    if (!authHeader) return null;
    
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return null;
    
    return parts[1];
  }

  // Middleware for JWT authentication
  static authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = JWTUtil.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required',
        code: 'TOKEN_MISSING'
      });
    }

    try {
      const decoded = JWTUtil.verifyToken(token);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token',
        code: 'TOKEN_INVALID'
      });
    }
  }

  // Middleware for optional JWT authentication
  static optionalAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = JWTUtil.extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const decoded = JWTUtil.verifyToken(token);
        req.user = decoded;
      } catch (error) {
        // Continue without authentication for optional auth
      }
    }

    next();
  }
}

module.exports = JWTUtil; 