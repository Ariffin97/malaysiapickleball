const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Malaysia Pickleball - Quick Start Setup\n');

// Function to run shell commands
function runCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`📦 ${description}...`);
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr && !stderr.includes('npm WARN')) {
        console.warn(`⚠️  Warning: ${stderr}`);
      }
      if (stdout) {
        console.log(stdout);
      }
      console.log(`✅ ${description} completed\n`);
      resolve();
    });
  });
}

// Function to check if MongoDB is running
function checkMongoDB() {
  return new Promise((resolve) => {
    exec('mongod --version', (error) => {
      if (error) {
        console.log('❌ MongoDB not found or not running');
        console.log('📋 Please install MongoDB first:');
        console.log('   1. Download from: https://www.mongodb.com/try/download/community');
        console.log('   2. Install MongoDB Community Server');
        console.log('   3. Start MongoDB service');
        console.log('   4. Run this script again\n');
        resolve(false);
      } else {
        console.log('✅ MongoDB is available\n');
        resolve(true);
      }
    });
  });
}

async function quickStart() {
  try {
    console.log('Step 1: Checking MongoDB availability...');
    const mongoAvailable = await checkMongoDB();
    
    if (!mongoAvailable) {
      console.log('🛑 Setup stopped. Please install MongoDB first.');
      return;
    }

    // Step 2: Install dependencies
    console.log('Step 2: Installing dependencies...');
    await runCommand('npm install', 'Installing npm packages');

    // Step 3: Create .env file if it doesn't exist
    console.log('Step 3: Setting up environment configuration...');
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
      const envContent = `# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/malaysia-pickleball

# Session Configuration
SESSION_SECRET=malaysia-pickleball-secret-key-change-in-production

# Application Configuration
NODE_ENV=development
PORT=3000

# Security Configuration
BCRYPT_ROUNDS=10
MAX_LOGIN_ATTEMPTS=5
LOCK_TIME=900000

# File Upload Configuration
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
`;
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Created .env file with configuration\n');
    } else {
      console.log('✅ .env file already exists\n');
    }

    // Step 4: Create uploads directory
    console.log('Step 4: Creating uploads directory...');
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory\n');
    } else {
      console.log('✅ Uploads directory already exists\n');
    }

    // Step 5: Setup fresh database
    console.log('Step 5: Setting up fresh database...');
    await runCommand('node scripts/setup-fresh-database.js', 'Setting up MongoDB database');

    // Success message
    console.log('🎉 Quick Start Setup Completed Successfully!\n');
    console.log('🚀 Your Malaysia Pickleball website is ready!');
    console.log('\n📋 What was set up:');
    console.log('   ✅ MongoDB database with all collections');
    console.log('   ✅ Default admin account (admin/admin123)');
    console.log('   ✅ Application settings and configuration');
    console.log('   ✅ Database indexes for optimal performance');
    console.log('   ✅ Environment configuration');
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Start your application:');
    console.log('   node server-new.js');
    console.log('\n2. Open your browser and visit:');
    console.log('   🌐 Website: http://localhost:3000');
    console.log('   🔧 Admin Panel: http://localhost:3000/admin/dashboard');
    console.log('\n3. Login with default credentials:');
    console.log('   👤 Username: admin');
    console.log('   🔑 Password: admin123');
    console.log('   ⚠️  Change this password after first login!');
    
    console.log('\n📊 MongoDB Compass:');
    console.log('   🔗 Connection: mongodb://localhost:27017');
    console.log('   🗄️  Database: malaysia-pickleball');
    
    console.log('\n🎯 You can now:');
    console.log('   • Add tournaments through the admin panel');
    console.log('   • Manage player registrations');
    console.log('   • View all data in MongoDB Compass');
    console.log('   • Customize settings and appearance');

  } catch (error) {
    console.error('❌ Quick start failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure MongoDB is installed and running');
    console.log('2. Check if port 27017 is available');
    console.log('3. Verify all files are present in the project');
    console.log('4. Try running individual steps manually');
  }
}

quickStart(); 