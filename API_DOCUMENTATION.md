# Malaysia Pickleball API Documentation

This document provides comprehensive information about the API endpoints available in the Malaysia Pickleball system.

## Base URL
```
http://localhost:3000/api
```

## Authentication
The API uses session-based authentication. After successful login, subsequent requests will use the session cookie for authentication.

## Response Format
All API responses follow this standard format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data here
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "errors": [
    // Validation errors (if any)
  ]
}
```

## Rate Limiting
- **Window**: 15 minutes
- **Max Requests**: 100 per IP address
- **Response**: 429 Too Many Requests when limit exceeded

---

## 🔐 Authentication Endpoints

### 1. Admin Login
**POST** `/api/admin/login`

Authenticate admin user and create session.

#### Request Body
```json
{
  "username": "admin",
  "password": "password123"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "admin": {
      "id": "65f1234567890abcdef12345",
      "username": "admin",
      "fullName": "Admin User",
      "role": "super_admin",
      "permissions": ["manage_tournaments", "manage_players"]
    }
  }
}
```

#### Error Responses
- **400**: Validation failed
- **401**: Invalid username or password
- **423**: Account temporarily locked

---

### 2. Player Login
**POST** `/api/player/login`

Authenticate player user and create session.

#### Request Body
```json
{
  "username": "player123",
  "password": "password123"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Player login successful",
  "data": {
    "player": {
      "id": "65f1234567890abcdef12346",
      "playerId": "MP1001",
      "username": "player123",
      "fullName": "John Doe",
      "email": "john@example.com",
      "status": "active"
    }
  }
}
```

#### Error Responses
- **400**: Validation failed
- **401**: Invalid username or password
- **403**: Account not active

---

### 3. Logout
**POST** `/api/logout`

Destroy current session (works for both admin and player).

#### Success Response (200)
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 📝 Registration Endpoints

### 4. Player Registration
**POST** `/api/player/register`

Submit player registration for admin approval.

#### Request Body
```json
{
  "fullName": "John Doe",
  "icNumber": "990101101234",
  "age": 25,
  "address": "123 Main Street, Kuala Lumpur",
  "phoneNumber": "+60123456789",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "SecurePass123"
}
```

#### Validation Rules
- **fullName**: Minimum 2 characters
- **icNumber**: Exactly 12 digits
- **age**: Integer between 12-100
- **address**: Minimum 10 characters
- **phoneNumber**: Valid mobile phone format
- **email**: Valid email format
- **username**: 3-20 characters, alphanumeric and underscore only
- **password**: Minimum 8 characters, must contain uppercase, lowercase, and digit

#### Success Response (201)
```json
{
  "success": true,
  "message": "Registration submitted successfully. Please wait for admin approval.",
  "data": {
    "registrationId": "REG0001"
  }
}
```

#### Error Responses
- **400**: Validation failed
- **409**: IC number, username, or email already exists

---

## ✅ Approval Endpoints (Admin Only)

### 5. Get Pending Registrations
**GET** `/api/admin/registrations/pending`

Get list of pending player registrations.

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "registrations": [
      {
        "_id": "65f1234567890abcdef12347",
        "registrationId": "REG0001",
        "fullName": "John Doe",
        "icNumber": "990101101234",
        "age": 25,
        "address": "123 Main Street, Kuala Lumpur",
        "phoneNumber": "+60123456789",
        "email": "john@example.com",
        "username": "johndoe",
        "status": "pending",
        "submittedAt": "2024-01-15T10:30:00.000Z"
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 5,
      "total": 45
    }
  }
}
```

---

### 6. Approve Registration
**POST** `/api/admin/registrations/:id/approve`

Approve a pending player registration.

#### Request Body (Optional)
```json
{
  "notes": "Approved - all documents verified"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Registration approved successfully",
  "data": {
    "playerId": "MP1001"
  }
}
```

#### Error Responses
- **401**: Admin authentication required
- **404**: Registration not found or already processed

---

### 7. Reject Registration
**POST** `/api/admin/registrations/:id/reject`

Reject a pending player registration.

#### Request Body (Required)
```json
{
  "notes": "Incomplete documentation provided"
}
```

#### Validation Rules
- **notes**: Minimum 10 characters (rejection reason required)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Registration rejected"
}
```

---

## 👤 User Data Endpoints

### 8. Get Player Profile
**GET** `/api/player/profile`

Get current logged-in player's profile information.

**Authentication Required**: Player session

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "player": {
      "id": "65f1234567890abcdef12346",
      "playerId": "MP1001",
      "fullName": "John Doe",
      "icNumber": "990101101234",
      "age": 25,
      "address": "123 Main Street, Kuala Lumpur",
      "phoneNumber": "+60123456789",
      "email": "john@example.com",
      "username": "johndoe",
      "profilePicture": "/uploads/profile/player123.jpg",
      "status": "active",
      "joinDate": "2024-01-15T10:30:00.000Z",
      "tournaments": [],
      "ranking": {
        "points": 1250,
        "position": 15,
        "lastUpdated": "2024-01-20T08:00:00.000Z"
      }
    }
  }
}
```

