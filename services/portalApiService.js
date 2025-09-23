const axios = require('axios');

class PortalApiService {
  constructor(config = {}) {
    this.baseURL = config.portalUrl || 'http://localhost:5001/api';
    this.apiKey = config.apiKey || '';
    this.timeout = (config.timeout || 10) * 1000; // Convert to milliseconds
  }

  // Get headers for API requests
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add API key if provided
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return headers;
  }

  // Fetch all approved tournaments from portal
  async getTournaments() {
    try {
      console.log('🔄 Fetching approved tournaments from new portal API...');
      console.log('🔗 URL:', `${this.baseURL}/approved-tournaments`);
      console.log('🔑 Headers:', this.getHeaders());
      
      const response = await axios.get(`${this.baseURL}/approved-tournaments`, {
        headers: this.getHeaders(),
        timeout: this.timeout
      });
      
      console.log('📡 Axios response received, status:', response.status);

      if (response.status === 200) {
        // New API returns array of approved tournament applications directly
        const tournaments = Array.isArray(response.data) ? response.data : [];
        console.log(`✅ Retrieved ${tournaments.length} approved tournaments from new portal`);
        return {
          success: true,
          tournaments: tournaments,
          count: tournaments.length
        };
      } else {
        throw new Error(`Unexpected response: ${response.status}`);
      }

    } catch (error) {
      console.error('❌ New Portal API error details:');
      console.error('- Error message:', error.message);
      console.error('- Error code:', error.code);
      console.error('- Request URL:', `${this.baseURL}/approved-tournaments`);
      console.error('- Headers:', this.getHeaders());
      
      // Handle specific errors
      if (error.response) {
        const status = error.response.status;
        console.error('- Response status:', status);
        console.error('- Response data:', error.response.data);
        if (status === 404) {
          throw new Error('Approved tournaments endpoint not found');
        } else if (status === 429) {
          throw new Error('Rate limit exceeded');
        } else if (status >= 500) {
          throw new Error(`Portal server error: ${status} - ${error.response.statusText}`);
        } else {
          throw new Error(`Portal API error: ${status} - ${error.response.statusText}`);
        }
      } else if (error.code === 'ECONNREFUSED') {
        throw new Error(`Cannot connect to new portal server (Connection refused to ${this.baseURL})`);
      } else if (error.code === 'ENOTFOUND') {
        throw new Error(`Cannot connect to new portal server (Host not found: ${this.baseURL})`);
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Portal request timeout');
      } else {
        throw new Error(`Portal connection error: ${error.message} (Code: ${error.code})`);
      }
    }
  }

  // Fetch all organizations from new portal
  async getOrganizations() {
    try {
      console.log('🔄 Fetching organizations from new portal API...');
      
      const response = await axios.get(`${this.baseURL}/organizations`, {
        headers: this.getHeaders(),
        timeout: this.timeout
      });

      if (response.status === 200) {
        const organizations = Array.isArray(response.data) ? response.data : [];
        console.log(`✅ Retrieved ${organizations.length} organizations from new portal`);
        return {
          success: true,
          organizations: organizations,
          count: organizations.length
        };
      } else {
        throw new Error(`Unexpected response: ${response.status}`);
      }

    } catch (error) {
      console.error('❌ New Portal API error (organizations):', error.message);
      throw error;
    }
  }

  // Test new API connection
  async testConnection() {
    try {
      console.log('🧪 Testing new portal API connection...');
      
      // Test the health endpoint first
      const healthResponse = await axios.get(`${this.baseURL}/health`, {
        headers: this.getHeaders(),
        timeout: this.timeout
      });
      
      if (healthResponse.status === 200) {
        console.log('✅ New portal API connection successful');
        return {
          success: true,
          message: 'New portal API connection successful',
          apiStatus: healthResponse.data
        };
      } else {
        throw new Error(`Health check failed: ${healthResponse.status}`);
      }

    } catch (error) {
      console.error('❌ New portal API connection test failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Create tournament application using new API
  async createApplication(applicationData) {
    try {
      console.log('🔄 Creating tournament application in new portal...');
      
      const response = await axios.post(`${this.baseURL}/applications`, applicationData, {
        headers: this.getHeaders(),
        timeout: this.timeout
      });

      if (response.status === 200 || response.status === 201) {
        console.log('✅ Tournament application created successfully in new portal');
        return {
          success: true,
          application: response.data
        };
      } else {
        throw new Error(`Unexpected response: ${response.status}`);
      }

    } catch (error) {
      console.error('❌ Error creating tournament application in new portal:', error.message);
      throw error;
    }
  }
}

module.exports = PortalApiService;