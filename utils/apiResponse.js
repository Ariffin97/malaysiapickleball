/**
 * Standardized API Response Utility
 * Ensures consistent response format across all API endpoints
 */

class APIResponse {
  // Success response
  static success(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      statusCode
    });
  }

  // Error response
  static error(res, message = 'Internal Server Error', statusCode = 500, errorCode = null, details = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      statusCode
    };

    if (errorCode) {
      response.errorCode = errorCode;
    }

    if (details && process.env.NODE_ENV === 'development') {
      response.details = details;
    }

    return res.status(statusCode).json(response);
  }

  // Validation error response
  static validationError(res, errors, message = 'Validation failed') {
    return res.status(400).json({
      success: false,
      message,
      errors: errors,
      timestamp: new Date().toISOString(),
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR'
    });
  }

  // Unauthorized response
  static unauthorized(res, message = 'Unauthorized access', errorCode = 'UNAUTHORIZED') {
    return res.status(401).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
      statusCode: 401,
      errorCode
    });
  }

  // Forbidden response
  static forbidden(res, message = 'Access forbidden', errorCode = 'FORBIDDEN') {
    return res.status(403).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
      statusCode: 403,
      errorCode
    });
  }

  // Not found response
  static notFound(res, message = 'Resource not found', errorCode = 'NOT_FOUND') {
    return res.status(404).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
      statusCode: 404,
      errorCode
    });
  }

  // Rate limit exceeded response
  static rateLimitExceeded(res, message = 'Rate limit exceeded', retryAfter = null) {
    const response = {
      success: false,
      message,
      timestamp: new Date().toISOString(),
      statusCode: 429,
      errorCode: 'RATE_LIMIT_EXCEEDED'
    };

    if (retryAfter) {
      response.retryAfter = retryAfter;
    }

    return res.status(429).json(response);
  }

  // Conflict response
  static conflict(res, message = 'Resource conflict', errorCode = 'CONFLICT') {
    return res.status(409).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
      statusCode: 409,
      errorCode
    });
  }

  // Created response
  static created(res, data, message = 'Resource created successfully') {
    return res.status(201).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString(),
      statusCode: 201
    });
  }

  // No content response
  static noContent(res, message = 'No content') {
    return res.status(204).json({
      success: true,
      message,
      timestamp: new Date().toISOString(),
      statusCode: 204
    });
  }

  // Paginated response
  static paginated(res, data, pagination, message = 'Success') {
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        currentPage: pagination.currentPage || 1,
        totalPages: pagination.totalPages || 1,
        totalItems: pagination.totalItems || 0,
        itemsPerPage: pagination.itemsPerPage || 10,
        hasNext: pagination.hasNext || false,
        hasPrev: pagination.hasPrev || false
      },
      timestamp: new Date().toISOString(),
      statusCode: 200
    });
  }

  // Mobile optimized response (lighter payload)
  static mobile(res, data, message = 'Success', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      ts: Date.now(),
      v: process.env.API_VERSION || '1.0'
    });
  }

  // Health check response
  static health(res, status = 'healthy', checks = {}) {
    const statusCode = status === 'healthy' ? 200 : 503;
    
    return res.status(statusCode).json({
      status,
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION || '1.0',
      environment: process.env.NODE_ENV || 'development',
      checks
    });
  }
}

module.exports = APIResponse; 