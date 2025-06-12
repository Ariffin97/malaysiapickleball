# 🚀 Heroku Deployment Guide with MongoDB Atlas

This guide will help you deploy your Malaysia Pickleball website to Heroku with MongoDB Atlas cloud database.

## 🌐 **Why MongoDB Atlas for Heroku?**

- ✅ **Free Tier Available** - 512MB storage, perfect for starting
- ✅ **Global Cloud Database** - Accessible from anywhere
- ✅ **Automatic Backups** - Data protection included
- ✅ **High Availability** - 99.95% uptime SLA
- ✅ **Easy Scaling** - Upgrade as you grow
- ✅ **Built-in Security** - Encryption and access controls

## 📋 **Prerequisites**

1. **Heroku Account** - Sign up at https://heroku.com
2. **MongoDB Atlas Account** - Sign up at https://www.mongodb.com/cloud/atlas
3. **Git** - For version control
4. **Heroku CLI** - Download from https://devcenter.heroku.com/articles/heroku-cli

## 🔧 **Step 1: Set Up MongoDB Atlas (FREE)**

### Create Your Cloud Database:

1. **Go to MongoDB Atlas:**
   - Visit: https://www.mongodb.com/cloud/atlas
   - Click "Try Free" and create account

2. **Create a Free Cluster:**
   - Choose "Build a Database"
   - Select "M0 Sandbox" (FREE forever)
   - Choose cloud provider (AWS/Google/Azure)
   - Select region closest to your users
   - Name your cluster (e.g., "malaysia-pickleball")
   - Click "Create Cluster" (takes 1-3 minutes)

3. **Create Database User:**
   - Go to "Database Access" in left sidebar
   - Click "Add New Database User"
   - Choose "Password" authentication
   - Create username and strong password (**SAVE THESE!**)
   - Set privileges to "Read and write to any database"
   - Click "Add User"

4. **Configure Network Access:**
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Click "Allow Access from Anywhere" (required for Heroku)
   - Click "Confirm"

5. **Get Connection String:**
   - Go to "Database" in left sidebar
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Select "Node.js" and version "4.1 or later"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `malaysia-pickleball`

**Example Connection String:**
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/malaysia-pickleball?retryWrites=true&w=majority
```

## 🚀 **Step 2: Deploy to Heroku**

### Option A: Quick Deploy (Recommended)

1. **Install Heroku CLI and Login:**
   ```bash
   # Install from: https://devcenter.heroku.com/articles/heroku-cli
   heroku login
   ```

2. **Create Heroku App:**
   ```bash
   heroku create your-app-name
   # Example: heroku create malaysia-pickleball-app
   ```

3. **Set Environment Variables:**
   ```bash
   # Replace with your actual Atlas connection string
   heroku config:set MONGODB_URI="mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/malaysia-pickleball?retryWrites=true&w=majority"
   
   # Set a strong session secret
   heroku config:set SESSION_SECRET="your-super-secret-session-key-change-this"
   
   # Production settings
   heroku config:set NODE_ENV="production"
   heroku config:set BCRYPT_ROUNDS="12"
   heroku config:set MAX_LOGIN_ATTEMPTS="5"
   heroku config:set LOCK_TIME="900000"
   ```

4. **Deploy Your App:**
   ```bash
   # Add all files to git
   git add .
   
   # Commit changes
   git commit -m "Deploy to Heroku with MongoDB Atlas"
   
   # Push to Heroku (this triggers deployment)
   git push heroku main
   ```

5. **Initialize Database:**
   ```bash
   # This sets up your database with default admin account
   heroku run node scripts/setup-fresh-database.js
   ```

6. **Open Your App:**
   ```bash
   heroku open
   ```

### Option B: Using Heroku Add-on (Alternative)

```bash
# This automatically sets up MongoDB Atlas
heroku addons:create mongolab:sandbox
```

## ✅ **Step 3: Verify Deployment**

1. **Check App Status:**
   ```bash
   heroku logs --tail
   ```

2. **Test Your Website:**
   - Visit your Heroku app URL
   - Go to `/admin/dashboard`
   - Login with: `admin` / `admin123`
   - **Change the password immediately!**

3. **Verify Database:**
   - Check MongoDB Atlas dashboard
   - You should see the `malaysia-pickleball` database
   - Collections should be created with data

## 🔧 **Configuration Details**

### Environment Variables Set:

| Variable | Purpose | Example |
|----------|---------|---------|
| `MONGODB_URI` | Atlas connection string | `mongodb+srv://...` |
| `SESSION_SECRET` | Session encryption key | `your-secret-key` |
| `NODE_ENV` | Environment mode | `production` |
| `BCRYPT_ROUNDS` | Password hashing strength | `12` |
| `MAX_LOGIN_ATTEMPTS` | Login security | `5` |
| `LOCK_TIME` | Account lockout duration | `900000` (15 min) |

