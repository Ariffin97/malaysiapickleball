import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage configuration for profile pictures
export const profileStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'malaysia-pickleball/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  }
});

// Storage configuration for news media
export const newsStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'malaysia-pickleball/news',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'mp4', 'mov'],
    resource_type: 'auto'
  }
});

// Storage configuration for journey milestones
export const journeyStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'malaysia-pickleball/journey',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp']
  }
});

export default cloudinary;
