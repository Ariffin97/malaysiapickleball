import { apiClient } from './api';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.isAuthenticated = false;
  }

  // Initialize auth state (call this on app startup)
  async initialize() {
    try {
      const token = await apiClient.getToken();
      const userData = await apiClient.getUserData();
      
      if (token && userData) {
        this.currentUser = userData;
        this.isAuthenticated = true;
        
        // Verify token is still valid
        const isValid = await this.verifyToken();
        if (!isValid) {
          await this.logout();
        }
      }
      
      return this.isAuthenticated;
    } catch (error) {
      console.error('Auth initialization error:', error);
      await this.logout();
      return false;
    }
  }

  // Login function
  async login(credentials) {
    try {
      const { username, password } = credentials;

      // Validate input
      if (!username || !password) {
        return {
          success: false,
          message: 'Username and password are required.',
        };
      }

      // Make login request
      const response = await apiClient.post('/auth/player/login', {
        username: username.trim(),
        password,
      });

      // Handle successful login
      if (response.success && response.token) {
        // Store token and user data
        await apiClient.setToken(response.token);
        await apiClient.setUserData(response.user);
        
        // Update local state
        this.currentUser = response.user;
        this.isAuthenticated = true;

        return {
          success: true,
          message: response.message || 'Login successful!',
          user: response.user,
          token: response.token,
        };
      } else {
        return {
          success: false,
          message: response.message || 'Login failed.',
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.message || 'Login failed. Please try again.',
      };
    }
  }

  // Register function
  async register(userData) {
    try {
      const { username, password, confirmPassword, email, fullName, phone } = userData;

      // Validate input
      const validation = this.validateRegistrationData(userData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message,
        };
      }

      // Make registration request
      const response = await apiClient.post('/auth/player/register', {
        username: username.trim(),
        password,
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        phone: phone?.trim(),
      });

      // Handle successful registration
      if (response.success) {
        return {
          success: true,
          message: response.message || 'Registration successful! Please login.',
          user: response.user,
        };
      } else {
        return {
          success: false,
          message: response.message || 'Registration failed.',
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error.message || 'Registration failed. Please try again.',
      };
    }
  }

  // Logout function
  async logout() {
    try {
      // Try to logout from server
      if (this.isAuthenticated) {
        await apiClient.post('/auth/player/logout');
      }
    } catch (error) {
      console.error('Logout request error:', error);
      // Continue with local logout even if server request fails
    } finally {
      // Clear local storage and state
      await apiClient.clearStorage();
      this.currentUser = null;
      this.isAuthenticated = false;
    }

    return {
      success: true,
      message: 'Logged out successfully.',
    };
  }

  // Verify token validity
  async verifyToken() {
    try {
      const response = await apiClient.get('/auth/player/status');
      return response.success && response.authenticated;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  // Get current user profile
  async getCurrentUser() {
    try {
      if (!this.isAuthenticated) {
        return {
          success: false,
          message: 'User not authenticated.',
        };
      }

      const response = await apiClient.get('/mobile/player/me');
      
      if (response.success && response.player) {
        // Update stored user data
        await apiClient.setUserData(response.player);
        this.currentUser = response.player;
        
        return {
          success: true,
          user: response.player,
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to get user data.',
        };
      }
    } catch (error) {
      console.error('Get current user error:', error);
      
      // If unauthorized, logout
      if (error.code === 'UNAUTHORIZED') {
        await this.logout();
      }
      
      return {
        success: false,
        message: error.message || 'Failed to get user data.',
      };
    }
  }

  // Update user profile
  async updateProfile(profileData) {
    try {
      if (!this.isAuthenticated) {
        return {
          success: false,
          message: 'User not authenticated.',
        };
      }

      const response = await apiClient.put('/player/profile', profileData);
      
      if (response.success) {
        // Refresh user data
        await this.getCurrentUser();
        
        return {
          success: true,
          message: response.message || 'Profile updated successfully!',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to update profile.',
        };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        message: error.message || 'Failed to update profile.',
      };
    }
  }

  // Upload profile picture
  async uploadProfilePicture(imageFile) {
    try {
      if (!this.isAuthenticated) {
        return {
          success: false,
          message: 'User not authenticated.',
        };
      }

      const response = await apiClient.uploadFile('/player/profile/picture', imageFile);
      
      if (response.success) {
        // Refresh user data to get new profile picture URL
        await this.getCurrentUser();
        
        return {
          success: true,
          message: response.message || 'Profile picture updated successfully!',
          profilePictureUrl: response.profilePictureUrl,
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to upload profile picture.',
        };
      }
    } catch (error) {
      console.error('Upload profile picture error:', error);
      return {
        success: false,
        message: error.message || 'Failed to upload profile picture.',
      };
    }
  }

  // Forgot password
  async forgotPassword(email) {
    try {
      if (!email) {
        return {
          success: false,
          message: 'Email is required.',
        };
      }

      const response = await apiClient.post('/auth/player/forgot-password', {
        email: email.trim().toLowerCase(),
      });

      return {
        success: response.success,
        message: response.message || (response.success 
          ? 'Password reset instructions sent to your email.' 
          : 'Failed to send password reset email.'),
      };
    } catch (error) {
      console.error('Forgot password error:', error);
      return {
        success: false,
        message: error.message || 'Failed to process password reset request.',
      };
    }
  }

  // Reset password
  async resetPassword(token, newPassword, confirmPassword) {
    try {
      if (!token || !newPassword || !confirmPassword) {
        return {
          success: false,
          message: 'All fields are required.',
        };
      }

      if (newPassword !== confirmPassword) {
        return {
          success: false,
          message: 'Passwords do not match.',
        };
      }

      if (newPassword.length < 8) {
        return {
          success: false,
          message: 'Password must be at least 8 characters long.',
        };
      }

      const response = await apiClient.post('/auth/player/reset-password', {
        token,
        newPassword,
      });

      return {
        success: response.success,
        message: response.message || (response.success 
          ? 'Password reset successfully! Please login with your new password.' 
          : 'Failed to reset password.'),
      };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        message: error.message || 'Failed to reset password.',
      };
    }
  }

  // Validate registration data
  validateRegistrationData(userData) {
    const { username, password, confirmPassword, email, fullName } = userData;

    if (!username || username.trim().length < 3) {
      return {
        isValid: false,
        message: 'Username must be at least 3 characters long.',
      };
    }

    if (!password || password.length < 8) {
      return {
        isValid: false,
        message: 'Password must be at least 8 characters long.',
      };
    }

    if (password !== confirmPassword) {
      return {
        isValid: false,
        message: 'Passwords do not match.',
      };
    }

    if (!email || !this.isValidEmail(email)) {
      return {
        isValid: false,
        message: 'Please enter a valid email address.',
      };
    }

    if (!fullName || fullName.trim().length < 2) {
      return {
        isValid: false,
        message: 'Full name must be at least 2 characters long.',
      };
    }

    return {
      isValid: true,
      message: 'Validation passed.',
    };
  }

  // Email validation helper
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // Get auth state
  getAuthState() {
    return {
      isAuthenticated: this.isAuthenticated,
      user: this.currentUser,
    };
  }

  // Check if user is authenticated
  isLoggedIn() {
    return this.isAuthenticated && this.currentUser;
  }
}

// Export singleton instance
export const authService = new AuthService(); 