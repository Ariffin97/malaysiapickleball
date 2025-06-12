require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔍 Environment Configuration Checker\n');

// Check .env file
const envPath = path.join(process.cwd(), '.env');
console.log('📁 File Check:');
console.log('='.repeat(40));

if (fs.existsSync(envPath)) {
  console.log('✅ .env file exists');
  
  // Read and display .env contents (safely)
  const envContent = fs.readFileSync(envPath, 'utf8');
  const lines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  console.log('📋 Environment Variables in .env:');
  lines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      // Hide sensitive values
      if (key.includes('PASSWORD') || key.includes('SECRET') || key.includes('URI')) {
        console.log(`   ${key}=****`);
      } else {
        console.log(`   ${key}=${value}`);
      }
    }
  });
} else {
  console.log('❌ .env file not found');
  console.log('💡 Run: node quick-start.js to create one');
}

console.log('\n🌍 Current Environment Variables:');
console.log('='.repeat(40));

// Check important environment variables
const importantVars = [
  'MONGODB_URI',
  'SESSION_SECRET', 
  'NODE_ENV',
  'PORT',
  'BCRYPT_ROUNDS',
  'MAX_LOGIN_ATTEMPTS'
];

importantVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName.includes('URI') || varName.includes('SECRET')) {
      console.log(`✅ ${varName}=****`);
    } else {
      console.log(`✅ ${varName}=${value}`);
    }
  } else {
    console.log(`❌ ${varName}=NOT SET`);
  }
});

// Determine database type
console.log('\n🗄️  Database Configuration:');
console.log('='.repeat(40));

const mongoURI = process.env.MONGODB_URI;
if (mongoURI) {
  if (mongoURI.includes('mongodb+srv://')) {
    console.log('🌐 Database Type: MongoDB Atlas (Cloud)');
    console.log('✅ Ready for Heroku deployment');
  } else if (mongoURI.includes('localhost') || mongoURI.includes('127.0.0.1')) {
    console.log('💻 Database Type: Local MongoDB');
    console.log('⚠️  Need Atlas for Heroku deployment');
  } else {
    console.log('🔧 Database Type: Custom MongoDB Server');
  }
} else {
  console.log('❌ No MONGODB_URI configured');
  console.log('💡 Set up database connection first');
}

// Check project files
console.log('\n📁 Project Files Check:');
console.log('='.repeat(40));

const importantFiles = [
  'server-new.js',
  'config/database.js',
  'models/Tournament.js',
  'models/Player.js',
  'scripts/setup-fresh-database.js',
  'package.json',
  'Procfile'
];

importantFiles.forEach(file => {
  if (fs.existsSync(path.join(process.cwd(), file))) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
  }
});

// Summary
console.log('\n📊 Summary:');
console.log('='.repeat(40));

if (mongoURI && mongoURI.includes('mongodb+srv://')) {
  console.log('🎉 READY FOR PRODUCTION!');
  console.log('✅ MongoDB Atlas configured');
  console.log('✅ Environment variables set');
  console.log('🚀 You can deploy to Heroku');
} else if (mongoURI && mongoURI.includes('localhost')) {
  console.log('💻 LOCAL DEVELOPMENT READY');
  console.log('✅ Local MongoDB configured');
  console.log('⚠️  Need Atlas for production');
  console.log('🔧 Run: node scripts/setup-heroku-mongodb.js');
} else {
  console.log('🔧 SETUP NEEDED');
  console.log('❌ Database not configured');
  console.log('💡 Run: node quick-start.js');
}

console.log('\n🔧 Quick Commands:');
console.log('• Test connection: node scripts/test-mongodb-connection.js');
console.log('• Setup local: node quick-start.js');
console.log('• Setup Atlas: node scripts/setup-heroku-mongodb.js');
console.log('• Start app: node server-new.js'); 