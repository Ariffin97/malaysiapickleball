const cloudinary = require('cloudinary').v2;

class CloudinaryHelper {
  /**
   * Upload image to Cloudinary from buffer
   * @param {Buffer} imageBuffer - The image buffer
   * @param {Object} options - Upload options
   * @returns {Promise<Object>} Cloudinary result
   */
  static async uploadImage(imageBuffer, options = {}) {
    const defaultOptions = {
      folder: 'general',
      transformation: [
        { quality: 'auto:good' },
        { format: 'auto' }
      ],
      tags: ['uploaded_image']
    };

    const uploadOptions = { ...defaultOptions, ...options };

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(imageBuffer);
    });
  }

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - The public ID of the image
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteImage(publicId) {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      console.log('Cloudinary delete result:', result);
      return result;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      throw error;
    }
  }

  /**
   * Upload profile picture with standard transformations
   * @param {Buffer} imageBuffer - The image buffer
   * @param {string} userId - User ID for unique naming
   * @returns {Promise<Object>} Cloudinary result
   */
  static async uploadProfilePicture(imageBuffer, userId) {
    const publicId = `profile_${userId}_${Date.now()}`;
    
    return this.uploadImage(imageBuffer, {
      public_id: publicId,
      folder: 'player_profiles',
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto:good' },
        { format: 'auto' }
      ],
      tags: ['profile_picture', `user_${userId}`]
    });
  }

  /**
   * Upload venue image with standard transformations
   * @param {Buffer} imageBuffer - The image buffer
   * @param {string} venueName - Venue name for tagging
   * @returns {Promise<Object>} Cloudinary result
   */
  static async uploadVenueImage(imageBuffer, venueName = 'unknown') {
    const publicId = `venue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return this.uploadImage(imageBuffer, {
      public_id: publicId,
      folder: 'venues',
      transformation: [
        { width: 1200, height: 800, crop: 'limit' },
        { quality: 'auto:good' },
        { format: 'auto' }
      ],
      tags: ['venue', `venue_${venueName.replace(/\s+/g, '_').toLowerCase()}`]
    });
  }

  /**
   * Upload milestone image with standard transformations
   * @param {Buffer} imageBuffer - The image buffer
   * @param {string} category - Milestone category
   * @returns {Promise<Object>} Cloudinary result
   */
  static async uploadMilestoneImage(imageBuffer, category = 'general') {
    const publicId = `milestone_${Date.now()}`;
    
    return this.uploadImage(imageBuffer, {
      public_id: publicId,
      folder: 'milestones',
      transformation: [
        { width: 800, height: 600, crop: 'limit' },
        { quality: 'auto:good' },
        { format: 'auto' }
      ],
      tags: ['milestone', category]
    });
  }

  /**
   * Get optimized image URL with transformations
   * @param {string} publicId - The public ID of the image
   * @param {Object} transformations - Transformation options
   * @returns {string} Optimized image URL
   */
  static getOptimizedUrl(publicId, transformations = {}) {
    const defaultTransformations = {
      quality: 'auto:good',
      format: 'auto'
    };

    const finalTransformations = { ...defaultTransformations, ...transformations };
    
    return cloudinary.url(publicId, finalTransformations);
  }

  /**
   * Validate file type and size
   * @param {Object} file - The uploaded file
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  static validateFile(file, options = {}) {
    const defaultOptions = {
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      maxSize: 10 * 1024 * 1024, // 10MB
      minSize: 1024 // 1KB
    };

    const validationOptions = { ...defaultOptions, ...options };
    const errors = [];

    // Check if file exists
    if (!file || !file.data) {
      errors.push('No file provided');
      return { valid: false, errors };
    }

    // Check file type
    if (!validationOptions.allowedTypes.includes(file.mimetype)) {
      errors.push(`Invalid file type. Allowed types: ${validationOptions.allowedTypes.join(', ')}`);
    }

    // Check file size
    if (file.size > validationOptions.maxSize) {
      errors.push(`File too large. Maximum size: ${Math.round(validationOptions.maxSize / 1024 / 1024)}MB`);
    }

    if (file.size < validationOptions.minSize) {
      errors.push(`File too small. Minimum size: ${validationOptions.minSize} bytes`);
    }

    return {
      valid: errors.length === 0,
      errors,
      file: {
        name: file.name,
        size: file.size,
        type: file.mimetype
      }
    };
  }
}

module.exports = CloudinaryHelper;