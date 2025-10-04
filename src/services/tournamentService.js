// Tournament Service - handles all tournament CRUD operations with MPA Portal
const PORTAL_API_URL = import.meta.env.VITE_PORTAL_API_URL || 'http://localhost:5001/api';

class TournamentService {
  /**
   * Fetch all approved tournaments from MPA Portal
   */
  async getApprovedTournaments() {
    try {
      const response = await fetch(`${PORTAL_API_URL}/approved-tournaments`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Map portal data to our format
      return data.map(tournament => this.mapPortalToLocal(tournament));
    } catch (error) {
      console.error('Error fetching approved tournaments:', error);
      throw error;
    }
  }

  /**
   * Get a single tournament by ID
   */
  async getTournamentById(applicationId) {
    try {
      const response = await fetch(`${PORTAL_API_URL}/applications/${applicationId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.mapPortalToLocal(data);
    } catch (error) {
      console.error('Error fetching tournament:', error);
      throw error;
    }
  }

  /**
   * Create a new tournament (bi-directional - creates in portal)
   */
  async createTournament(tournamentData) {
    try {
      const portalData = this.mapLocalToPortal(tournamentData);

      const response = await fetch(`${PORTAL_API_URL}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(portalData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.mapPortalToLocal(data);
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }
  }

  /**
   * Update an existing tournament (bi-directional - updates in portal)
   */
  async updateTournament(applicationId, tournamentData) {
    try {
      const portalData = this.mapLocalToPortal(tournamentData);

      const response = await fetch(`${PORTAL_API_URL}/applications/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(portalData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return this.mapPortalToLocal(data.application || data);
    } catch (error) {
      console.error('Error updating tournament:', error);
      throw error;
    }
  }

  /**
   * Delete a tournament (bi-directional - deletes from portal)
   */
  async deleteTournament(applicationId) {
    try {
      const response = await fetch(`${PORTAL_API_URL}/applications/${applicationId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting tournament:', error);
      throw error;
    }
  }

  /**
   * Map portal tournament data to local format
   */
  mapPortalToLocal(tournament) {
    // Determine tournament type based on classification
    const getTypeFromClassification = (classification) => {
      const typeMap = {
        'District': 'local',
        'Divisional': 'local',
        'State': 'state',
        'National': 'national',
        'International': 'international'
      };
      return typeMap[classification] || 'local';
    };

    // Determine color based on type
    const getColorFromType = (type) => {
      const colorMap = {
        'local': 'green',
        'state': 'red',
        'national': 'blue',
        'international': 'orange'
      };
      return colorMap[type] || 'blue';
    };

    const type = getTypeFromClassification(tournament.classification);

    return {
      id: tournament.applicationId,
      applicationId: tournament.applicationId,
      name: tournament.eventTitle,
      type: type,
      color: getColorFromType(type),
      startDate: tournament.eventStartDate,
      endDate: tournament.eventEndDate,
      venue: tournament.venue,
      city: tournament.city,
      state: tournament.state,
      organizer: tournament.organiserName,
      personInCharge: tournament.personInCharge || tournament.organiserName,
      phoneNumber: tournament.telContact,
      contactEmail: tournament.email,
      description: tournament.eventSummary,
      classification: tournament.classification,
      eventType: tournament.eventType,
      expectedParticipants: tournament.expectedParticipants,
      categories: tournament.categories,
      scoringFormat: tournament.scoringFormat,
      status: tournament.status,
      submissionDate: tournament.submissionDate,
      // Original portal data
      _original: tournament
    };
  }

  /**
   * Map local tournament data to portal format
   */
  mapLocalToPortal(tournament) {
    // Determine classification based on type
    const getClassificationFromType = (type) => {
      const classMap = {
        'local': 'District',
        'state': 'State',
        'national': 'National',
        'international': 'International'
      };
      return classMap[type] || 'District';
    };

    return {
      eventTitle: tournament.name,
      eventStartDate: tournament.startDate,
      eventEndDate: tournament.endDate,
      venue: tournament.venue,
      city: tournament.city,
      state: tournament.state,
      organiserName: tournament.organizer,
      personInCharge: tournament.personInCharge,
      telContact: tournament.phoneNumber,
      email: tournament.contactEmail,
      eventSummary: tournament.description,
      classification: getClassificationFromType(tournament.type),
      eventType: tournament.eventType || 'Open',
      expectedParticipants: tournament.expectedParticipants || 100,
      categories: tournament.categories || [],
      scoringFormat: tournament.scoringFormat || 'traditional',
      dataConsent: true,
      termsConsent: true,
      status: 'Approved',
      createdByAdmin: true
    };
  }
}

export default new TournamentService();
