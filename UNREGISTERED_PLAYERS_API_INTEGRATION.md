# Unregistered Players - Bi-Directional API Integration

## Overview

The React app now uses **API calls to Portal** for unregistered players, following the same pattern as tournaments. This ensures true bi-directional sync without database coupling.

## Architecture

```
┌─────────────────────┐         ┌──────────────────────┐
│  Portal App         │         │   React App          │
│  (port 5001)        │◄────────┤   (port 3000)        │
│                     │   API   │                      │
│  ┌──────────────┐   │  Calls  │   ┌──────────────┐   │
│  │   MongoDB    │   │         │   │ Calls Portal │   │
│  │   Portal DB  │   │         │   │     API      │   │
│  └──────────────┘   │         │   └──────────────┘   │
│                     │         │                      │
│  - Stores data      │         │   - Reads via API    │
│  - Provides API     │         │   - Writes via API   │
└─────────────────────┘         └──────────────────────┘
```

## API Endpoints Mapping

### React App → Portal API

| React App Endpoint | Portal API Endpoint | Method | Purpose |
|-------------------|--------------------| -------|---------|
| `/api/unregistered-players` | `/api/admin/unregistered-players` | GET | Fetch all unregistered players |
| `/api/unregistered-players/:id/approve` | Direct DB access* | POST | Send registration email |
| `/api/unregistered-players/:id` | `/api/admin/unregistered-players/:playerId` | DELETE | Delete unregistered player |
| `/api/unregistered-player/:token` | `/api/unregistered-player/:token` | GET | Get player by token (pre-fill) |
| `/api/unregistered-player/:token/sync` | `/api/unregistered-player/:token/sync` | PATCH | Update sync status |

*Note: Approve endpoint uses direct database access since Portal doesn't have email-sending endpoint. Both apps share same database for this operation.

## Configuration

### Local Development

**`.env.local` (React App)**
```bash
# Portal API - Points to local Portal server
PORTAL_API_URL=http://localhost:5001/api

# Database - Shared with Portal (for approve endpoint only)
MONGODB_URI=mongodb://localhost:27017/malaysia-pickleball-portal-dev

# Email & Other Config
MPA_REACT_URL=http://localhost:5173
EMAIL_USER=tournament@malaysiapickleballassociation.org
EMAIL_PASSWORD=xbwqpabrddxxvcox
```

**`.env` (Portal App)**
```bash
# Database
MONGODB_URI=mongodb://localhost:27017/malaysia-pickleball-portal-dev
# OR use: USE_LOCAL_DB=true (will auto-use local DB)

# Other Config
PORT=5001
MPA_REACT_URL=http://localhost:5173
```

### Production

**Heroku Config Vars (React App)**
```bash
# Portal API - Points to production Portal
PORTAL_API_URL=https://portalmpa.com/api

# Database - Shared with Portal (for approve endpoint only)
MONGODB_URI=mongodb+srv://...@cluster0.gqtnjwk.mongodb.net/malaysia-pickleball-portal

# Email & Other Config
MPA_REACT_URL=https://malaysiapickleball.my
EMAIL_USER=tournament@malaysiapickleballassociation.org
EMAIL_PASSWORD=xbwqpabrddxxvcox
JWT_SECRET=your-secure-secret-key
```

**Heroku Config Vars (Portal App)**
```bash
# Database
MONGODB_URI=mongodb+srv://...@cluster0.gqtnjwk.mongodb.net/malaysia-pickleball-portal

# Other Config
MPA_REACT_URL=https://malaysiapickleball.my
NODE_ENV=production
```

## How It Works

### 1. Upload Flow (Portal → React App)

```
1. Admin uploads players in Portal
   └─> Portal saves to MongoDB

2. React App admin views dashboard
   └─> React App calls Portal API GET /api/admin/unregistered-players
       └─> Portal returns players from MongoDB
           └─> Players displayed in React App dashboard ✅
```

### 2. Approve Flow (React App → Portal)

```
1. Admin clicks "Send Registration Email" in React App
   └─> React App POST /api/unregistered-players/:id/approve
       └─> Direct database access (shared DB)
           ├─> Generates registration token
           ├─> Sends email with link
           └─> Updates emailSent = true
               └─> Portal sees changes (shared DB) ✅
```

### 3. Delete Flow (React App → Portal)

```
1. Admin clicks "Delete" in React App
   └─> React App DELETE /api/unregistered-players/:id
       └─> Calls Portal API DELETE /api/admin/unregistered-players/:playerId
           └─> Portal deletes from MongoDB
               └─> Player removed ✅
```

### 4. Registration Flow (Player → Portal)

```
1. Player clicks registration link from email
   └─> React App GET /api/unregistered-player/:token
       └─> Calls Portal API GET /api/unregistered-player/:token
           └─> Portal returns pre-filled data
               └─> Form auto-filled ✅

2. Player completes registration
   └─> React App POST /api/players/register
       └─> Player saved to players collection
       └─> React App PATCH /api/unregistered-player/:token/sync
           └─> Calls Portal API PATCH /api/unregistered-player/:token/sync
               └─> Portal updates syncStatus = 'sync', registered = true
                   └─> Portal sees completed registration ✅
```

