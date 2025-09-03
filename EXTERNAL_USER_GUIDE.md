# Malaysia Pickleball Association API - External User Guide

## 🚀 Getting Started

### What You Need
1. **API Key** - Request from MPA admin
2. **Base URL** - http://your-domain.com/api
3. **HTTP Client** - Any programming language that can make HTTP requests

### Authentication
Include your API key in every request using the `X-API-Key` header:
```
X-API-Key: your-api-key-here
```

## 📋 Available Endpoints

### 1. Unregistered Player Registration
**Endpoint**: `POST /api/unregistered-player`
**Purpose**: Generate MPA ID for new players
**Permission Required**: `unregistered-player`

**Request**:
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
    "status": "unregistered"
  }
}
```

### 2. Get Player Details
**Endpoint**: `GET /api/player-details/{playerId}`
**Purpose**: Retrieve complete player information
**Permission Required**: `player-details`

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
      "status": "active"
    }
  }
}
```

### 3. Create New Player
**Endpoint**: `POST /api/player-details`
**Purpose**: Create player with complete details
**Permission Required**: `player-details`

**Request**:
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

### 4. Update Player Details
**Endpoint**: `PUT /api/player-details/{playerId}`
**Purpose**: Update specific player fields
**Permission Required**: `player-details`

**Request** (only include fields to update):
```json
{
  "state": "Kuala Lumpur",
  "division": "Senior (40-49)"
}
```

### 5. Search Players
**Endpoint**: `GET /api/players/search`
**Purpose**: Find players by criteria
**Permission Required**: `player-details`

**Query Parameters**:
- `state` - Filter by Malaysian state
- `division` - Filter by player division
- `limit` - Number of results (default: 50)
- `offset` - Skip results (for pagination)

**Example**: `/api/players/search?state=Selangor&division=Open%20(19-39)&limit=20`

## 🔧 Integration Examples

### JavaScript/Node.js
```javascript
const axios = require('axios');

class MPAApiClient {
  constructor(apiKey, baseUrl = 'http://your-domain.com/api') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.headers = {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json'
    };
  }

  async createPlayer(playerData) {
    const response = await axios.post(`${this.baseUrl}/player-details`, playerData, {
      headers: this.headers
    });
    return response.data;
  }

  async getPlayer(playerId) {
    const response = await axios.get(`${this.baseUrl}/player-details/${playerId}`, {
      headers: this.headers
    });
    return response.data;
  }

  async searchPlayers(state, division, limit = 50) {
    const params = new URLSearchParams({
      ...(state && { state }),
      ...(division && { division }),
      limit: limit.toString()
    });
    
    const response = await axios.get(`${this.baseUrl}/players/search?${params}`, {
      headers: this.headers
    });
    return response.data;
  }
}

// Usage
const mpaApi = new MPAApiClient('your-api-key-here');

// Create a player
mpaApi.createPlayer({
  fullName: 'Ahmad Rahman',
  state: 'Selangor',
  division: 'Open (19-39)',
  email: 'ahmad@email.com'
}).then(result => {
  console.log('Player created:', result.data.player.playerId);
});
```

### Python
```python
import requests
import json

class MPAApiClient:
    def __init__(self, api_key, base_url='http://your-domain.com/api'):
        self.api_key = api_key
        self.base_url = base_url
        self.headers = {
            'X-API-Key': api_key,
            'Content-Type': 'application/json'
        }
    
    def create_player(self, player_data):
        response = requests.post(
            f'{self.base_url}/player-details',
            headers=self.headers,
            json=player_data
        )
        return response.json()
    
    def get_player(self, player_id):
        response = requests.get(
            f'{self.base_url}/player-details/{player_id}',
            headers=self.headers
        )
        return response.json()
    
    def search_players(self, state=None, division=None, limit=50):
        params = {'limit': limit}
        if state:
            params['state'] = state
        if division:
            params['division'] = division
            
        response = requests.get(
            f'{self.base_url}/players/search',
            headers=self.headers,
            params=params
        )
        return response.json()

# Usage
mpa_api = MPAApiClient('your-api-key-here')

# Create a player
result = mpa_api.create_player({
    'fullName': 'Ahmad Rahman',
    'state': 'Selangor',
    'division': 'Open (19-39)',
    'email': 'ahmad@email.com'
})
print(f"Player created: {result['data']['player']['playerId']}")
```

### PHP
```php
<?php
class MPAApiClient {
    private $apiKey;
    private $baseUrl;
    
    public function __construct($apiKey, $baseUrl = 'http://your-domain.com/api') {
        $this->apiKey = $apiKey;
        $this->baseUrl = $baseUrl;
    }
    
    private function makeRequest($method, $endpoint, $data = null) {
        $url = $this->baseUrl . $endpoint;
        $headers = [
            'X-API-Key: ' . $this->apiKey,
            'Content-Type: application/json'
        ];
        
        $context = [
            'http' => [
                'method' => $method,
                'header' => implode("\r\n", $headers),
                'content' => $data ? json_encode($data) : null
            ]
        ];
        
        $response = file_get_contents($url, false, stream_context_create($context));
        return json_decode($response, true);
    }
    
    public function createPlayer($playerData) {
        return $this->makeRequest('POST', '/player-details', $playerData);
    }
    
    public function getPlayer($playerId) {
        return $this->makeRequest('GET', '/player-details/' . $playerId);
    }
    
    public function searchPlayers($state = null, $division = null, $limit = 50) {
        $params = ['limit' => $limit];
        if ($state) $params['state'] = $state;
        if ($division) $params['division'] = $division;
        
        $queryString = http_build_query($params);
        return $this->makeRequest('GET', '/players/search?' . $queryString);
    }
}

// Usage
$mpaApi = new MPAApiClient('your-api-key-here');

$result = $mpaApi->createPlayer([
    'fullName' => 'Ahmad Rahman',
    'state' => 'Selangor',
    'division' => 'Open (19-39)',
    'email' => 'ahmad@email.com'
]);

echo "Player created: " . $result['data']['player']['playerId'];
?>
```

## 📊 Field Specifications

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

## ❌ Error Handling

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing API key)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (player doesn't exist)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error

### Error Response Format
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    {
      "msg": "Specific validation error",
      "param": "fieldName",
      "location": "body"
    }
  ]
}
```

## 🔒 Security Best Practices

1. **Protect your API key** - Never commit it to version control
2. **Use HTTPS** in production
3. **Implement rate limiting** on your side if making many requests
4. **Validate responses** before using data
5. **Handle errors gracefully**

## 📞 Support

For technical support or API key requests, contact:
- **Email**: api-support@mpa.com
- **Admin Panel**: Request API key through admin
- **Documentation**: Keep this guide for reference

## 🔄 Rate Limits

- **Default**: 100 requests per 15-minute window per IP
- **Burst**: Short bursts allowed for normal usage
- **Headers**: Check `X-RateLimit-*` headers in responses

## 📈 Best Practices

1. **Cache responses** when appropriate
2. **Use pagination** for large result sets
3. **Implement retry logic** with exponential backoff
4. **Log API calls** for debugging
5. **Monitor API usage** and performance