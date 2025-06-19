import { apiClient } from './api';

class GameService {
  constructor() {
    this.tournaments = [];
    this.rankings = [];
    this.messages = [];
  }

  // Get all tournaments
  async getTournaments(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      if (filters.status) queryParams.append('status', filters.status);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/mobile/tournaments?${queryString}` : '/mobile/tournaments';
      
      const response = await apiClient.get(endpoint);
      
      if (response.success) {
        this.tournaments = response.tournaments || [];
        return {
          success: true,
          tournaments: this.tournaments,
          pagination: response.pagination,
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to fetch tournaments.',
          tournaments: [],
        };
      }
    } catch (error) {
      console.error('Get tournaments error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch tournaments.',
        tournaments: [],
      };
    }
  }

  // Get tournament details
  async getTournamentDetails(tournamentId) {
    try {
      if (!tournamentId) {
        return {
          success: false,
          message: 'Tournament ID is required.',
        };
      }

      const response = await apiClient.get(`/tournaments/${tournamentId}`);
      
      if (response.success) {
        return {
          success: true,
          tournament: response.tournament,
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to fetch tournament details.',
        };
      }
    } catch (error) {
      console.error('Get tournament details error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch tournament details.',
      };
    }
  }

  // Register for tournament
  async registerForTournament(tournamentId, registrationData = {}) {
    try {
      if (!tournamentId) {
        return {
          success: false,
          message: 'Tournament ID is required.',
        };
      }

      const response = await apiClient.post(`/tournaments/${tournamentId}/register`, registrationData);
      
      if (response.success) {
        return {
          success: true,
          message: response.message || 'Successfully registered for tournament!',
          registration: response.registration,
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to register for tournament.',
        };
      }
    } catch (error) {
      console.error('Tournament registration error:', error);
      return {
        success: false,
        message: error.message || 'Failed to register for tournament.',
      };
    }
  }

  // Get player rankings
  async getRankings(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/mobile/rankings?${queryString}` : '/mobile/rankings';
      
      const response = await apiClient.get(endpoint);
      
      if (response.success) {
        this.rankings = response.rankings || [];
        return {
          success: true,
          rankings: this.rankings,
          pagination: response.pagination,
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to fetch rankings.',
          rankings: [],
        };
      }
    } catch (error) {
      console.error('Get rankings error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch rankings.',
        rankings: [],
      };
    }
  }

  // Get player messages
  async getMessages(filters = {}) {
    try {
      const queryParams = new URLSearchParams();
      
      // Add filters to query params
      if (filters.type) queryParams.append('type', filters.type);
      if (filters.limit) queryParams.append('limit', filters.limit);
      if (filters.page) queryParams.append('page', filters.page);

      const queryString = queryParams.toString();
      const endpoint = queryString ? `/mobile/player/messages?${queryString}` : '/mobile/player/messages';
      
      const response = await apiClient.get(endpoint);
      
      if (response.success) {
        this.messages = response.messages || [];
        return {
          success: true,
          messages: this.messages,
          pagination: response.pagination,
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to fetch messages.',
          messages: [],
        };
      }
    } catch (error) {
      console.error('Get messages error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch messages.',
        messages: [],
      };
    }
  }

  // Mark message as read
  async markMessageAsRead(messageId) {
    try {
      if (!messageId) {
        return {
          success: false,
          message: 'Message ID is required.',
        };
      }

      const response = await apiClient.put(`/player/messages/${messageId}/read`);
      
      if (response.success) {
        // Update local messages array
        this.messages = this.messages.map(msg => 
          msg._id === messageId ? { ...msg, read: true } : msg
        );
        
        return {
          success: true,
          message: 'Message marked as read.',
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to mark message as read.',
        };
      }
    } catch (error) {
      console.error('Mark message as read error:', error);
      return {
        success: false,
        message: error.message || 'Failed to mark message as read.',
      };
    }
  }

  // Send message to admin
  async sendMessage(messageData) {
    try {
      const { subject, message, type = 'general' } = messageData;

      if (!subject || !message) {
        return {
          success: false,
          message: 'Subject and message are required.',
        };
      }

      const response = await apiClient.post('/player/messages', {
        subject: subject.trim(),
        message: message.trim(),
        type,
      });
      
      if (response.success) {
        return {
          success: true,
          message: response.message || 'Message sent successfully!',
          messageId: response.messageId,
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to send message.',
        };
      }
    } catch (error) {
      console.error('Send message error:', error);
      return {
        success: false,
        message: error.message || 'Failed to send message.',
      };
    }
  }

  // Get dashboard stats
  async getDashboardStats() {
    try {
      const response = await apiClient.get('/mobile/player/dashboard');
      
      if (response.success) {
        return {
          success: true,
          stats: response.stats,
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to fetch dashboard stats.',
          stats: null,
        };
      }
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      return {
        success: false,
        message: error.message || 'Failed to fetch dashboard stats.',
        stats: null,
      };
    }
  }

  // Search players
  async searchPlayers(searchQuery, filters = {}) {
    try {
      if (!searchQuery || searchQuery.trim().length < 2) {
        return {
          success: false,
          message: 'Search query must be at least 2 characters long.',
          players: [],
        };
      }

      const queryParams = new URLSearchParams();
      queryParams.append('q', searchQuery.trim());
      
      // Add filters
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.limit) queryParams.append('limit', filters.limit);

      const response = await apiClient.get(`/players/search?${queryParams.toString()}`);
      
      if (response.success) {
        return {
          success: true,
          players: response.players || [],
          pagination: response.pagination,
        };
      } else {
        return {
          success: false,
          message: response.message || 'Failed to search players.',
          players: [],
        };
      }
    } catch (error) {
      console.error('Search players error:', error);
      return {
        success: false,
        message: error.message || 'Failed to search players.',
        players: [],
      };
    }
  }

  // Get cached data
  getCachedTournaments() {
    return this.tournaments;
  }

  getCachedRankings() {
    return this.rankings;
  }

  getCachedMessages() {
    return this.messages;
  }

  // Clear cached data
  clearCache() {
    this.tournaments = [];
    this.rankings = [];
    this.messages = [];
  }
}

// Export singleton instance
export const gameService = new GameService(); 