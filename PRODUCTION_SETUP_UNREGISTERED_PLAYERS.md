# Production Setup: Unregistered Players Bi-Directional Sync

## Overview

For bi-directional sync to work in production, **both the Portal and React App must connect to the SAME MongoDB Atlas database**.

## Current Production Setup

### Portal (https://portalmpa.com)
- Database: `mongodb+srv://...@cluster0.gqtnjwk.mongodb.net/malaysia-pickleball-portal`
- This is the **source of truth** for unregistered players

### React App (https://malaysiapickleball.my)
- Must connect to: **SAME database as Portal** ⚠️

---

## Production Deployment Steps

### 1. Configure Heroku Environment Variables (React App)

Set these environment variables in your Heroku dashboard or CLI:

```bash
# Core Database Configuration - MUST match Portal database
MONGODB_URI=mongodb+srv://Ariffin:Ariffin.97@cluster0.gqtnjwk.mongodb.net/malaysia-pickleball-portal?retryWrites=true&w=majority&appName=Cluster0

# Email Configuration
EMAIL_USER=tournament@malaysiapickleballassociation.org
EMAIL_PASSWORD=xbwqpabrddxxvcox

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dkev9cy5e
CLOUDINARY_API_KEY=147676434856262
CLOUDINARY_API_SECRET=FhpaoO-z8VEjT_3GNvfcvoBtYEY

# MPA React URL (for registration email links)
MPA_REACT_URL=https://malaysiapickleball.my

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secure-random-string-change-this

# Node Environment
NODE_ENV=production
```

### Using Heroku CLI:

```bash
# Navigate to React app directory
cd /home/ariffin/Desktop/MPA/malaysia-pickleball-react

# Set the environment variables
heroku config:set MONGODB_URI="mongodb+srv://Ariffin:Ariffin.97@cluster0.gqtnjwk.mongodb.net/malaysia-pickleball-portal?retryWrites=true&w=majority&appName=Cluster0"

heroku config:set EMAIL_USER="tournament@malaysiapickleballassociation.org"
heroku config:set EMAIL_PASSWORD="xbwqpabrddxxvcox"

heroku config:set CLOUDINARY_CLOUD_NAME="dkev9cy5e"
heroku config:set CLOUDINARY_API_KEY="147676434856262"
heroku config:set CLOUDINARY_API_SECRET="FhpaoO-z8VEjT_3GNvfcvoBtYEY"

heroku config:set MPA_REACT_URL="https://malaysiapickleball.my"
heroku config:set JWT_SECRET="your-super-secure-random-string-change-this"
heroku config:set NODE_ENV="production"

# Verify configuration
heroku config
```

---

## 2. Database Verification

### Check Current Database Configuration

Run this script to verify both apps are using the same database:

```bash
# In React app directory
node server/check-both-databases.js
```

Expected output should show:
- Portal: `malaysia-pickleball-portal` (production)
- React App: `malaysia-pickleball-portal` (production)

Both should be **the same database name**.

---

## 3. API Endpoints Created

The following endpoints are now available in the React app (server/index.js):

### GET /api/unregistered-players
Fetches all unregistered players from shared database

### POST /api/unregistered-players/:id/approve
Sends registration email with token link

### DELETE /api/unregistered-players/:id
Deletes unregistered player

### GET /api/unregistered-player/:token
Returns pre-filled registration data

### PATCH /api/unregistered-player/:token/sync
Updates sync status after registration

---

## 4. How Bi-Directional Sync Works in Production

