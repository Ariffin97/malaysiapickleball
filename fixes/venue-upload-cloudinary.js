// FIXED: Venue Image Upload with Cloudinary
const cloudinary = require('cloudinary').v2;

// Helper function to upload image to Cloudinary
async function uploadImageToCloudinary(imageBuffer, options = {}) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'venues',
        transformation: [
          { width: 1200, height: 800, crop: 'limit' },
          { quality: 'auto:good' },
          { format: 'auto' }
        ],
        tags: options.tags || ['venue'],
        ...options
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    ).end(imageBuffer);
  });
}

// FIXED: Add venue with Cloudinary images
app.post('/admin/venues', adminAuth, async (req, res) => {
  try {
    const { name, address, bookingUrl, totalCourts, owner, phone, mapsUrl, description, tournamentLevels } = req.body;

    // Handle multiple image uploads to CLOUDINARY
    const imageUrls = [];
    if (req.files && req.files.imageFiles) {
      const files = Array.isArray(req.files.imageFiles) ? req.files.imageFiles : [req.files.imageFiles];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const publicId = `venue_${Date.now()}_${i}`;
        
        try {
          const cloudinaryResult = await uploadImageToCloudinary(file.data, {
            public_id: publicId,
            folder: 'venues',
            tags: ['venue', `venue_${name.replace(/\s+/g, '_').toLowerCase()}`]
          });
          
          // Store the FULL Cloudinary URL
          imageUrls.push(cloudinaryResult.secure_url);
        } catch (uploadError) {
          console.error('Failed to upload image to Cloudinary:', uploadError);
          // Continue with other images, don't fail the entire request
        }
      }
    }

    const levels = (tournamentLevels || '')
      .split(',')
      .map(level => level.trim())
      .filter(level => level.length > 0);

    const venue = {
      name,
      address,
      bookingUrl,
      totalCourts: parseInt(totalCourts) || 1,
      owner,
      phone,
      mapsUrl,
      description,
      images: imageUrls, // These are now full Cloudinary URLs
      tournamentLevels: levels,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await DatabaseService.addVenue(venue);

    res.json({
      success: true,
      message: 'Venue added successfully',
      venue: result
    });

  } catch (error) {
    console.error('Error adding venue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add venue'
    });
  }
});