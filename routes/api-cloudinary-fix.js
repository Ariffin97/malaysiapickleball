// FIXED: Profile Picture Upload with Cloudinary
const cloudinary = require('cloudinary').v2;

// Upload/Update Player Profile Picture (CLOUDINARY VERSION)
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
        msg: 'Invalid file type. Please upload an image file (JPEG, PNG, GIF, WebP)' 
      }]);
    }

    // Check file size
    const maxSize = parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024; // 10MB default
    if (profilePicture.size > maxSize) {
      return APIResponse.validationError(res, [{ 
        msg: `File size too large. Maximum ${Math.round(maxSize / 1024 / 1024)}MB allowed` 
      }]);
    }

    // Generate unique public_id for Cloudinary
    const userId = req.user.id;
    const timestamp = Date.now();
    const publicId = `profiles/profile_${userId}_${timestamp}`;

    // Upload to Cloudinary using buffer (no temp files)
    const cloudinaryResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          public_id: publicId,
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
      profilePicture: profilePictureUrl,  // Store the full Cloudinary URL
      profilePictureCloudinaryId: cloudinaryResult.public_id // Store for potential deletion
    });

    return APIResponse.success(res, {
      profilePicture: profilePictureUrl,
      cloudinaryId: cloudinaryResult.public_id,
      size: profilePicture.size,
      type: profilePicture.mimetype,
      dimensions: {
        width: cloudinaryResult.width,
        height: cloudinaryResult.height
      }
    }, 'Profile picture updated successfully');

  } catch (error) {
    console.error('Profile picture upload API error:', error);
    return APIResponse.error(res, 'Failed to upload profile picture', 500);
  }
});