// FIXED: Milestone Image Upload with Cloudinary
const cloudinary = require('cloudinary').v2;

// Add milestone with Cloudinary image upload
app.post('/admin/milestones', adminAuth, async (req, res) => {
  try {
    const { title, description, date, category, tags, status } = req.body;

    if (!title || !description || !date) {
      return res.status(400).json({
        success: false, 
        message: 'Title, description, and date are required' 
      });
    }

    // Handle image upload to CLOUDINARY
    let cloudinaryUrl = null;
    let cloudinaryId = null;
    
    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      const publicId = `milestone_${Date.now()}`;
      
      try {
        const cloudinaryResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              public_id: publicId,
              folder: 'milestones',
              transformation: [
                { width: 800, height: 600, crop: 'limit' },
                { quality: 'auto:good' },
                { format: 'auto' }
              ],
              tags: ['milestone', category || 'general']
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(imageFile.data);
        });

        cloudinaryUrl = cloudinaryResult.secure_url;
        cloudinaryId = cloudinaryResult.public_id;
        
      } catch (uploadError) {
        console.error('Failed to upload milestone image to Cloudinary:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image'
        });
      }
    }

    const milestoneData = {
      title: title.trim(),
      description: description.trim(),
      date: new Date(date),
      category: category || 'general',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      status: status || 'published',
      image: cloudinaryUrl, // Store the full Cloudinary URL
      imageCloudinaryId: cloudinaryId, // Store for potential deletion
      imageAlt: title,
      createdBy: req.session.username,
      createdAt: new Date(),
      updatedBy: req.session.username,
      updatedAt: new Date()
    };

    const milestone = await DatabaseService.addMilestone(milestoneData);

    res.json({ 
      success: true, 
      message: 'Milestone added successfully', 
      milestone 
    });

  } catch (error) {
    console.error('Error adding milestone:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to add milestone' 
    });
  }
});

// Update milestone with Cloudinary image upload
app.put('/admin/milestones/:id', adminAuth, async (req, res) => {
  try {
    const { title, description, date, category, tags, status } = req.body;
    const updateData = {};

    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (date) updateData.date = new Date(date);
    if (category) updateData.category = category;
    if (tags) updateData.tags = tags.split(',').map(tag => tag.trim());
    if (status) updateData.status = status;

    // Handle image upload to CLOUDINARY
    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      const publicId = `milestone_${Date.now()}`;
      
      try {
        // Get existing milestone to potentially delete old image
        const existingMilestone = await DatabaseService.getMilestone(req.params.id);
        
        // Upload new image
        const cloudinaryResult = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            {
              public_id: publicId,
              folder: 'milestones',
              transformation: [
                { width: 800, height: 600, crop: 'limit' },
                { quality: 'auto:good' },
                { format: 'auto' }
              ],
              tags: ['milestone', category || 'general']
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(imageFile.data);
        });

        updateData.image = cloudinaryResult.secure_url;
        updateData.imageCloudinaryId = cloudinaryResult.public_id;
        updateData.imageAlt = title || existingMilestone.title || 'Milestone image';

        // Delete old image from Cloudinary if exists
        if (existingMilestone.imageCloudinaryId) {
          try {
            await cloudinary.uploader.destroy(existingMilestone.imageCloudinaryId);
          } catch (deleteError) {
            console.warn('Failed to delete old Cloudinary image:', deleteError);
          }
        }

      } catch (uploadError) {
        console.error('Failed to upload milestone image to Cloudinary:', uploadError);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload image'
        });
      }
    }

    const milestone = await DatabaseService.updateMilestone(
      req.params.id, 
      updateData, 
      req.session.username
    );

    if (!milestone) {
      return res.status(404).json({ 
        success: false, 
        message: 'Milestone not found' 
      });
    }

    res.json({ 
      success: true, 
      message: 'Milestone updated successfully', 
      milestone 
    });

  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update milestone' 
    });
  }
});