# 📱 PickleZone Mobile App - API Integration Guide

This guide will help you integrate the Malaysia Pickleball backend API with your PickleZone mobile app.

## 🔗 Backend Connection

**API Base URL:** `https://malaysiapickleball-fbab5112dbaf.herokuapp.com/api`

Your Malaysia Pickleball backend is now live and ready to serve your mobile app!

---

## 📦 Required Dependencies

First, install the required dependencies in your PickleZone project:

```bash
npm install @react-native-async-storage/async-storage
# or
yarn add @react-native-async-storage/async-storage
```

For iOS, also run:
```bash
cd ios && pod install
```

---

## 🚀 Quick Setup

### 1. Copy the Service Files

Copy these files to your PickleZone project:

```
your-picklezone-project/
├── services/
│   ├── api.js
│   ├── authService.js
│   ├── gameService.js
│   └── index.js
├── examples/
│   └── AuthExamples.js
└── API_INTEGRATION_GUIDE.md
```

### 2. Initialize Authentication in App.js

```javascript
// App.js
import React, { useEffect, useState } from 'react';
import { authService } from './services';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      const authInitialized = await authService.initialize();
      setIsAuthenticated(authInitialized);
    } catch (error) {
      console.error('App initialization error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return isAuthenticated ? <MainApp /> : <AuthStack />;
}
```

---

## 🔐 Authentication Usage

### Login Example

```javascript
import { authService } from './services';

const handleLogin = async (username, password) => {
  const result = await authService.login({ username, password });
  
  if (result.success) {
    console.log('Login successful:', result.user);
    // Navigate to main app
  } else {
    console.log('Login failed:', result.message);
    // Show error message
  }
};
```

### Register Example

```javascript
import { authService } from './services';

const handleRegister = async (userData) => {
  const result = await authService.register({
    username: 'johndoe',
    password: 'securepassword',
    confirmPassword: 'securepassword',
    email: 'john@example.com',
    fullName: 'John Doe',
    phone: '+1234567890', // optional
  });
  
  if (result.success) {
    console.log('Registration successful');
    // Navigate to login screen
  } else {
    console.log('Registration failed:', result.message);
  }
};
```

### Logout Example

```javascript
const handleLogout = async () => {
  const result = await authService.logout();
  console.log('Logged out successfully');
  // Navigate to login screen
};
```

---

## 👤 Profile Management

### Get Current User

```javascript
import { authService } from './services';

const loadUserProfile = async () => {
  const result = await authService.getCurrentUser();
  
  if (result.success) {
    console.log('User data:', result.user);
    setUser(result.user);
  }
};
```

### Update Profile

```javascript
const updateProfile = async (profileData) => {
  const result = await authService.updateProfile({
    fullName: 'John Doe Updated',
    email: 'newemail@example.com',
    phone: '+9876543210',
  });
  
  if (result.success) {
    console.log('Profile updated successfully');
  }
};
```

### Upload Profile Picture

```javascript
const uploadProfilePicture = async (imageFile) => {
  const result = await authService.uploadProfilePicture({
    uri: imageFile.uri,
    type: 'image/jpeg',
    name: 'profile.jpg',
  });
  
  if (result.success) {
    console.log('Profile picture uploaded:', result.profilePictureUrl);
  }
};
```

---

## 🏆 Game Data Usage

### Get Tournaments

```javascript
import { gameService } from './services';

const loadTournaments = async () => {
  const result = await gameService.getTournaments({
    status: 'upcoming',
    limit: 10,
  });
  
  if (result.success) {
    console.log('Tournaments:', result.tournaments);
    setTournaments(result.tournaments);
  }
};
```

### Get Rankings

```javascript
const loadRankings = async () => {
  const result = await gameService.getRankings({
    category: 'men_singles',
    limit: 20,
  });
  
  if (result.success) {
    console.log('Rankings:', result.rankings);
    setRankings(result.rankings);
  }
};
```

### Get Messages

```javascript
const loadMessages = async () => {
  const result = await gameService.getMessages();
  
  if (result.success) {
    console.log('Messages:', result.messages);
    setMessages(result.messages);
  }
};
```

---

## 🛠️ Advanced Features

### Check Authentication Status

