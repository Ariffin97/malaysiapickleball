console.log('🌐 Setting up MongoDB Atlas for Heroku Deployment\n');

console.log('📋 Step-by-Step Guide to Deploy with MongoDB Atlas:\n');

console.log('🔧 Step 1: Create MongoDB Atlas Account');
console.log('1. Go to: https://www.mongodb.com/cloud/atlas');
console.log('2. Click "Try Free" and create an account');
console.log('3. Choose "Build a Database" → "M0 Sandbox" (FREE)');
console.log('4. Select a cloud provider and region (closest to your users)');
console.log('5. Create cluster (takes 1-3 minutes)\n');

console.log('🔐 Step 2: Set up Database Access');
console.log('1. Go to "Database Access" in the left sidebar');
console.log('2. Click "Add New Database User"');
console.log('3. Choose "Password" authentication');
console.log('4. Create username and strong password (SAVE THESE!)');
console.log('5. Set privileges to "Read and write to any database"');
console.log('6. Click "Add User"\n');

console.log('🌐 Step 3: Set up Network Access');
console.log('1. Go to "Network Access" in the left sidebar');
console.log('2. Click "Add IP Address"');
console.log('3. Click "Allow Access from Anywhere" (for Heroku)');
console.log('4. Click "Confirm"\n');

console.log('🔗 Step 4: Get Connection String');
console.log('1. Go to "Database" in the left sidebar');
console.log('2. Click "Connect" on your cluster');
console.log('3. Choose "Connect your application"');
console.log('4. Select "Node.js" and version "4.1 or later"');
console.log('5. Copy the connection string');
console.log('6. Replace <password> with your database user password');
console.log('7. Replace <dbname> with "malaysia-pickleball"\n');

console.log('Example connection string:');
console.log('mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/malaysia-pickleball?retryWrites=true&w=majority\n');

console.log('🚀 Step 5: Configure Heroku');
console.log('1. Install Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli');
console.log('2. Login to Heroku: heroku login');
console.log('3. Create Heroku app: heroku create your-app-name');
console.log('4. Set environment variables:\n');

console.log('heroku config:set MONGODB_URI="your-atlas-connection-string"');
console.log('heroku config:set SESSION_SECRET="your-super-secret-session-key"');
console.log('heroku config:set NODE_ENV="production"');
console.log('heroku config:set BCRYPT_ROUNDS="12"');
console.log('heroku config:set MAX_LOGIN_ATTEMPTS="5"');
console.log('heroku config:set LOCK_TIME="900000"\n');

console.log('📦 Step 6: Deploy to Heroku');
console.log('1. Add files to git: git add .');
console.log('2. Commit changes: git commit -m "Add MongoDB Atlas integration"');
console.log('3. Push to Heroku: git push heroku main');
console.log('4. Run database setup: heroku run node scripts/setup-fresh-database.js\n');

console.log('🎯 Alternative: Use Heroku Add-on');
console.log('You can also use MongoDB Atlas as a Heroku add-on:');
console.log('heroku addons:create mongolab:sandbox');
console.log('This automatically sets up MONGODB_URI for you.\n');

console.log('✅ Verification Steps:');
console.log('1. Check Heroku logs: heroku logs --tail');
console.log('2. Open your app: heroku open');
console.log('3. Test admin login at: your-app-url/admin/dashboard');
console.log('4. Check MongoDB Atlas dashboard for data\n');

console.log('🔧 Troubleshooting:');
console.log('• If connection fails, check your Atlas IP whitelist');
console.log('• Verify your connection string has the correct password');
console.log('• Make sure your database user has proper permissions');
console.log('• Check Heroku config vars: heroku config\n');

console.log('💡 Pro Tips:');
console.log('• MongoDB Atlas M0 (free tier) includes 512MB storage');
console.log('• Set up monitoring and alerts in Atlas dashboard');
console.log('• Consider upgrading to M2/M5 for production use');
console.log('• Enable backup in Atlas for data protection');
console.log('• Use connection pooling for better performance\n');

console.log('🎉 Your Malaysia Pickleball app will now use cloud MongoDB!');
console.log('Data will persist across Heroku dyno restarts and be accessible worldwide.'); 