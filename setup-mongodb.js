const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up MongoDB integration for Malaysia Pickleball...\n');

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
      if (stderr) {
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

async function setup() {
  try {
    // Step 1: Install MongoDB dependencies
    console.log('Step 1: Installing MongoDB dependencies...');
    await runCommand('npm install mongodb mongoose bcryptjs dotenv', 'Installing packages');

    // Step 2: Create .env file if it doesn't exist
    console.log('Step 2: Setting up environment configuration...');
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
      const envContent = `# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/malaysia-pickleball

# Session Configuration
SESSION_SECRET=your-super-secret-session-key-change-this-in-production

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
      console.log('✅ Created .env file with default configuration\n');
    } else {
      console.log('✅ .env file already exists\n');
    }

    // Step 3: Create uploads directory
    console.log('Step 3: Creating uploads directory...');
    const uploadsDir = path.join(__dirname, 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('✅ Created uploads directory\n');
    } else {
      console.log('✅ Uploads directory already exists\n');
    }

    // Step 4: Instructions for MongoDB setup
    console.log('🎉 Setup completed successfully!\n');
    console.log('📋 Next Steps:');
    console.log('1. Install MongoDB Community Server from: https://www.mongodb.com/try/download/community');
    console.log('2. Install MongoDB Compass from: https://www.mongodb.com/try/download/compass');
    console.log('3. Start MongoDB service on your system');
    console.log('4. Run the fresh database setup: node scripts/setup-fresh-database.js');
    console.log('5. Start your application: node server-new.js');
    console.log('\n🔧 Configuration:');
    console.log('- Database: mongodb://localhost:27017/malaysia-pickleball');
    console.log('- Default admin: username=admin, password=admin123');
    console.log('- Change the admin password after first login!');
    console.log('\n📊 MongoDB Compass Connection:');
    console.log('- Connection String: mongodb://localhost:27017');
    console.log('- Database Name: malaysia-pickleball');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setup(); 