```javascript
import { authService } from './services';

// Check if user is logged in
const isLoggedIn = authService.isLoggedIn();

// Get full auth state
const authState = authService.getAuthState();
console.log('Auth state:', authState);
```

### Handle API Errors

```javascript
const makeAPICall = async () => {
  try {
    const result = await authService.login({ username, password });
    
    if (!result.success) {
      // Handle specific error codes
      switch (result.code) {
        case 'UNAUTHORIZED':
          // Redirect to login
          break;
        case 'NETWORK_ERROR':
          // Show network error message
          break;
        case 'TIMEOUT':
          // Show timeout message
          break;
        default:
          // Show general error
          break;
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
};
```

### Custom API Calls

```javascript
import { apiClient } from './services';

// Make custom authenticated API calls
const customAPICall = async () => {
  try {
    const response = await apiClient.get('/custom-endpoint');
    console.log('Response:', response);
  } catch (error) {
    console.error('API Error:', error);
  }
};
```

---

## 📱 React Native Integration Tips

### 1. Navigation Integration

```javascript
// With React Navigation
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

const AuthStack = createStackNavigator();
const MainStack = createStackNavigator();

function AuthNavigator() {
  return (
    <AuthStack.Navigator>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
    </AuthStack.Navigator>
  );
}
```

### 2. State Management

```javascript
// With Context API
import React, { createContext, useContext, useReducer } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = async (credentials) => {
    const result = await authService.login(credentials);
    if (result.success) {
      dispatch({ type: 'LOGIN_SUCCESS', payload: result.user });
    }
    return result;
  };

  return (
    <AuthContext.Provider value={{ ...state, login }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 3. Error Handling

```javascript
// Global error handler
const GlobalErrorHandler = (error) => {
  if (error.code === 'UNAUTHORIZED') {
    // Auto logout and redirect to login
    authService.logout();
    // Navigate to login screen
  }
  
  // Log error for debugging
  console.error('Global error:', error);
};
```

---

## 🔒 Security Best Practices

1. **Always validate user input** before sending to API
2. **Handle JWT token expiration** gracefully
3. **Store sensitive data securely** using AsyncStorage
4. **Implement proper error handling** for network issues
5. **Use HTTPS only** for API calls (already configured)

---

## 🚀 Available API Endpoints

### Authentication Endpoints
- `POST /auth/player/login` - Login
- `POST /auth/player/register` - Register  
- `POST /auth/player/logout` - Logout
- `GET /auth/player/status` - Check auth status
- `POST /auth/player/forgot-password` - Forgot password
- `POST /auth/player/reset-password` - Reset password

### Profile Endpoints
- `GET /mobile/player/me` - Get current user
- `PUT /player/profile` - Update profile
- `POST /player/profile/picture` - Upload profile picture

### Game Data Endpoints
- `GET /mobile/tournaments` - Get tournaments
- `GET /mobile/rankings` - Get rankings
- `GET /mobile/player/messages` - Get messages
- `GET /mobile/player/dashboard` - Get dashboard stats

---

## 🐛 Troubleshooting

### Common Issues

**1. "Network request failed"**
- Check internet connection
- Verify API URL is correct
- Check if backend is running

**2. "Authentication failed"**
- Check if JWT token is stored correctly
- Verify token hasn't expired
- Re-login if necessary

**3. "AsyncStorage not found"**
- Install @react-native-async-storage/async-storage
- Run `pod install` for iOS

### Debug Mode

Enable debug logging:

```javascript
// In development, add this to see API requests
if (__DEV__) {
  console.log('API Request:', url, config);
}
```

---

## 🎯 Next Steps

1. **Copy the service files** to your PickleZone project
2. **Install AsyncStorage** dependency
3. **Update your App.js** with authentication initialization
4. **Create login/register screens** using the examples
5. **Test the API connection** with your backend
6. **Build your app features** using the game services

Your Malaysia Pickleball backend is ready to power your PickleZone mobile app! 🚀

---

## 📞 Support

If you encounter any issues:

1. Check the Heroku logs: `heroku logs --tail --app malaysiapickleball`
2. Verify your API calls match the expected format
3. Test endpoints using a tool like Postman first

**Backend URL:** https://malaysiapickleball-fbab5112dbaf.herokuapp.com/  
**API Base:** https://malaysiapickleball-fbab5112dbaf.herokuapp.com/api 