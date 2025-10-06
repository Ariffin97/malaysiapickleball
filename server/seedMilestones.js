import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Milestone Schema (same as in index.js)
const milestoneSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  image: {
    type: String,
    default: null
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Milestone = mongoose.model('Milestone', milestoneSchema);

// Default milestones
const DEFAULT_MILESTONES = [
  {
    date: new Date('2020-01-01'),
    title: 'Foundation',
    description: 'Malaysia Pickleball Association officially established',
    image: null,
    order: 1
  },
  {
    date: new Date('2021-03-15'),
    title: 'First Tournament',
    description: 'Hosted the inaugural National Pickleball Championship',
    image: null,
    order: 2
  },
  {
    date: new Date('2022-06-20'),
    title: 'International Recognition',
    description: 'Joined the Asian Pickleball Federation',
    image: null,
    order: 3
  },
  {
    date: new Date('2023-09-10'),
    title: 'Growth & Expansion',
    description: 'Reached 400,000+ active players across Malaysia',
    image: null,
    order: 4
  },
  {
    date: new Date('2024-01-15'),
    title: 'Future Goals',
    description: 'Aiming to host Southeast Asian Championship',
    image: null,
    order: 5
  }
];

async function seedMilestones() {
  try {
    // Connect to MongoDB
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/malaysia-pickleball';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if milestones already exist
    const existingCount = await Milestone.countDocuments();

    if (existingCount > 0) {
      console.log(`⚠️  Database already has ${existingCount} milestones. Skipping seed.`);
      console.log('   If you want to reseed, delete existing milestones first.');
    } else {
      // Insert default milestones
      await Milestone.insertMany(DEFAULT_MILESTONES);
      console.log('✅ Successfully seeded 5 default milestones');
    }

    // Disconnect
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding milestones:', error);
    process.exit(1);
  }
}

seedMilestones();
