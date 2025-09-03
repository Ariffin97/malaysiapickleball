# Malaysia Pickleball Association API Documentation

This comprehensive API system provides endpoints for:
1. **Unregistered Player Registration** - Register new players and generate MPA IDs
2. **Player Details Management** - Create, read, update player information including state and division

## Overview

- **Name Input**: System accepts a player name
- **MPA ID Generation**: Automatically generates a unique MPA ID
- **API Output**: Returns the MPA ID to the requesting system
- **API Key Authentication**: Secure API key-based authentication

## API Endpoints

### 1. Generate API Key (Admin Only)

**Endpoint**: `POST /api/admin/generate-api-key`

**Authentication**: Admin session required

**Request Body**:
```json
{
  "description": "API key description",
  "permissions": ["unregistered-player"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "apiKey": "mpba_1a2b3c4d5e6f7g8h9i0j...",
    "description": "API key description",
    "permissions": ["unregistered-player"],
    "createdAt": "2024-01-15T08:30:00.000Z",
    "usage": "Include this key in the X-API-Key header or as apikey query parameter"
  },
  "message": "API key generated successfully"
}
```

### 2. Register Unregistered Player

**Endpoint**: `POST /api/unregistered-player`

**Authentication**: API Key required (X-API-Key header or apikey query param)

**Request Body**:
```json
{
  "name": "Ahmad Rahman"
}
```

**Response**:
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

### 3. List API Keys (Admin Only)

**Endpoint**: `GET /api/admin/api-keys`

**Authentication**: Admin session required

**Response**:
```json
{
  "success": true,
  "data": {
    "apiKeys": [
      {
        "keyId": "mpba_1a2b3c...",
        "description": "API key description",
        "permissions": ["unregistered-player"],
        "createdBy": "admin",
        "createdAt": "2024-01-15T08:30:00.000Z",
        "lastUsed": "2024-01-15T09:15:00.000Z",
        "isActive": true
      }
    ],
    "total": 1
  },
  "message": "API keys retrieved successfully"
}
```

### 4. Revoke API Key (Admin Only)

**Endpoint**: `DELETE /api/admin/api-keys/{keyId}`

**Authentication**: Admin session required

**Response**:
```json
{
  "success": true,
  "data": null,
  "message": "API key revoked successfully"
}
```

## Player Details API Endpoints

### 5. Get Player Details

**Endpoint**: `GET /api/player-details/{playerId}`

**Authentication**: API Key with `player-details` permission required

**Response**:
```json
{
  "success": true,
  "data": {
    "player": {
      "playerId": "MPAAHMAD7423",
      "fullName": "Ahmad Rahman",
      "dateOfBirth": "1990-05-15T00:00:00.000Z",
      "age": 33,
      "state": "Selangor",
      "division": "Open (19-39)",
      "email": "ahmad@email.com",
      "phoneNumber": "012-3456789",
      "address": "123 Main St, KL",
      "status": "active",
      "joinDate": "2024-01-15T08:30:00.000Z",
      "profilePicture": null,
      "ranking": { "points": 1500, "position": 25 },
      "tournaments": 5
    }
  },
  "message": "Player details retrieved successfully"
}
```

### 6. Create New Player

**Endpoint**: `POST /api/player-details`

**Authentication**: API Key with `player-details` permission required

**Request Body**:
```json
{
  "fullName": "Ahmad Rahman",
  "dateOfBirth": "1990-05-15",
  "age": 33,
  "state": "Selangor",
  "division": "Open (19-39)",
  "email": "ahmad@email.com",
  "phoneNumber": "012-3456789",
  "address": "123 Main Street, Kuala Lumpur"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "player": {
      "playerId": "MPAAHMAD7423",
      "fullName": "Ahmad Rahman",
      "dateOfBirth": "1990-05-15T00:00:00.000Z",
      "age": 33,
      "state": "Selangor",
      "division": "Open (19-39)",
      "email": "ahmad@email.com",
      "phoneNumber": "012-3456789",
      "address": "123 Main Street, Kuala Lumpur",
      "status": "active",
      "joinDate": "2024-01-15T08:30:00.000Z"
    },
    "action": "created"
  },
  "message": "Player details created successfully"
}
```

### 7. Update Player Details

**Endpoint**: `PUT /api/player-details/{playerId}`

**Authentication**: API Key with `player-details` permission required

**Request Body** (only include fields you want to update):
```json
{
  "state": "Kuala Lumpur",
  "division": "Senior (40-49)",
  "phoneNumber": "019-9876543"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "player": {
      "playerId": "MPAAHMAD7423",
      "fullName": "Ahmad Rahman",
      "dateOfBirth": "1990-05-15T00:00:00.000Z",
      "age": 33,
      "state": "Kuala Lumpur",
      "division": "Senior (40-49)",
      "email": "ahmad@email.com",
      "phoneNumber": "019-9876543",
      "address": "123 Main Street, Kuala Lumpur",
      "status": "active"
    }
  },
  "message": "Player details updated successfully"
}
```

### 8. Search Players

**Endpoint**: `GET /api/players/search`

**Authentication**: API Key with `player-details` permission required

**Query Parameters**:
- `state` (optional): Filter by Malaysian state
- `division` (optional): Filter by player division
- `limit` (optional, default: 50): Number of results to return
- `offset` (optional, default: 0): Number of results to skip

**Example**: `GET /api/players/search?state=Selangor&division=Open%20(19-39)&limit=20`

