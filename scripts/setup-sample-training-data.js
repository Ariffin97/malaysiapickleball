const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected for sample data setup');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const createSampleTrainingData = async () => {
  try {
    const Course = require('../models/Course');
    const Clinic = require('../models/Clinic');
    const Admin = require('../models/Admin');

    // Get or create an admin user for createdBy field
    let admin = await Admin.findOne();
    if (!admin) {
      admin = new Admin({
        username: 'admin',
        password: 'hashedpassword', // This should be properly hashed
        role: 'admin',
        permissions: ['manage_courses', 'manage_clinics']
      });
      await admin.save();
    }

    // Clear existing data
    await Course.deleteMany({});
    await Clinic.deleteMany({});

    console.log('📚 Creating sample courses...');

    // Create sample courses
    const sampleCourses = [
      {
        title: 'Beginner Pickleball Course',
        description: 'Learn the fundamentals of pickleball in this comprehensive 4-week course.',
        startDate: new Date('2025-08-25'),
        endDate: new Date('2025-09-15'),
        schedule: [
          {
            date: new Date('2025-08-25'),
            startTime: '09:00',
            endTime: '11:00',
            duration: 120
          },
          {
            date: new Date('2025-09-01'),
            startTime: '09:00',
            endTime: '11:00',
            duration: 120
          },
          {
            date: new Date('2025-09-08'),
            startTime: '09:00',
            endTime: '11:00',
            duration: 120
          },
          {
            date: new Date('2025-09-15'),
            startTime: '09:00',
            endTime: '11:00',
            duration: 120
          }
        ],
        level: 'beginner',
        levelRange: '2.0 - 2.5',
        maxParticipants: 8,
        currentParticipants: 3,
        instructor: {
          name: 'Sarah Johnson',
          email: 'sarah@example.com',
          phone: '+60123456789',
          bio: 'Certified pickleball instructor with 5 years of experience.'
        },
        venue: {
          name: 'Kuala Lumpur Sports Center',
          address: 'Jalan Ampang, 50450 Kuala Lumpur',
          court: 'Court 1'
        },
        price: {
          amount: 200,
          currency: 'MYR'
        },
        registrationDeadline: new Date('2025-08-20'),
        status: 'open',
        prerequisites: ['Basic fitness level', 'Comfortable sports attire'],
        materials: ['Paddle provided', 'Bring water bottle'],
        tags: ['beginner', 'fundamentals', 'technique'],
        createdBy: admin._id
      },
      {
        title: 'Advanced Strategy Course',
        description: 'Master advanced strategies and techniques for competitive play.',
        startDate: new Date('2025-09-02'),
        endDate: new Date('2025-09-23'),
        schedule: [
          {
            date: new Date('2025-09-02'),
            startTime: '18:00',
            endTime: '20:00',
            duration: 120
          },
          {
            date: new Date('2025-09-09'),
            startTime: '18:00',
            endTime: '20:00',
            duration: 120
          },
          {
            date: new Date('2025-09-16'),
            startTime: '18:00',
            endTime: '20:00',
            duration: 120
          },
          {
            date: new Date('2025-09-23'),
            startTime: '18:00',
            endTime: '20:00',
            duration: 120
          }
        ],
        level: 'advanced',
        levelRange: '4.0 - 4.5',
        maxParticipants: 6,
        currentParticipants: 2,
        instructor: {
          name: 'Michael Chen',
          email: 'michael@example.com',
          phone: '+60123456788',
          bio: 'Former professional pickleball player and tournament coach.'
        },
        venue: {
          name: 'Elite Sports Complex',
          address: 'Jalan Tun Razak, 50400 Kuala Lumpur',
          court: 'Court A'
        },
        price: {
          amount: 350,
          currency: 'MYR'
        },
        registrationDeadline: new Date('2025-08-28'),
        status: 'open',
        prerequisites: ['Intermediate level skills', 'Tournament experience preferred'],
        materials: ['Bring own paddle', 'Video analysis included'],
        tags: ['advanced', 'strategy', 'competitive'],
        createdBy: admin._id
      }
    ];

    for (const courseData of sampleCourses) {
      const course = new Course(courseData);
      await course.save();
      console.log(`✅ Created course: ${course.title}`);
    }

    console.log('🏃 Creating sample clinics...');

    // Create sample clinics
    const sampleClinics = [
      {
        title: 'Serve & Return Mastery',
        description: 'Perfect your serve and return techniques in this intensive clinic.',
        type: 'serve-return',
        date: new Date('2025-08-27'),
        startTime: '14:00',
        endTime: '16:00',
        duration: 120,
        level: 'intermediate',
        levelRange: '3.0 - 4.0',
        maxParticipants: 12,
        currentParticipants: 7,
        instructor: {
          name: 'Lisa Wong',
          email: 'lisa@example.com',
          phone: '+60123456787',
          bio: 'Professional pickleball coach specializing in serve techniques.',
          credentials: ['USAPA Certified', 'PPR Certified']
        },
        venue: {
          name: 'Petaling Jaya Sports Hub',
          address: 'Jalan SS2/24, 47300 Petaling Jaya',
          court: 'Court 3'
        },
        price: {
          amount: 80,
          currency: 'MYR'
        },
        registrationDeadline: new Date('2025-08-25'),
        status: 'open',
        focusAreas: ['Power serves', 'Placement serves', 'Return positioning', 'Return strategies'],
        equipment: ['Paddles provided', 'Bring own water'],
        dropInAllowed: true,
        intensity: 'medium',
        tags: ['serve', 'return', 'technique'],
        createdBy: admin._id
      },
      {
        title: 'Net Play Excellence',
        description: 'Dominate at the net with advanced volleying and dinking techniques.',
        type: 'net-play',
        date: new Date('2025-08-30'),
        startTime: '10:00',
        endTime: '12:00',
        duration: 120,
        level: 'all',
        levelRange: 'All levels welcome',
        maxParticipants: 10,
        currentParticipants: 4,
        instructor: {
          name: 'David Kumar',
          email: 'david@example.com',
          phone: '+60123456786',
          bio: 'Former tennis pro turned pickleball specialist.',
          credentials: ['PPR Level 3', 'Tennis Pro Certification']
        },
        venue: {
          name: 'Shah Alam Recreation Center',
          address: 'Seksyen 7, 40000 Shah Alam',
          court: 'Indoor Court 2'
        },
        price: {
          amount: 75,
          currency: 'MYR'
        },
        registrationDeadline: new Date('2025-08-28'),
        status: 'open',
        focusAreas: ['Dinking strategy', 'Volley techniques', 'Kitchen positioning', 'Soft game'],
        equipment: ['All equipment provided', 'Comfortable court shoes required'],
        dropInAllowed: true,
        intensity: 'medium',
        tags: ['net-play', 'volleys', 'dinking'],
        createdBy: admin._id
      },
      {
        title: 'Doubles Strategy Workshop',
        description: 'Learn advanced doubles strategies and communication techniques.',
        type: 'doubles-tactics',
        date: new Date('2025-09-05'),
        startTime: '16:00',
        endTime: '18:00',
        duration: 120,
        level: 'intermediate',
        levelRange: '3.5 - 4.5',
        maxParticipants: 8,
        currentParticipants: 6,
        instructor: {
          name: 'Amanda Lim',
          email: 'amanda@example.com',
          phone: '+60123456785',
          bio: 'Tournament doubles specialist with multiple championship wins.',
          credentials: ['USAPA Level 4', 'Tournament Director Certified']
        },
        venue: {
          name: 'Subang Sports Complex',
          address: 'Jalan Kemajuan, 47500 Subang Jaya',
          court: 'Court 1'
        },
        price: {
          amount: 90,
          currency: 'MYR'
        },
        registrationDeadline: new Date('2025-09-03'),
        status: 'open',
        focusAreas: ['Partner communication', 'Court positioning', 'Shot selection', 'Strategy execution'],
        equipment: ['Bring own paddle', 'Practice balls provided'],
        dropInAllowed: false,
        intensity: 'high',
        tags: ['doubles', 'strategy', 'communication'],
        createdBy: admin._id
      },
      {
        title: 'Weekend Fitness Clinic',
        description: 'Improve your fitness and conditioning specifically for pickleball.',
        type: 'fitness',
        date: new Date('2025-09-10'),
        startTime: '08:00',
        endTime: '10:00',
        duration: 120,
        level: 'all',
        levelRange: 'All fitness levels',
        maxParticipants: 15,
        currentParticipants: 8,
        instructor: {
          name: 'Rachel Tan',
          email: 'rachel@example.com',
          phone: '+60123456784',
          bio: 'Certified fitness trainer specializing in racquet sports conditioning.',
          credentials: ['ACSM Certified', 'Sports Conditioning Specialist']
        },
        venue: {
          name: 'Mont Kiara Sports Center',
          address: 'Jalan Kiara, 50480 Kuala Lumpur',
          court: 'Fitness Studio'
        },
        price: {
          amount: 60,
          currency: 'MYR'
        },
        registrationDeadline: new Date('2025-09-08'),
        status: 'open',
        focusAreas: ['Agility training', 'Core strength', 'Injury prevention', 'Sport-specific exercises'],
        equipment: ['All fitness equipment provided', 'Bring workout attire'],
        dropInAllowed: true,
        intensity: 'medium',
        tags: ['fitness', 'conditioning', 'strength'],
        createdBy: admin._id
      }
    ];

    for (const clinicData of sampleClinics) {
      const clinic = new Clinic(clinicData);
      await clinic.save();
      console.log(`✅ Created clinic: ${clinic.title}`);
    }

    console.log('🎉 Sample training data created successfully!');
    console.log('\nSummary:');
    console.log(`📚 Courses created: ${sampleCourses.length}`);
    console.log(`🏃 Clinics created: ${sampleClinics.length}`);
    
  } catch (error) {
    console.error('❌ Error creating sample training data:', error);
  }
};

const main = async () => {
  await connectDB();
  await createSampleTrainingData();
  process.exit(0);
};

main();