### Automatic Features:

- ✅ **Database Setup** - Runs automatically on first deploy
- ✅ **Admin Account** - Created with default credentials
- ✅ **Security** - Production-grade password hashing
- ✅ **Sessions** - Secure session management
- ✅ **HTTPS** - Automatic SSL on Heroku

## 📊 **MongoDB Atlas Dashboard**

After deployment, you can manage your data through:

1. **Atlas Dashboard:**
   - View collections and documents
   - Monitor performance
   - Set up alerts
   - Manage backups

2. **MongoDB Compass:**
   - Download and install MongoDB Compass
   - Connect using your Atlas connection string
   - Visual data management

## 🚨 **Troubleshooting**

### Common Issues:

**App Won't Start:**
```bash
heroku logs --tail
# Check for connection errors
```

**Database Connection Failed:**
- Verify your Atlas connection string
- Check IP whitelist (should allow 0.0.0.0/0)
- Confirm database user permissions

**Admin Login Not Working:**
```bash
# Re-run database setup
heroku run node scripts/setup-fresh-database.js
```

**Environment Variables:**
```bash
# Check current config
heroku config

# Update if needed
heroku config:set MONGODB_URI="new-connection-string"
```

## 💡 **Production Tips**

### Security:
- Change default admin password immediately
- Use strong session secret
- Enable Atlas IP whitelisting for extra security
- Set up Atlas alerts for unusual activity

### Performance:
- Monitor Atlas performance metrics
- Consider upgrading to M2/M5 for production traffic
- Enable Atlas connection pooling
- Set up database indexes (already included)

### Backup:
- Atlas M0 includes basic backups
- Consider upgrading for point-in-time recovery
- Export important data regularly

### Monitoring:
- Use Heroku metrics dashboard
- Set up Atlas monitoring alerts
- Monitor application logs: `heroku logs --tail`

## 🎯 **Scaling Options**

### Free Tier Limits:
- **Heroku:** 550-1000 dyno hours/month
- **Atlas M0:** 512MB storage, shared CPU
- **Perfect for:** Development, small websites, testing

### Upgrade Paths:
- **Heroku Hobby ($7/month):** No sleep, custom domains
- **Atlas M2 ($9/month):** 2GB storage, dedicated CPU
- **Atlas M5 ($25/month):** 5GB storage, better performance

## 🎉 **Success!**

Your Malaysia Pickleball website is now live on Heroku with MongoDB Atlas!

### What You Have:
- ✅ **Live Website** - Accessible worldwide
- ✅ **Cloud Database** - Persistent, scalable storage
- ✅ **Admin Panel** - Manage tournaments and players
- ✅ **Automatic Backups** - Data protection included
- ✅ **Professional Setup** - Production-ready configuration

### Next Steps:
1. Change default admin password
2. Add your tournaments and content
3. Test all functionality
4. Share your website URL
5. Monitor usage and performance

**Your app URL:** `https://your-app-name.herokuapp.com`
**Admin panel:** `https://your-app-name.herokuapp.com/admin/dashboard`

Congratulations! Your Malaysia Pickleball website is now live! 🎉 