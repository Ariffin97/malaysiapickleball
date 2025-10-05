# Malaysia Pickleball Backend

This is the Express backend server for the Malaysia Pickleball React app. It syncs tournament data bidirectionally with the Portal API.

## Architecture

```
┌─────────────────────┐
│  Portal Backend     │ (portalmpa.com)
│  (Admin Approval)   │
└──────────┬──────────┘
           │ API Communication
           │ (Bidirectional Sync)
           ▼
┌─────────────────────┐
│  Malaysia Backend   │ (malaysiapickleball.my)
│  + MongoDB          │ (This Project)
└──────────┬──────────┘
           │ REST API
           ▼
┌─────────────────────┐
│  React Frontend     │
│  (Vite)             │
└─────────────────────┘
```

## Features

- **Automatic Sync**: Syncs approved tournaments from Portal API
- **Local Storage**: MongoDB stores tournaments locally for fast access
- **Webhook Support**: Real-time updates when Portal data changes
- **Filtering**: Query tournaments by state, type, or upcoming dates

## API Endpoints

### GET `/api/tournaments`
Get all approved tournaments
- Query params: `?state=Selangor&type=national&upcoming=true`

### GET `/api/tournaments/:id`
Get single tournament by applicationId

### POST `/api/tournaments/sync`
Manually trigger sync from Portal API

### POST `/api/webhooks/tournament-updated`
Webhook endpoint for Portal updates (action: 'updated' | 'deleted')

### GET `/api/health`
Health check endpoint

## Environment Variables

### Development (`.env.local`)
```bash
VITE_API_BASE_URL=http://localhost:3000/api
PORTAL_API_URL=http://localhost:5001/api
MONGODB_URI=mongodb://localhost:27017/malaysia-pickleball
```

### Production (`.env`)
```bash
VITE_API_BASE_URL=https://malaysiapickleball.my/api
PORTAL_API_URL=https://portalmpa.com/api
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/malaysia-pickleball
```

## Development Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start MongoDB locally:**
   ```bash
   mongod
   ```

3. **Run backend + frontend:**
   ```bash
   npm run dev:all
   ```

   Or run separately:
   ```bash
   npm run dev:backend  # Backend on port 3000
   npm run dev          # Frontend on port 5173
   ```

4. **Initial sync from Portal:**
   ```bash
   curl -X POST http://localhost:3000/api/tournaments/sync
   ```

## Production Deployment (Heroku)

1. **Set environment variables:**
   ```bash
   heroku config:set MONGODB_URI="mongodb+srv://..." -a malaysiapickleball
   heroku config:set PORTAL_API_URL="https://portalmpa.com/api" -a malaysiapickleball
   ```

2. **Deploy:**
   ```bash
   git push heroku-frontend main
   ```

3. **Initial sync:**
   ```bash
   curl -X POST https://malaysiapickleball.my/api/tournaments/sync
   ```

## Portal Webhook Configuration

Configure the Portal backend to send webhooks to:
- **Development**: `http://localhost:3000/api/webhooks/tournament-updated`
- **Production**: `https://malaysiapickleball.my/api/webhooks/tournament-updated`

This ensures real-time sync when tournaments are approved/updated/deleted in the Portal.

## Database Schema

**Tournament Model:**
```javascript
{
  applicationId: String,      // Portal reference ID
  name: String,               // Event title
  type: String,               // local|state|national|international
  startDate: Date,
  endDate: Date,
  venue: String,
  city: String,
  state: String,
  organizer: String,
  contactEmail: String,
  description: String,
  categories: Array,
  status: String,             // Approved|Archived
  lastSyncedAt: Date,
  portalData: Object         // Full portal data backup
}
```

## Sync Strategy

1. **Manual Sync**: Admin triggers `/api/tournaments/sync`
2. **Webhook Sync**: Portal sends updates automatically
3. **Scheduled Sync**: (Optional) Set up cron job for periodic sync

## Notes

- Frontend talks to **local backend only** (not directly to Portal)
- Backend handles all Portal API communication
- Tournaments are cached in MongoDB for performance
- Webhook ensures data stays in sync in real-time
