const axios = require('axios');

class ReverseSyncService {
  constructor() {
    this.portalBaseUrl = 'http://localhost:5001'; // MPA Portal API URL
    this.timeout = 10000; // 10 seconds timeout
  }

  // Map Malaysia Pickleball tournament to Portal API format
  mapWebsiteToPortalFormat(tournament) {
    return {
      // Basic tournament info
      eventTitle: tournament.name,
      eventStartDate: tournament.startDate,
      eventEndDate: tournament.endDate,
      
      // Location info
      state: tournament.state || 'Kuala Lumpur',
      city: tournament.city || tournament.location || 'Kuala Lumpur',
      venue: tournament.venue || 'TBA',
      
      // Organization info  
      organiserName: tournament.organizer || 'Malaysia Pickleball Association',
      registrationNo: tournament.registrationNo || 'MPA-AUTO',
      telContact: tournament.phoneNumber || tournament.contactPhone || '+60-11-1234567',
      email: tournament.contactEmail || 'tournaments@malaysiapickleballassociation.org',
      organisingPartner: tournament.organisingPartner || '',
      
      // Tournament details
      classification: this.mapTypeToClassification(tournament.type),
      expectedParticipants: tournament.maxParticipants || 100,
      eventSummary: tournament.description || tournament.eventSummary || 'Tournament managed via Malaysia Pickleball website',
      scoringFormat: tournament.scoringFormat || 'traditional',
      
      // Approval info - auto-approve website tournaments
      status: 'Approved',
      dataConsent: true,
      termsConsent: true,
      remarks: 'Synced from Malaysia Pickleball website',
      
      // Timestamps
      lastUpdated: new Date()
    };
  }

  mapTypeToClassification(type) {
    const mapping = {
      'local': 'District',
      'state': 'State',
      'national': 'National', 
      'international': 'International',
      'sarawak': 'State',
      'wmalaysia': 'International'
    };
    return mapping[type] || 'District';
  }