## Benefits of API Approach

### ✅ Advantages

1. **Loose Coupling**
   - React app doesn't directly access Portal's database (except approve)
   - Portal is source of truth

2. **Scalability**
   - Apps can be deployed independently
   - Portal API can handle multiple clients

3. **Consistency**
   - Follows same pattern as tournaments
   - Easy to understand and maintain

4. **Production Ready**
   - Works across different domains
   - No database connection sharing issues

5. **Security**
   - Portal controls data access via API
   - Can add authentication/authorization to API

### ⚠️ Considerations

1. **Network Dependency**
   - React app requires Portal to be running
   - API calls add network latency

2. **Single Exception**
   - Approve endpoint uses direct DB access
   - Portal doesn't have email-sending endpoint (yet)

3. **Error Handling**
   - Must handle Portal API failures gracefully
   - Need proper error messages for users

## Testing

### Local Development Testing

**Prerequisites:**
```bash
# 1. Start Portal (port 5001)
cd /home/ariffin/Desktop/portalmpa/malaysia-pickleball-portal
npm start

# 2. Start React App (port 3000 backend, 5173 frontend)
cd /home/ariffin/Desktop/MPA/malaysia-pickleball-react
npm run server  # Terminal 1
npm run dev     # Terminal 2
```

**Test Checklist:**

- [ ] Portal is running on http://localhost:5001
- [ ] React app backend is running on http://localhost:3000
- [ ] React app frontend is running on http://localhost:5173
- [ ] Upload players in Portal
- [ ] View players in React App admin dashboard
- [ ] Send registration email from React App
- [ ] Delete player from React App
- [ ] Complete registration flow

### API Call Verification

Check logs for API calls:

```bash
# React App logs should show:
📋 Fetching unregistered players from Portal API...
✅ Fetched 30 unregistered players from Portal

🗑️ Deleting unregistered player xxx via Portal API...
✅ Player deleted successfully from Portal

🔍 Fetching player with token from Portal API...
✅ Player data fetched from Portal

🔄 Updating sync status via Portal API...
✅ Sync status updated in Portal
```

## Troubleshooting

### Issue: "Portal API error: 404"

**Cause:** Portal is not running or wrong URL

**Solution:**
```bash
# Check Portal is running
curl http://localhost:5001/api/admin/unregistered-players

# If fails, start Portal
cd /home/ariffin/Desktop/portalmpa/malaysia-pickleball-portal
npm start
```

### Issue: "ECONNREFUSED localhost:5001"

**Cause:** Portal not accessible

**Solution:**
1. Verify Portal is running
2. Check PORTAL_API_URL in `.env.local`
3. Check firewall settings

### Issue: "Players not showing in dashboard"

**Cause:** Portal API not returning data or wrong endpoint

**Solution:**
```bash
# Test Portal API directly
curl http://localhost:5001/api/admin/unregistered-players

# Check response format matches expectations
```

### Issue: "Email not sending"

**Cause:** Email configuration or database access

**Solution:**
1. Check EMAIL_USER and EMAIL_PASSWORD in `.env.local`
2. Verify MongoDB connection (approve uses direct DB)
3. Check transporter configuration in server/index.js

## Production Deployment

### Steps

1. **Deploy Portal First**
   ```bash
   cd /home/ariffin/Desktop/portalmpa/malaysia-pickleball-portal
   git push heroku main
   ```

2. **Set React App Config Vars**
   ```bash
   cd /home/ariffin/Desktop/MPA/malaysia-pickleball-react

   heroku config:set PORTAL_API_URL="https://portalmpa.com/api"
   heroku config:set MONGODB_URI="mongodb+srv://...malaysia-pickleball-portal"
   heroku config:set MPA_REACT_URL="https://malaysiapickleball.my"
   ```

3. **Deploy React App**
   ```bash
   git add .
   git commit -m "Add unregistered players API integration"
   git push heroku main
   ```

4. **Verify Production**
   - Upload players in Portal
   - Check React App admin dashboard
   - Test email sending
   - Test deletion
   - Test registration flow

## Code References

### React App Server Endpoints
- GET `/api/unregistered-players` - server/index.js:1808
- POST `/api/unregistered-players/:id/approve` - server/index.js:1832
- DELETE `/api/unregistered-players/:id` - server/index.js:1885
- GET `/api/unregistered-player/:token` - server/index.js:1908
- PATCH `/api/unregistered-player/:token/sync` - server/index.js:1932

### Portal API Endpoints
- GET `/api/admin/unregistered-players` - server.js:6695
- DELETE `/api/admin/unregistered-players/:playerId` - server.js:6712
- GET `/api/unregistered-player/:token` - server.js:6741
- PATCH `/api/unregistered-player/:token/sync` - server.js:6781

## Summary

✅ React App calls Portal API for unregistered players (like tournaments)
✅ Portal is source of truth for data
✅ True bi-directional sync via API calls
✅ Approve endpoint uses shared database (Portal doesn't have email endpoint)
✅ Production ready with proper error handling
✅ Follows existing tournament pattern

**Result:** Upload in Portal → API call → Instantly visible in React App! 🎉
