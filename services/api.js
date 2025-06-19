import AsyncStorage from '@react-native-async-storage/async-storage';

// API Configuration
export const API_CONFIG = {
  BASE_URL: 'https://malaysiapickleball-fbab5112dbaf.herokuapp.com/api',
  TIMEOUT: 15000,
  HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
};

// Storage Keys
export const STORAGE_KEYS = {
  JWT_TOKEN: '@picklezone_jwt_token',
  USER_DATA: '@picklezone_user_data',
  REFRESH_TOKEN: '@picklezone_refresh_token',
};

// API Client Class
class ApiClient {
  constructor() {
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
  }

  // Get stored JWT token
  async getToken() {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.JWT_TOKEN);
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  // Store JWT token
  async setToken(token) {
    try {
      if (token) {
        await AsyncStorage.setItem(STORAGE_KEYS.JWT_TOKEN, token);
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.JWT_TOKEN);
      }
    } catch (error) {
      console.error('Error storing token:', error);
    }
  }

  // Get stored user data
  async getUserData() {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  }

  // Store user data
  async setUserData(userData) {
    try {
      if (userData) {
        await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      }
    } catch (error) {
      console.error('Error storing user data:', error);
    }
  }

  // Clear all stored data
  async clearStorage() {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.JWT_TOKEN,
        STORAGE_KEYS.USER_DATA,
        STORAGE_KEYS.REFRESH_TOKEN,
      ]);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }

  // Make authenticated request
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = await this.getToken();

    // Default headers
    const headers = {
      ...API_CONFIG.HEADERS,
      ...options.headers,
    };

    // Add authorization header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Request configuration
    const config = {
      method: options.method || 'GET',
      headers,
      ...options,
    };

    // Add body for POST/PUT requests
    if (options.body && typeof options.body === 'object') {
      config.body = JSON.stringify(options.body);
    } else if (options.body) {
      config.body = options.body;
    }

    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), this.timeout);
      });

      // Make request with timeout
      const response = await Promise.race([
        fetch(url, config),
        timeoutPromise,
      ]);

      // Handle response
      const responseData = await this.handleResponse(response);
      return responseData;

    } catch (error) {
      console.error('API Request Error:', error);
      throw this.handleError(error);
    }
  }

  // Handle API response
  async handleResponse(response) {
    const contentType = response.headers.get('content-type');
    
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  }

  // Handle API errors
  handleError(error) {
    if (error.message === 'Request timeout') {
      return {
        success: false,
        message: 'Request timed out. Please check your internet connection.',
        code: 'TIMEOUT'
      };
    }

    if (error.message.includes('Network request failed')) {
      return {
        success: false,
        message: 'Network error. Please check your internet connection.',
        code: 'NETWORK_ERROR'
      };
    }

    if (error.message.includes('401')) {
      return {
        success: false,
        message: 'Authentication failed. Please login again.',
        code: 'UNAUTHORIZED'
      };
    }

    return {
      success: false,
      message: error.message || 'An unexpected error occurred.',
      code: 'UNKNOWN_ERROR'
    };
  }

  // GET request
  async get(endpoint, headers = {}) {
    return this.makeRequest(endpoint, { method: 'GET', headers });
  }

  // POST request
  async post(endpoint, body, headers = {}) {
    return this.makeRequest(endpoint, { method: 'POST', body, headers });
  }

  // PUT request
  async put(endpoint, body, headers = {}) {
    return this.makeRequest(endpoint, { method: 'PUT', body, headers });
  }

  // DELETE request
  async delete(endpoint, headers = {}) {
    return this.makeRequest(endpoint, { method: 'DELETE', headers });
  }

  // Upload file (for profile pictures)
  async uploadFile(endpoint, file, additionalData = {}) {
    const token = await this.getToken();
    const formData = new FormData();
    
    // Add file to form data
    formData.append('profilePicture', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || 'profile.jpg',
    });

    // Add additional data
    Object.keys(additionalData).forEach(key => {
      formData.append(key, additionalData[key]);
    });

    const headers = {
      'Content-Type': 'multipart/form-data',
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    return this.makeRequest(endpoint, {
      method: 'POST',
      body: formData,
      headers,
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(); 