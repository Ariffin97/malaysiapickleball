# Quick Start Guide - Unregistered Player API

## 🚀 How to Access and Use the API

### **Step 1: Access Admin Panel**
1. Start the server: `npm start`
2. Open your browser and go to: **http://localhost:3000/admin/dashboard**
3. Login with your admin credentials

### **Step 2: Generate API Key**
1. In the admin dashboard, click on **"API Keys"** in the left sidebar
2. Click the **"Generate New API Key"** button
3. Fill in the form:
   - **Description**: Give it a name (e.g., "Player Management System")
   - **Permissions**: Select the permissions you need:
     - ☑️ **Unregistered Player Registration** - For generating MPA IDs
     - ☑️ **Player Details Management** - For managing player information
4. Click **"Generate Key"**
5. **IMPORTANT**: Copy and save the generated API key immediately!

### **Step 3: Test the API**

#### Using curl:
```bash
curl -X POST http://localhost:3000/api/unregistered-player \
  -H "X-API-Key: YOUR_API_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{"name": "Ahmad Rahman"}'
```

#### Expected Response:
```json
{
  "success": true,
  "data": {
    "name": "Ahmad Rahman",
    "mpaId": "MPAAHMAD7423",
    "registrationDate": "2024-01-15T08:30:00.000Z",
    "status": "unregistered",
    "message": "MPA ID generated successfully. Player can now register using this ID."
  },
  "message": "New unregistered player processed successfully"
}
```

### **Step 4: Integration Examples**

#### A. Unregistered Player Registration
```javascript
const axios = require('axios');

async function registerPlayer(name) {
  try {
    const response = await axios.post('http://localhost:3000/api/unregistered-player', {
      name: name
    }, {
      headers: {
        'X-API-Key': 'YOUR_API_KEY_HERE',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data.mpaId;
  } catch (error) {
    console.error('Registration failed:', error);
    throw error;
  }
}

// Usage
registerPlayer('Ahmad Rahman')
  .then(mpaId => {
    console.log('Generated MPA ID:', mpaId);
    // Send MPA ID to your end receiver system
  })
  .catch(error => console.error('Error:', error));
```

#### B. Player Details Management
```javascript
// Create new player with full details
async function createPlayerDetails(playerData) {
  try {
    const response = await axios.post('http://localhost:3000/api/player-details', {
      fullName: playerData.name,
      dateOfBirth: playerData.dob, // YYYY-MM-DD format
      age: playerData.age,
      state: playerData.state,
      division: playerData.division,
      email: playerData.email,
      phoneNumber: playerData.phone,
      address: playerData.address
    }, {
      headers: {
        'X-API-Key': 'YOUR_API_KEY_HERE',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data.player;
  } catch (error) {
    console.error('Player creation failed:', error);
    throw error;
  }
}

// Get player details
async function getPlayerDetails(playerId) {
  try {
    const response = await axios.get(`http://localhost:3000/api/player-details/${playerId}`, {
      headers: {
        'X-API-Key': 'YOUR_API_KEY_HERE'
      }
    });
    
    return response.data.data.player;
  } catch (error) {
    console.error('Failed to get player details:', error);
    throw error;
  }
}

