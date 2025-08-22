#!/usr/bin/env node

/**
 * Migration Script: Convert Local Image Paths to Cloudinary URLs
 * 
 * This script will:
 * 1. Find all records with local image paths (starting with /uploads/)
 * 2. Upload those images to Cloudinary (if they exist locally)
 * 3. Update the database records with Cloudinary URLs
 * 4. Clean up local files (optional)
 */

const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Import database models
const { connectDB } = require('../config/database');
const DatabaseService = require('../services/databaseService');
const Player = require('../models/Player');

class ImageMigration {
  constructor() {
    this.migratedCount = 0;
    this.errorCount = 0;
    this.skippedCount = 0;
  }

  /**
   * Upload local file to Cloudinary
   */
  async uploadToCloudinary(localPath, options = {}) {
    const fullPath = path.join(__dirname, '..', 'public', localPath);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️  File not found: ${fullPath}`);
      return null;
    }

    try {
      console.log(`📤 Uploading: ${localPath}`);
      
      const result = await cloudinary.uploader.upload(fullPath, {
        folder: options.folder || 'migrated',
        transformation: options.transformation || [
          { quality: 'auto:good' },
          { format: 'auto' }
        ],
        tags: ['migrated', ...(options.tags || [])],
        public_id: options.public_id
      });

      console.log(`✅ Uploaded successfully: ${result.secure_url}`);
      return result;

    } catch (error) {
      console.error(`❌ Upload failed for ${localPath}:`, error.message);
      return null;
    }
  }

  /**
   * Migrate player profile pictures
   */
  async migratePlayerProfiles() {
    console.log('\n🔄 Migrating player profile pictures...\n');
    
    try {
      // Find all players with local profile pictures
      const players = await Player.find({
        profilePicture: { $regex: '^/uploads/' }
      });

      console.log(`Found ${players.length} players with local profile pictures`);

      for (const player of players) {
        console.log(`\n👤 Processing player: ${player.fullName || player.username} (${player._id})`);
        
        const localPath = player.profilePicture;
        const publicId = `profile_${player._id}_migrated`;
        
        const cloudinaryResult = await this.uploadToCloudinary(localPath, {
          folder: 'player_profiles',
          public_id: publicId,
          transformation: [
            { width: 400, height: 400, crop: 'fill', gravity: 'face' },
            { quality: 'auto:good' },
            { format: 'auto' }
          ],
          tags: ['profile_picture', 'migrated', `user_${player._id}`]
        });

        if (cloudinaryResult) {
          // Update player record with Cloudinary URL
          await Player.findByIdAndUpdate(player._id, {
            profilePicture: cloudinaryResult.secure_url,
            profilePictureCloudinaryId: cloudinaryResult.public_id
          });
          
          console.log(`✅ Updated player ${player.fullName || player.username}`);
          this.migratedCount++;
        } else {
          console.log(`❌ Failed to migrate ${player.fullName || player.username}`);
          this.errorCount++;
        }
      }

    } catch (error) {
      console.error('Error migrating player profiles:', error);
    }
  }

  /**
   * Migrate venue images
   */
  async migrateVenueImages() {
    console.log('\n🔄 Migrating venue images...\n');
    
    try {
      const venues = await DatabaseService.getAllVenues();
      
      for (const venue of venues) {
        if (!venue.images || venue.images.length === 0) continue;
        
        console.log(`\n🏢 Processing venue: ${venue.name}`);
        
        const newImageUrls = [];
        let hasLocalImages = false;
        
        for (let i = 0; i < venue.images.length; i++) {
          const imagePath = venue.images[i];
          
          // Skip if already a Cloudinary URL
          if (imagePath.startsWith('http')) {
            newImageUrls.push(imagePath);
            continue;
          }
          
          hasLocalImages = true;
          const publicId = `venue_${venue._id}_${i}_migrated`;
          
          const cloudinaryResult = await this.uploadToCloudinary(imagePath, {
            folder: 'venues',
            public_id: publicId,
            transformation: [
              { width: 1200, height: 800, crop: 'limit' },
              { quality: 'auto:good' },
              { format: 'auto' }
            ],
            tags: ['venue', 'migrated', venue.name.replace(/\s+/g, '_').toLowerCase()]
          });

          if (cloudinaryResult) {
            newImageUrls.push(cloudinaryResult.secure_url);
          } else {
            // Keep original if upload failed
            newImageUrls.push(imagePath);
          }
        }

        if (hasLocalImages) {
          // Update venue with new image URLs
          await DatabaseService.updateVenue(venue._id, {
            images: newImageUrls
          });
          
          console.log(`✅ Updated venue ${venue.name}`);
          this.migratedCount++;
        }
      }

    } catch (error) {
      console.error('Error migrating venue images:', error);
    }
  }

  /**
   * Migrate milestone images
   */
  async migrateMilestoneImages() {
    console.log('\n🔄 Migrating milestone images...\n');
    
    try {
      const milestones = await DatabaseService.getAllMilestones();
      
      for (const milestone of milestones) {
        if (!milestone.image || milestone.image.startsWith('http')) continue;
        
        console.log(`\n📅 Processing milestone: ${milestone.title}`);
        
        const publicId = `milestone_${milestone._id}_migrated`;
        
        const cloudinaryResult = await this.uploadToCloudinary(milestone.image, {
          folder: 'milestones',
          public_id: publicId,
          transformation: [
            { width: 800, height: 600, crop: 'limit' },
            { quality: 'auto:good' },
            { format: 'auto' }
          ],
          tags: ['milestone', 'migrated', milestone.category || 'general']
        });

        if (cloudinaryResult) {
          // Update milestone with Cloudinary URL
          await DatabaseService.updateMilestone(milestone._id, {
            image: cloudinaryResult.secure_url,
            imageCloudinaryId: cloudinaryResult.public_id
          });
          
          console.log(`✅ Updated milestone ${milestone.title}`);
          this.migratedCount++;
        } else {
          this.errorCount++;
        }
      }

    } catch (error) {
      console.error('Error migrating milestone images:', error);
    }
  }

  /**
   * Run the complete migration
   */
  async runMigration() {
    console.log('🚀 Starting image migration to Cloudinary...\n');
    
    try {
      await connectDB();
      
      await this.migratePlayerProfiles();
      await this.migrateVenueImages();
      await this.migrateMilestoneImages();
      
      console.log('\n📊 Migration Summary:');
      console.log(`✅ Successfully migrated: ${this.migratedCount} items`);
      console.log(`❌ Failed migrations: ${this.errorCount} items`);
      console.log(`⏭️  Skipped (already migrated): ${this.skippedCount} items`);
      
      console.log('\n🎉 Migration completed!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    } finally {
      process.exit(0);
    }
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  const migration = new ImageMigration();
  migration.runMigration();
}

module.exports = ImageMigration;