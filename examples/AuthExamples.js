import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { authService } from '../services';

// Example Login Screen Component
export const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password) {
      Alert.alert('Error', 'Please enter both username and password');
      return;
    }

    setLoading(true);
    try {
      const result = await authService.login({ username, password });
      
      if (result.success) {
        Alert.alert('Success', result.message);
        // Navigate to main app
        navigation.replace('MainTabs');
      } else {
        Alert.alert('Login Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PickleZone Login</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoCapitalize="none"
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleLogin}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.linkButton}
        onPress={() => navigation.navigate('RegisterScreen')}
      >
        <Text style={styles.linkText}>Don't have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
};

// Example Register Screen Component
export const RegisterScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    fullName: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    try {
      const result = await authService.register(formData);
      
      if (result.success) {
        Alert.alert('Success', result.message);
        navigation.navigate('LoginScreen');
      } else {
        Alert.alert('Registration Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={formData.fullName}
        onChangeText={(value) => updateField('fullName', value)}
        autoCapitalize="words"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={formData.username}
        onChangeText={(value) => updateField('username', value)}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={formData.email}
        onChangeText={(value) => updateField('email', value)}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <TextInput
        style={styles.input}
        placeholder="Phone (Optional)"
        value={formData.phone}
        onChangeText={(value) => updateField('phone', value)}
        keyboardType="phone-pad"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={formData.password}
        onChangeText={(value) => updateField('password', value)}
        secureTextEntry
        autoCapitalize="none"
      />
      
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        value={formData.confirmPassword}
        onChangeText={(value) => updateField('confirmPassword', value)}
        secureTextEntry
        autoCapitalize="none"
      />
      
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creating Account...' : 'Register'}
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.linkButton}
        onPress={() => navigation.navigate('LoginScreen')}
      >
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
};

// Example App initialization with auth check
export const AppInitializer = ({ children }) => {
  const [isReady, setIsReady] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Initialize authentication
      const authInitialized = await authService.initialize();
      setIsAuthenticated(authInitialized);
      
      // App is ready
      setIsReady(true);
    } catch (error) {
      console.error('App initialization error:', error);
      setIsReady(true);
    }
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading PickleZone...</Text>
      </View>
    );
  }

  return children;
};

// Example Profile Screen with update functionality
export const ProfileScreen = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const result = await authService.getCurrentUser();
      if (result.success) {
        setUser(result.user);
        setFormData({
          fullName: result.user.fullName || '',
          email: result.user.email || '',
          phone: result.user.phone || '',
        });
      }
    } catch (error) {
      console.error('Load user data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    try {
      const result = await authService.updateProfile(formData);
      if (result.success) {
        Alert.alert('Success', result.message);
        setEditing(false);
        await loadUserData();
      } else {
        Alert.alert('Update Failed', result.message);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await authService.logout();
            // Navigate to login screen or restart app
          },
        },
      ]
    );
  };

  if (loading && !user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profile</Text>
      
      {!editing ? (
        <>
          <Text style={styles.label}>Username: {user?.username}</Text>
          <Text style={styles.label}>Full Name: {user?.fullName}</Text>
          <Text style={styles.label}>Email: {user?.email}</Text>
          <Text style={styles.label}>Phone: {user?.phone || 'Not provided'}</Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => setEditing(true)}
          >
            <Text style={styles.buttonText}>Edit Profile</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            value={formData.fullName}
            onChangeText={(value) => setFormData(prev => ({ ...prev, fullName: value }))}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={formData.email}
            onChangeText={(value) => setFormData(prev => ({ ...prev, email: value }))}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Phone"
            value={formData.phone}
            onChangeText={(value) => setFormData(prev => ({ ...prev, phone: value }))}
          />
          
          <TouchableOpacity 
            style={styles.button}
            onPress={handleUpdateProfile}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.linkButton}
            onPress={() => setEditing(false)}
          >
            <Text style={styles.linkText}>Cancel</Text>
          </TouchableOpacity>
        </>
      )}
      
      <TouchableOpacity 
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Text style={[styles.buttonText, styles.logoutText]}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    marginBottom: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    alignItems: 'center',
    padding: 10,
  },
  linkText: {
    color: '#007AFF',
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 10,
    color: '#333',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    marginTop: 20,
  },
  logoutText: {
    color: 'white',
  },
}); 