// Update player details
async function updatePlayerDetails(playerId, updates) {
  try {
    const response = await axios.put(`http://localhost:3000/api/player-details/${playerId}`, updates, {
      headers: {
        'X-API-Key': 'YOUR_API_KEY_HERE',
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.data.player;
  } catch (error) {
    console.error('Player update failed:', error);
    throw error;
  }
}

// Search players by state and division
async function searchPlayers(state, division, limit = 50) {
  try {
    const params = new URLSearchParams({
      ...(state && { state }),
      ...(division && { division }),
      limit: limit.toString()
    });
    
    const response = await axios.get(`http://localhost:3000/api/players/search?${params}`, {
      headers: {
        'X-API-Key': 'YOUR_API_KEY_HERE'
      }
    });
    
    return response.data.data;
  } catch (error) {
    console.error('Player search failed:', error);
    throw error;
  }
}

// Example usage
createPlayerDetails({
  name: 'Ahmad Rahman',
  dob: '1990-05-15',
  age: 33,
  state: 'Selangor',
  division: 'Open (19-39)',
  email: 'ahmad@email.com',
  phone: '012-3456789',
  address: '123 Main St, KL'
}).then(player => {
  console.log('Player created:', player.playerId);
  
  // Update player division
  return updatePlayerDetails(player.playerId, {
    division: 'Senior (40-49)',
    state: 'Kuala Lumpur'
  });
}).then(updatedPlayer => {
  console.log('Player updated:', updatedPlayer);
  
  // Search for players in Selangor
  return searchPlayers('Selangor', null, 10);
}).then(searchResults => {
  console.log(`Found ${searchResults.total} players in Selangor`);
}).catch(error => {
  console.error('Error:', error);
});
```

## 🔧 Admin Interface Locations

| Feature | URL | Purpose |
|---------|-----|---------|
| **Admin Dashboard** | `/admin/dashboard` | Main admin panel |
| **API Keys Management** | `/admin/api-keys` | Generate, view, and revoke API keys |
| **Player Management** | `/admin/players` | View registered players |

## 📋 API Endpoints Summary

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| `POST` | `/api/admin/generate-api-key` | Generate new API key | Admin session |
| `GET` | `/api/admin/api-keys` | List all API keys | Admin session |
| `DELETE` | `/api/admin/api-keys/:keyId` | Revoke API key | Admin session |
| `POST` | `/api/unregistered-player` | Register unregistered player | API key (unregistered-player) |
| `GET` | `/api/player-details/:playerId` | Get player details | API key (player-details) |
| `POST` | `/api/player-details` | Create new player | API key (player-details) |
| `PUT` | `/api/player-details/:playerId` | Update player details | API key (player-details) |
| `GET` | `/api/players/search` | Search players by state/division | API key (player-details) |

## 🔐 API Key Usage

### In Headers:
```bash
-H "X-API-Key: YOUR_API_KEY_HERE"
```

### In Query Parameters:
```bash
?apikey=YOUR_API_KEY_HERE
```

## 🆔 MPA ID Format

- **Pattern**: `MPA` + Name (6 chars) + Random (4 digits)
- **Examples**:
  - `Ahmad Rahman` → `MPAAHMAD7423`
  - `Siti Nurhaliza` → `MPASITIN1892`
  - `John Doe` → `MPAJOHND5647`

## ⚠️ Important Notes

1. **Save API Keys**: API keys are only shown once during generation
2. **Security**: Never commit API keys to version control
3. **HTTPS**: Use HTTPS in production
4. **Rate Limits**: 100 requests per 15 minutes per IP
5. **Monitoring**: Check API key usage regularly in admin panel

## 🧪 Testing

Run the automated test script:
```bash
node test-unregistered-player-api.js
```

Or run the setup guide:
```bash
node setup-api-demo.js
```

## 🆘 Troubleshooting

### Common Issues:

1. **"API key required"**
   - Make sure you include the API key in the `X-API-Key` header

2. **"Invalid API key"**
   - Check that your API key is correct and hasn't been revoked

3. **"Name must be at least 2 characters"**
   - Ensure the name field has at least 2 characters

4. **Server not responding**
   - Make sure the server is running with `npm start`

### Getting Help:

1. Check server logs for error messages
2. Verify admin login works at `/admin/dashboard`
3. Test API key generation in admin panel
4. Use the test script to validate functionality

## 🎯 Integration Flow

```
External System → API Call → MPA ID Generated → Send to End Receiver
```

1. **External system** calls API with player name
2. **API** generates unique MPA ID
3. **System** receives MPA ID in response
4. **System** forwards MPA ID to end receiver
5. **Process complete** ✅

---

**Need more details?** See the complete documentation in `UNREGISTERED_PLAYER_API.md`