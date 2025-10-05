// Tournament Service - handles all tournament operations via local backend
// Local backend syncs with Portal API bidirectionally
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

class TournamentService {
  /**
   * Fetch all approved tournaments (from local backend)
   */
  async getApprovedTournaments(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.state) params.append('state', filters.state);
      if (filters.type) params.append('type', filters.type);
      if (filters.upcoming) params.append('upcoming', 'true');

      const url = `${API_BASE_URL}/tournaments${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching approved tournaments:', error);
      throw error;
    }
  }

  /**
   * Get a single tournament by ID (from local backend)
   */
  async getTournamentById(applicationId) {
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/${applicationId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching tournament:', error);
      throw error;
    }
  }

  /**
   * Sync tournaments from Portal API
   * This should be called periodically or triggered by admin action
   */
  async syncFromPortal() {
    try {
      const response = await fetch(`${API_BASE_URL}/tournaments/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error syncing from portal:', error);
      throw error;
    }
  }

  /**
   * Get upcoming tournaments
   */
  async getUpcomingTournaments() {
    return this.getApprovedTournaments({ upcoming: true });
  }

  /**
   * Get tournaments by state
   */
  async getTournamentsByState(state) {
    return this.getApprovedTournaments({ state });
  }

  /**
   * Get tournaments by type
   */
  async getTournamentsByType(type) {
    return this.getApprovedTournaments({ type });
  }

  /**
   * Check backend health
   */
  async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      return await response.json();
    } catch (error) {
      console.error('Error checking health:', error);
      throw error;
    }
  }
}

export default new TournamentService();