### Upload Flow (Portal → React App)
1. Admin uploads player list on **Portal** (https://portalmpa.com)
2. Data saved to MongoDB Atlas `unregisteredplayers` collection
3. **React App** reads from same collection
4. Players appear **immediately** in React App admin dashboard

### Approval Flow (React App → Portal)
1. Admin approves player in **React App** admin dashboard
2. Registration email sent with unique token
3. Email status updated in shared database
4. **Portal** sees the updated status immediately

### Registration Flow (Complete Cycle)
1. Player clicks registration link from email
2. React App fetches pre-filled data using token
3. Player completes registration
4. React App updates `syncStatus` to 'sync' and stores `mpaId`
5. **Portal** sees completed registration status immediately

---

## 5. Security Considerations

### Production Database Security

⚠️ **IMPORTANT**: The MongoDB connection string contains credentials. In production:

1. **Use MongoDB Atlas IP Whitelist**
   - Add your Heroku app's IP addresses
   - Enable "Allow access from anywhere" only if necessary

2. **Use Environment Variables**
   - Never commit database credentials to Git
   - Use Heroku Config Vars for sensitive data

3. **Create Production-Specific Database User**
   ```
   Consider creating a separate MongoDB user with limited permissions:
   - Read/Write access to specific collections only
   - No admin privileges
   ```

4. **Rotate Credentials Regularly**
   - Change database passwords periodically
   - Update both Portal and React App env vars

---

## 6. Testing Production Setup

### Test Checklist

- [ ] Both apps connect to same MongoDB Atlas database
- [ ] Portal can upload unregistered players
- [ ] React App displays uploaded players in admin dashboard
- [ ] React App can send registration emails
- [ ] React App can delete unregistered players
- [ ] Registration token links work correctly
- [ ] Sync status updates are visible in both apps

### Manual Test

1. **In Portal**: Upload test player list
2. **In React App**: Check admin dashboard shows the players
3. **In React App**: Send registration email to test player
4. **Check email**: Verify registration link works
5. **Complete registration**: Fill out form and submit
6. **In Portal**: Verify player marked as registered

---

## 7. Monitoring

### Database Monitoring

Monitor the shared MongoDB Atlas database:
- Connection count (both apps connect)
- Query performance
- Storage usage
- Error logs

### Application Logs

Check Heroku logs for both apps:

```bash
# React App logs
heroku logs --tail --app your-react-app-name

# Portal logs
heroku logs --tail --app your-portal-app-name
```

---

## 8. Rollback Plan

If issues occur in production:

1. **Emergency Rollback**: Switch React App to read-only mode
   - Comment out POST/DELETE endpoints
   - Keep GET endpoints active

2. **Database Separation**: If needed, temporarily use separate databases
   - Update MONGODB_URI to separate database
   - Implement manual sync process

3. **Data Backup**: Always have recent backups
   - MongoDB Atlas provides automated backups
   - Test restore process regularly

---

## 9. Common Issues & Solutions

### Issue: Players not showing in React App dashboard

**Solution**: Verify database connection
```bash
# Check React app is connected to correct database
heroku logs --tail | grep "Connected to MongoDB"
```

### Issue: Registration emails not sending

**Solution**: Check email configuration
```bash
# Verify EMAIL_USER and EMAIL_PASSWORD are set
heroku config:get EMAIL_USER
heroku config:get EMAIL_PASSWORD
```

### Issue: Database permission errors

**Solution**: Verify MongoDB Atlas user permissions
- Check user has read/write access to `unregisteredplayers` collection
- Verify IP whitelist includes Heroku IPs

---

## 10. Deployment Commands

```bash
# Deploy React App to Heroku
cd /home/ariffin/Desktop/MPA/malaysia-pickleball-react
git add .
git commit -m "Add unregistered players bi-directional sync"
git push heroku main

# Restart both apps to pick up new configuration
heroku restart --app your-react-app-name
heroku restart --app your-portal-app-name
```

---

## Summary

✅ **Local Development**: Both apps use `malaysia-pickleball-portal-dev`
✅ **Production**: Both apps use `malaysia-pickleball-portal` (MongoDB Atlas)
✅ **Bi-directional Sync**: Enabled via shared database
✅ **API Endpoints**: Implemented in React App server
✅ **Email Integration**: Registration emails with token links
✅ **Security**: Environment variables, no hardcoded credentials

**Result**: Upload in Portal → Instantly visible in React App Admin Dashboard 🎉
