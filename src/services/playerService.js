const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

const playerService = {
  // Get all players with rankings
  getRankings: async (filters = {}) => {
    try {
      const queryParams = new URLSearchParams();

      // Add filters if provided
      if (filters.gender) queryParams.append('gender', filters.gender);
      if (filters.eventType) queryParams.append('eventType', filters.eventType);
      if (filters.ageGroup) queryParams.append('ageGroup', filters.ageGroup);
      if (filters.skillLevel) queryParams.append('skillLevel', filters.skillLevel);
      if (filters.state) queryParams.append('state', filters.state);
      if (filters.limit) queryParams.append('limit', filters.limit);

      const response = await fetch(`${API_BASE_URL}/players/rankings?${queryParams}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching rankings:', error);
      throw error;
    }
  },

  // Get player by ID
  getPlayerById: async (playerId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/players/${playerId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching player:', error);
      throw error;
    }
  }
};

export default playerService;