**Response**:
```json
{
  "success": true,
  "data": {
    "players": [
      {
        "playerId": "MPAAHMAD7423",
        "fullName": "Ahmad Rahman",
        "dateOfBirth": "1990-05-15T00:00:00.000Z",
        "age": 33,
        "state": "Selangor",
        "division": "Open (19-39)",
        "email": "ahmad@email.com",
        "phoneNumber": "012-3456789",
        "status": "active",
        "joinDate": "2024-01-15T08:30:00.000Z"
      }
    ],
    "total": 150,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  },
  "message": "Players retrieved successfully"
}
```

## Field Specifications

### Malaysian States
```
Johor, Kedah, Kelantan, Kuala Lumpur, Labuan, Malacca, 
Negeri Sembilan, Pahang, Penang, Perak, Perlis, Putrajaya, 
Sabah, Sarawak, Selangor, Terengganu
```

### Player Divisions
```
Youth (Under 16), Junior (16-18), Open (19-39), Senior (40-49), 
Masters (50-59), Grand Masters (60+), Professional
```

## MPA ID Generation Logic

The MPA ID is generated using the following pattern:
- Prefix: `MPA`
- Name Component: First 6 alphabetic characters from the name (uppercase)
- Random Component: 4-digit random number

**Examples**:
- `Ahmad Rahman` → `MPAAHMAD7423`
- `Siti Nurhaliza` → `MPASITIN1892`
- `John Doe` → `MPAJOHND5647`

## Authentication Methods

### API Key in Header
```bash
curl -X POST https://your-domain.com/api/unregistered-player \
  -H "X-API-Key: mpba_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"name": "Ahmad Rahman"}'
```

### API Key in Query Parameter
```bash
curl -X POST "https://your-domain.com/api/unregistered-player?apikey=mpba_your_api_key_here" \
  -H "Content-Type: application/json" \
  -d '{"name": "Ahmad Rahman"}'
```

## Error Responses

### Missing API Key
```json
{
  "success": false,
  "message": "API key required"
}
```

### Invalid API Key
```json
{
  "success": false,
  "message": "Invalid API key"
}
```

### Validation Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "msg": "Name must be at least 2 characters",
      "param": "name",
      "location": "body"
    }
  ]
}
```

### Server Error
```json
{
  "success": false,
  "message": "Failed to process unregistered player"
}
```

## Integration Example

### JavaScript/Node.js
```javascript
const axios = require('axios');

async function registerUnregisteredPlayer(name, apiKey) {
  try {
    const response = await axios.post('http://localhost:3000/api/unregistered-player', {
      name: name
    }, {
      headers: {
        'X-API-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data.success) {
      console.log('MPA ID:', response.data.data.mpaId);
      return response.data.data.mpaId;
    } else {
      throw new Error(response.data.message);
    }
  } catch (error) {
    console.error('Registration failed:', error.message);
    throw error;
  }
}

// Usage
registerUnregisteredPlayer('Ahmad Rahman', 'mpba_your_api_key_here')
  .then(mpaId => {
    console.log('Generated MPA ID:', mpaId);
    // Send MPA ID to end receiver
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### Python
```python
import requests
import json

def register_unregistered_player(name, api_key):
    url = "http://localhost:3000/api/unregistered-player"
    headers = {
        "X-API-Key": api_key,
        "Content-Type": "application/json"
    }
    data = {"name": name}
    
    response = requests.post(url, headers=headers, json=data)
    result = response.json()
    
    if result["success"]:
        return result["data"]["mpaId"]
    else:
        raise Exception(result["message"])

# Usage
try:
    mpa_id = register_unregistered_player("Ahmad Rahman", "mpba_your_api_key_here")
    print(f"Generated MPA ID: {mpa_id}")
    # Send MPA ID to end receiver
except Exception as e:
    print(f"Error: {e}")
```

### PHP
```php
<?php
function registerUnregisteredPlayer($name, $apiKey) {
    $url = "http://localhost:3000/api/unregistered-player";
    $data = json_encode(["name" => $name]);
    
    $headers = [
        "X-API-Key: " . $apiKey,
        "Content-Type: application/json"
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $result = json_decode($response, true);
    
    if ($result["success"]) {
        return $result["data"]["mpaId"];
    } else {
        throw new Exception($result["message"]);
    }
}

// Usage
try {
    $mpaId = registerUnregisteredPlayer("Ahmad Rahman", "mpba_your_api_key_here");
    echo "Generated MPA ID: " . $mpaId . "\n";
    // Send MPA ID to end receiver
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
```

## Testing

Run the test script to verify the API functionality:

```bash
cd malaysiapickleball
node test-unregistered-player-api.js
```

## Security Notes

1. **API Key Storage**: Store API keys securely and never commit them to version control
2. **HTTPS**: Use HTTPS in production to encrypt API key transmission
3. **Rate Limiting**: The API includes rate limiting to prevent abuse
4. **Key Rotation**: Regularly rotate API keys for security
5. **Monitoring**: Monitor API key usage for suspicious activity

## Rate Limiting

- API keys are subject to rate limiting
- Default: 100 requests per 15-minute window per IP address
- Exceeding limits returns HTTP 429 status code

## Production Considerations

1. **Database Storage**: In production, store API keys in the database instead of memory
2. **Key Expiration**: Implement API key expiration dates
3. **Logging**: Add comprehensive logging for audit trails
4. **Monitoring**: Set up monitoring and alerting for API usage
5. **Backup**: Ensure MPA ID generation data is backed up

## Support

For technical support or questions about this API, contact the Malaysia Pickleball Association technical team.