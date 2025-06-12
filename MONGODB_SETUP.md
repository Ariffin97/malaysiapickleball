# MongoDB Integration Setup Guide

This guide will help you migrate your Malaysia Pickleball website from in-memory storage to MongoDB with MongoDB Compass.

## 📋 Prerequisites

1. **Node.js** (already installed)
2. **MongoDB Community Server**
3. **MongoDB Compass** (GUI tool)

## 🚀 Step-by-Step Setup

### Step 1: Install MongoDB Community Server

1. **Download MongoDB:**
   - Visit: https://www.mongodb.com/try/download/community
   - Select your Windows version
   - Download the `.msi` installer

2. **Install MongoDB:**
   - Run the downloaded `.msi` file
   - Choose "Complete" installation
   - Install as a Windows Service (recommended)
   - Install MongoDB Compass when prompted

3. **Verify Installation:**
   ```powershell
   mongod --version
   ```

### Step 2: Install MongoDB Compass

If not installed with MongoDB:
1. Download from: https://www.mongodb.com/try/download/compass
2. Install the application
3. Launch MongoDB Compass

### Step 3: Run the Setup Script

In your project directory, run:
```powershell
node setup-mongodb.js
```

This will:
- Install required npm packages (mongodb, mongoose, bcryptjs, dotenv)
- Create a `.env` configuration file
- Create necessary directories

### Step 4: Start MongoDB Service

**Option A: Windows Service (Recommended)**
MongoDB should start automatically if installed as a service.

**Option B: Manual Start**
```powershell
mongod --dbpath "C:\data\db"
```

### Step 5: Connect with MongoDB Compass

1. Open MongoDB Compass
2. Use connection string: `mongodb://localhost:27017`
3. Click "Connect"
4. You should see the MongoDB interface

### Step 6: Setup Fresh Database

```powershell
node scripts/setup-fresh-database.js
```

This will:
- Create the `malaysia-pickleball` database
- Set up all collections (tournaments, players, admins, etc.)
- Create default admin account
- Set up database indexes for optimal performance

### Step 7: Start Your Application

```powershell
node server-new.js
```

Your application will now use MongoDB instead of in-memory storage!

## 🗄️ Database Structure

### Collections Created:

1. **tournaments** - Tournament information
2. **players** - Approved player accounts
3. **playerregistrations** - Pending player registrations
4. **admins** - Admin accounts with authentication
5. **settings** - Application settings and configuration

### Default Admin Account:
- **Username:** `admin`
- **Password:** `admin123`
- ⚠️ **Important:** Change this password after first login!

## 🔧 Configuration

### Environment Variables (.env file):

```env
# MongoDB Configuration
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
```

### MongoDB Compass Connection:

- **Connection String:** `mongodb://localhost:27017`
- **Database Name:** `malaysia-pickleball`

## 📊 Using MongoDB Compass

### Viewing Data:
1. Connect to your MongoDB instance
2. Select the `malaysia-pickleball` database
3. Browse collections to view your data

### Key Features:
- **Visual Query Builder** - Create queries without writing code
- **Document Editor** - Edit documents directly
- **Index Management** - Optimize database performance
- **Real-time Performance Monitoring**

### Common Operations:

**View All Tournaments:**
1. Click on `tournaments` collection
2. Browse documents

**View Player Registrations:**
1. Click on `playerregistrations` collection
2. Filter by `status: "pending"` to see pending registrations

**Manage Admin Accounts:**
1. Click on `admins` collection
2. View/edit admin accounts

## 🔐 Security Features

### Password Security:
- All passwords are hashed using bcryptjs
- Salt rounds: 10 (configurable)

### Session Security:
- Session timeout: 2 hours (configurable)
- Session hijacking protection
- Rate limiting on login attempts

### Account Lockout:
- Max login attempts: 5 (configurable)
- Lockout duration: 15 minutes (configurable)

## 🛠️ Unique ID Generation

### Player IDs:
- Format: `MP0001`, `MP0002`, etc.
- Automatically generated and incremented

### Registration IDs:
- Format: `REG0001`, `REG0002`, etc.
- For tracking player registration applications

## 📈 Benefits of MongoDB Integration

1. **Data Persistence** - No data loss on server restart
2. **Scalability** - Handle thousands of players and tournaments
3. **Data Integrity** - Schema validation and constraints
4. **Security** - Proper password hashing and authentication
5. **Backup & Recovery** - Easy database backup and restore
6. **Analytics** - Query data for insights and reports
7. **Visual Management** - MongoDB Compass for easy data management

## 🆕 Fresh Start Setup

The fresh database setup creates:
- ✅ Clean database structure with all collections
- ✅ Default admin account with secure password hashing
- ✅ Essential application settings
- ✅ Database indexes for optimal performance
- ✅ Tournament type configurations ready for use

## 🚨 Troubleshooting

### MongoDB Won't Start:
1. Check if port 27017 is available
2. Ensure MongoDB service is running
3. Check Windows Services for "MongoDB"

### Connection Issues:
1. Verify MongoDB is running: `mongod --version`
2. Check firewall settings
3. Ensure connection string is correct

### Setup Errors:
1. Ensure MongoDB is running before setup
2. Check console output for specific errors
3. Verify all model files are present

### Application Errors:
1. Check `.env` file configuration
2. Verify all npm packages are installed
3. Check console logs for detailed error messages

## 📞 Support

If you encounter issues:
1. Check the console output for error messages
2. Verify MongoDB service is running
3. Ensure all dependencies are installed
4. Check the `.env` file configuration

## 🎯 Next Steps

After successful setup:
1. Change the default admin password
2. Configure backup strategies
3. Set up monitoring (optional)
4. Consider MongoDB Atlas for cloud hosting (optional)

Your Malaysia Pickleball website is now powered by MongoDB! 🎉 