  // Create new tournament in portal via HTTP API
  async createTournamentInPortal(tournament) {
    try {
      console.log(`🔄 Creating tournament "${tournament.name}" in portal via HTTP API...`);

      // Check if tournament already has portal ID (shouldn't create)
      if (tournament.portalApplicationId) {
        console.log(`⚠️  Tournament already has Portal ID: ${tournament.portalApplicationId}, skipping creation`);
        return { success: true, applicationId: tournament.portalApplicationId, action: 'skipped_existing' };
      }

      const portalData = this.mapWebsiteToPortalFormat(tournament);
      
      // Create tournament in portal using correct registration endpoint
      const response = await axios.post(
        `${this.portalBaseUrl}/api/register/tournament`,
        { tournament: tournament },  // Wrap in tournament field as expected by Portal
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: this.timeout
        }
      );

      if (response.data && response.data.applicationId) {
        console.log(`✅ Created tournament in portal: ${response.data.applicationId}`);
        return { 
          success: true, 
          applicationId: response.data.applicationId, 
          action: 'created',
          portalData: response.data
        };
      } else {
        throw new Error('Portal did not return application ID');
      }

    } catch (error) {
      console.error(`❌ Failed to create tournament in portal:`, error.message);
      
      // Log detailed error information for debugging
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Response data:`, error.response.data);
      }
      
      // If HTTP API fails, log and continue (don't break the website)
      return { 
        success: false, 
        error: error.message, 
        action: 'failed_creation',
        details: error.response?.data,
        fallbackNeeded: true
      };
    }
  }

  // Update existing tournament in portal via HTTP API
  async updateTournamentInPortal(tournament) {
    try {
      if (!tournament.portalApplicationId) {
        console.log(`⚠️  Tournament "${tournament.name}" has no Portal ID, cannot update`);
        return { success: false, error: 'No Portal ID for update' };
      }

      console.log(`🔄 Updating tournament "${tournament.name}" in portal (ID: ${tournament.portalApplicationId})...`);

      const portalData = this.mapWebsiteToPortalFormat(tournament);
      
      // Update tournament in portal using the correct endpoint
      const response = await axios.put(
        `${this.portalBaseUrl}/api/sync/tournament/update/${tournament.portalApplicationId}`,
        { tournamentData: tournament },  // Wrap in tournamentData as expected by Portal
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: this.timeout
        }
      );

      if (response.status === 200) {
        console.log(`✅ Updated tournament in portal: ${tournament.portalApplicationId}`);
        return { 
          success: true, 
          applicationId: tournament.portalApplicationId, 
          action: 'updated',
          portalData: response.data
        };
      } else {
        throw new Error(`Portal returned status ${response.status}`);
      }

    } catch (error) {
      console.error(`❌ Failed to update tournament in portal:`, error.message);
      
      // Log detailed error information for debugging
      if (error.response) {
        console.error(`   Status: ${error.response.status}`);
        console.error(`   Response data:`, error.response.data);
      }
      
      // If specific tournament not found, it might have been deleted from portal
      if (error.response && error.response.status === 404) {
        console.log(`⚠️  Tournament not found in portal, might have been deleted`);
        return { success: false, error: 'Tournament not found in portal', action: 'not_found' };
      }
      
      return { 
        success: false, 
        error: error.message, 
        action: 'failed_update',
        details: error.response?.data
      };
    }
  }

  // Delete tournament in portal (mark as cancelled)
  async deleteTournamentInPortal(tournamentId, portalApplicationId = null) {
    try {
      if (!portalApplicationId) {
        console.log(`⚠️  No Portal ID provided for tournament deletion`);
        return { success: false, error: 'No Portal ID for deletion' };
      }

      console.log(`🔄 Deleting tournament in portal (Portal ID: ${portalApplicationId})...`);

      const response = await axios.delete(
        `${this.portalBaseUrl}/api/sync/tournament/${portalApplicationId}`,
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: this.timeout
        }
      );

      if (response.status === 200) {
        console.log(`✅ Deleted tournament from portal: ${portalApplicationId}`);
        return { 
          success: true, 
          applicationId: portalApplicationId, 
          action: 'deleted'
        };
      }

    } catch (error) {
      console.error(`❌ Failed to delete tournament from portal:`, error.message);
      
      if (error.response && error.response.status === 404) {
        console.log(`⚠️  Tournament not found in portal, already deleted`);
        return { success: true, action: 'already_deleted' };
      }
      
      return { 
        success: false, 
        error: error.message, 
        action: 'failed_deletion'
      };
    }
  }

  // Main sync method - decides whether to create or update
  async syncTournamentToPortal(tournament, action = 'auto') {
    try {
      // Auto-determine action if not specified
      if (action === 'auto') {
        action = tournament.portalApplicationId ? 'update' : 'create';
      }

      console.log(`🔄 Reverse sync: ${action} action for tournament "${tournament.name}"`);

      // Skip if tournament originated from portal
      if (tournament.managedByPortal && tournament.syncedFromPortal) {
        console.log(`⏭️  Tournament "${tournament.name}" is managed by portal, skipping reverse sync`);
        return { success: true, action: 'skipped_portal_managed' };
      }

      let result;
      switch (action) {
        case 'create':
          result = await this.createTournamentInPortal(tournament);
          break;
        case 'update':
          result = await this.updateTournamentInPortal(tournament);
          break;
        case 'delete':
          result = await this.deleteTournamentInPortal(tournament._id, tournament.portalApplicationId);
          break;
        default:
          throw new Error(`Unknown sync action: ${action}`);
      }

      return result;

    } catch (error) {
      console.error(`❌ Reverse sync error for tournament "${tournament.name}":`, error.message);
      return { 
        success: false, 
        error: error.message, 
        action: 'failed_sync'
      };
    }
  }

  // Test connection to portal
  async testPortalConnection() {
    try {
      console.log('🧪 Testing connection to MPA Portal...');
      
      const response = await axios.get(
        `${this.portalBaseUrl}/api/sync/status`,
        { timeout: this.timeout }
      );

      if (response.status === 200) {
        console.log('✅ Portal connection successful');
        return { success: true, data: response.data };
      }

    } catch (error) {
      console.error('❌ Portal connection failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  // Get portal sync status
  async getPortalSyncStatus() {
    try {
      const response = await axios.get(
        `${this.portalBaseUrl}/api/sync/status`,
        { timeout: this.timeout }
      );

      return { success: true, status: response.data };
    } catch (error) {
      console.error('❌ Failed to get portal sync status:', error.message);
      return { success: false, error: error.message };
    }
  }
}

module.exports = ReverseSyncService;