#### Error Responses
- **401**: Player authentication required
- **404**: Player not found

---

### 9. Get Admin Profile
**GET** `/api/admin/profile`

Get current logged-in admin's profile information.

**Authentication Required**: Admin session

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "admin": {
      "id": "65f1234567890abcdef12345",
      "username": "admin",
      "email": "admin@example.com",
      "fullName": "Admin User",
      "role": "super_admin",
      "permissions": ["manage_tournaments", "manage_players", "manage_admins"],
      "lastLogin": "2024-01-20T09:15:00.000Z"
    }
  }
}
```

---

### 10. Get All Players (Admin Only)
**GET** `/api/admin/players`

Get list of all players with filtering and pagination.

**Authentication Required**: Admin session

#### Query Parameters
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search by name, username, email, or player ID
- `status` (optional): Filter by status (all, active, inactive, suspended)

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "players": [
      {
        "_id": "65f1234567890abcdef12346",
        "playerId": "MP1001",
        "fullName": "John Doe",
        "icNumber": "990101101234",
        "age": 25,
        "email": "john@example.com",
        "username": "johndoe",
        "status": "active",
        "joinDate": "2024-01-15T10:30:00.000Z",
        "ranking": {
          "points": 1250,
          "position": 15
        }
      }
    ],
    "pagination": {
      "current": 1,
      "pages": 10,
      "total": 195
    }
  }
}
```

---

## 🔧 Utility Endpoints

### 11. Check IC Number Availability
**GET** `/api/check-ic/:icNumber`

Check if an IC number is available for registration.

#### URL Parameters
- `icNumber`: 12-digit IC number

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "icNumber": "990101101234",
    "available": false,
    "isPlayerRegistered": true,
    "isInRegistrationSystem": false
  }
}
```

#### Error Responses
- **400**: Invalid IC number format

---

### 12. API Health Check
**GET** `/api/health`

Check if the API is running properly.

#### Success Response (200)
```json
{
  "success": true,
  "message": "API is running",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

---

## 📚 Usage Examples

### Example 1: Complete Player Registration Flow

```javascript
// 1. Check IC availability
const icCheck = await fetch('/api/check-ic/990101101234');
const icResult = await icCheck.json();

if (icResult.data.available) {
  // 2. Register player
  const registration = await fetch('/api/player/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fullName: "John Doe",
      icNumber: "990101101234",
      age: 25,
      address: "123 Main Street, Kuala Lumpur",
      phoneNumber: "+60123456789",
      email: "john@example.com",
      username: "johndoe",
      password: "SecurePass123"
    })
  });
  
  const result = await registration.json();
  console.log('Registration ID:', result.data.registrationId);
}
```

### Example 2: Admin Approval Workflow

```javascript
// 1. Admin login
const login = await fetch('/api/admin/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: "admin",
    password: "password123"
  })
});

// 2. Get pending registrations
const pending = await fetch('/api/admin/registrations/pending');
const registrations = await pending.json();

// 3. Approve a registration
const approve = await fetch(`/api/admin/registrations/${registrationId}/approve`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    notes: "All documents verified"
  })
});
```

### Example 3: Player Profile Access

```javascript
// 1. Player login
const login = await fetch('/api/player/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: "johndoe",
    password: "SecurePass123"
  })
});

// 2. Get profile
const profile = await fetch('/api/player/profile');
const playerData = await profile.json();
console.log('Player ID:', playerData.data.player.playerId);
```

---

## 🚨 Error Codes

| Code | Description |
|------|-------------|
| 400  | Bad Request - Invalid input data |
| 401  | Unauthorized - Authentication required |
| 403  | Forbidden - Access denied |
| 404  | Not Found - Resource not found |
| 409  | Conflict - Resource already exists |
| 423  | Locked - Account temporarily locked |
| 429  | Too Many Requests - Rate limit exceeded |
| 500  | Internal Server Error - Server error |

---

## 🔒 Security Features

1. **Rate Limiting**: 100 requests per 15 minutes per IP
2. **Input Validation**: All inputs are validated and sanitized
3. **Password Security**: Passwords are hashed using bcrypt
4. **Session Management**: Secure session-based authentication
5. **Account Locking**: Failed login attempts trigger account locks
6. **SQL Injection Protection**: MongoDB and validation prevent injection attacks
7. **XSS Protection**: Input sanitization prevents cross-site scripting

---

## 🚀 Getting Started

1. Start the server: `node server-new.js`
2. API will be available at: `http://localhost:3000/api`
3. Use the health check endpoint to verify: `GET /api/health`
4. Refer to examples above for implementation

For any questions or issues, please refer to the main documentation or contact the development team. 