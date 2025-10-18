// Organizer Service - handles all organizer-related API operations
// Fetches organizers from main backend (which proxies Portal data)

class OrganizerService {
  constructor() {
    // Use main backend API URL (port 3000), not Portal API (port 5001)
    this.API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';
  }

  /**
   * Get all registered organizers from MPA Portal
   */
  async getAllOrganizers() {
    try {
      // Add cache-busting timestamp to force fresh data
      const timestamp = new Date().getTime();
      const response = await fetch(`${this.API_URL}/organizers?_t=${timestamp}`, {
        cache: 'no-store'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch organizers');
      }
      const organizers = await response.json();
      console.log('Organizers from API:', organizers);
      return organizers;
    } catch (error) {
      console.error('Error fetching organizers:', error);
      return [];
    }
  }

  /**
   * Get a single organizer by ID
   */
  async getOrganizerById(id) {
    try {
      const response = await fetch(`${this.API_URL}/organizers/${id}`);
      if (!response.ok) {
        throw new Error('Organizer not found');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching organizer:', error);
      throw error;
    }
  }

  // Note: CREATE/UPDATE/DELETE operations are managed in MPA Portal
  // All changes made in the Portal are automatically reflected here
  // via WebSocket updates and periodic polling

  /**
   * Get WebSocket URL for real-time updates
   */
  getWebSocketURL() {
    // In development, always use localhost:3000 for WebSocket
    // In production, use the same protocol/host as the API
    if (import.meta.env.DEV) {
      return 'ws://localhost:3000/api/organizers/ws';
    }

    const apiUrl = this.API_URL;
    // Convert HTTP/HTTPS URL to WS/WSS
    const wsUrl = apiUrl.replace(/^http/, 'ws');
    return `${wsUrl}/organizers/ws`;
  }
}

export default new OrganizerService();
