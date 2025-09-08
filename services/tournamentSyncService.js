const mongoose = require('mongoose');

class TournamentSyncService {
  constructor() {
    this.portalConnection = null;
    this.mainConnection = null;
    this.Tournament = null;
    this.TournamentApplication = null;
    this.setupConnections();
  }

  setupConnections() {
    try {
      // Create separate connection to portal database
      this.portalConnection = mongoose.createConnection(
        'mongodb://localhost:27017/malaysia-pickleball-portal-dev'
      );

      // Create separate connection to main database
      this.mainConnection = mongoose.createConnection(
        'mongodb://localhost:27017/malaysia-pickleball-dev'
      );

      // Define tournament application schema for portal database
      const tournamentApplicationSchema = new mongoose.Schema({
        applicationId: String,
        organiserName: String,
        registrationNo: String,
        telContact: String,
        email: String,
        organisingPartner: String,
        eventTitle: String,
        eventStartDate: Date,
        eventEndDate: Date,
        state: String,
        city: String,
        venue: String,
        classification: String,
        expectedParticipants: Number,
        eventSummary: String,
        scoringFormat: String,
        dataConsent: Boolean,
        termsConsent: Boolean,
        status: String,
        remarks: String,
        submissionDate: Date,
        lastUpdated: Date,
        createdAt: Date,
        updatedAt: Date
      });

      // Define tournament schema for main database
      const tournamentSchema = new mongoose.Schema({
        name: { type: String, required: true, trim: true },
        startDate: { type: Date, required: false },
        endDate: { type: Date, required: false },
        type: { type: String, required: true, enum: ['local', 'state', 'national', 'international', 'sarawak', 'wmalaysia'] },
        months: [{ type: Number, min: 0, max: 11 }],
        image: { type: String, required: false },
        color: { type: String, required: false },
        description: { type: String, required: false },
        location: { type: String, required: false },
        venue: { type: String, required: false, trim: true },
        city: { type: String, required: false, trim: true },
        organizer: { type: String, required: false, trim: true },
        personInCharge: { type: String, required: false, trim: true },
        phoneNumber: { type: String, required: false, trim: true },
        registrationOpen: { type: Boolean, default: true },
        lastModifiedBy: { type: String, required: false },
        version: { type: Number, default: 0 },
        
        // Portal sync fields
        syncedFromPortal: { type: Boolean, default: false },
        portalApplicationId: { type: String, required: false, unique: true, sparse: true },
        portalSyncDate: { type: Date, required: false },
        lastPortalUpdate: { type: Date, required: false },
        
        // Additional fields for synced tournaments
        state: { type: String, required: false },
        maxParticipants: { type: Number, required: false },
        contactEmail: { type: String, required: false },
        contactPhone: { type: String, required: false },
        status: { type: String, enum: ['upcoming', 'ongoing', 'completed', 'cancelled'], default: 'upcoming' }
      }, {
        timestamps: true,
        optimisticConcurrency: true
      });

      this.TournamentApplication = this.portalConnection.model('tournamentapplications', tournamentApplicationSchema);
      this.Tournament = this.mainConnection.model('Tournament', tournamentSchema);

      console.log('✅ Portal and main database connections established for tournament sync');
    } catch (error) {
      console.error('❌ Failed to setup database connections:', error);
    }
  }

  async getApprovedTournaments() {
    try {
      if (!this.TournamentApplication) {
        throw new Error('Portal database connection not available');
      }

      // Fetch approved tournaments from portal
      const approvedApplications = await this.TournamentApplication.find({
        status: 'Approved'
      }).sort({ submissionDate: -1 });

      console.log(`📋 Found ${approvedApplications.length} approved tournaments in portal`);
      return approvedApplications;
    } catch (error) {
      console.error('❌ Error fetching approved tournaments from portal:', error);
      throw error;
    }
  }

  mapPortalToMainTournament(portalTournament) {
    // Map portal tournament application fields to main tournament schema
    const mappedData = {
      // Basic tournament info - ensure required fields are present
      name: portalTournament.eventTitle || 'Untitled Tournament',
      startDate: portalTournament.eventStartDate,
      endDate: portalTournament.eventEndDate,
      location: portalTournament.city,
      venue: portalTournament.venue,
      state: portalTournament.state,
      type: this.mapClassificationToType(portalTournament.classification),
      organizer: portalTournament.organiserName,
      description: portalTournament.eventSummary,
      
      // Contact information
      contactEmail: portalTournament.email,
      contactPhone: portalTournament.telContact,
      phoneNumber: portalTournament.telContact,
      
      // Tournament details
      maxParticipants: portalTournament.expectedParticipants,
      registrationOpen: portalTournament.status === 'Approved',
      status: this.mapPortalStatusToTournamentStatus(portalTournament.status),
      
      // Complete MPA Portal fields
      registrationNo: portalTournament.registrationNo,
      organisingPartner: portalTournament.organisingPartner,
      classification: portalTournament.classification,
      eventSummary: portalTournament.eventSummary,
      scoringFormat: portalTournament.scoringFormat,
      portalStatus: portalTournament.status,
      submissionDate: portalTournament.submissionDate,
      portalRemarks: portalTournament.remarks,
      
      // Management flags
      managedByPortal: true,
      syncedFromPortal: true,
      lastModifiedBy: 'mpa-portal',
      portalApplicationId: portalTournament.applicationId,
      portalSyncDate: new Date(),
      lastPortalUpdate: portalTournament.lastUpdated,
      
      // Set visibility to live for approved tournaments
      visibility: 'live'
    };

    // Validate required fields before returning
    if (!mappedData.name || mappedData.name.trim() === '') {
      mappedData.name = 'Untitled Tournament';
    }
    
    // Ensure type is valid
    const validTypes = ['local', 'state', 'national', 'international', 'sarawak', 'wmalaysia'];
    if (!validTypes.includes(mappedData.type)) {
      console.warn(`⚠️  Invalid tournament type '${mappedData.type}', defaulting to 'local'`);
      mappedData.type = 'local';
    }

    return mappedData;
  }

  mapPortalStatusToTournamentStatus(portalStatus) {
    // Map portal status to tournament status
    const mapping = {
      'Approved': 'upcoming',
      'Published': 'upcoming', 
      'Ongoing': 'ongoing',
      'Completed': 'completed',
      'Cancelled': 'cancelled'
    };
    return mapping[portalStatus] || 'upcoming';
  }

  mapClassificationToType(classification) {
    // Map portal classification to main tournament types
    const mapping = {
      'District': 'local',
      'State': 'state', 
      'National': 'national',
      'International': 'wmalaysia'
    };
    return mapping[classification] || 'local';
  }

  async handleDeletedTournaments(approvedTournaments) {
    try {
      console.log('🔍 Checking for deleted/rejected tournaments...');
      
      // Get all portal application IDs from approved tournaments
      const approvedPortalIds = new Set(
        approvedTournaments.map(t => t.applicationId).filter(Boolean)
      );
      
      // Find all portal-managed tournaments in the main database
      const portalManagedTournaments = await this.Tournament.find({
        $or: [
          { managedByPortal: true },
          { syncedFromPortal: true },
          { portalApplicationId: { $exists: true, $ne: null } }
        ]
      });

      // Also check all tournaments that might have lost their portal connection
      // but still exist in main database with similar names to previously synced tournaments
      const allTournamentsInMain = await this.Tournament.find({
        visibility: 'live' // Only check live tournaments that could have been from portal
      });

      console.log(`📊 Found ${portalManagedTournaments.length} portal-managed tournaments in main database`);
      console.log(`📊 Found ${allTournamentsInMain.length} total live tournaments in main database`);
      console.log(`📊 Found ${approvedPortalIds.size} approved tournaments in portal`);

      // Get all approved tournament names from portal for cross-reference
      const approvedTournamentNames = new Set(
        approvedTournaments.map(t => t.eventTitle.trim().toLowerCase()).filter(Boolean)
      );

      let deletedCount = 0;
      const errors = [];
      
      // Check each portal-managed tournament
      for (const tournament of portalManagedTournaments) {
        try {
          let shouldDelete = false;
          let reason = '';
          
          if (tournament.portalApplicationId && !approvedPortalIds.has(tournament.portalApplicationId)) {
            // Tournament has portal ID but is no longer in approved list
            console.log(`🗑️ Tournament "${tournament.name}" (Portal ID: ${tournament.portalApplicationId}) is no longer approved in portal - checking status...`);
            
            const portalStatus = await this.checkTournamentStatusInPortal(tournament.portalApplicationId);
            
            if (portalStatus && (portalStatus === 'Rejected' || portalStatus === 'Cancelled' || portalStatus === 'Deleted')) {
              shouldDelete = true;
              reason = `Portal status: ${portalStatus}`;
            } else if (!portalStatus) {
              shouldDelete = true;
              reason = 'No longer exists in portal';
            } else {
              console.log(`⚠️ Tournament "${tournament.name}" status in portal: ${portalStatus} - keeping for now`);
            }
          } else if ((tournament.syncedFromPortal || tournament.managedByPortal) && !tournament.portalApplicationId) {
            // Tournament was synced from portal but has no portal ID - check if it exists by name
            console.log(`🔍 Tournament "${tournament.name}" synced from portal but has no portal ID - checking by name...`);
            
            const existsInPortal = await this.checkTournamentExistsByName(tournament.name);
            if (!existsInPortal) {
              shouldDelete = true;
              reason = 'No longer exists in portal (checked by name)';
            }
          }
          
          if (shouldDelete) {
            await this.Tournament.findByIdAndDelete(tournament._id);
            console.log(`✅ Deleted tournament "${tournament.name}" - ${reason}`);
            deletedCount++;
          }
        } catch (error) {
          console.error(`❌ Error processing tournament ${tournament.name}:`, error.message);
          errors.push({
            tournament: tournament.name,
            error: error.message,
            action: 'deletion_check'
          });
        }
      }

      // Also check tournaments that might have lost portal connection
      for (const tournament of allTournamentsInMain) {
        // Skip if already processed in portal-managed loop
        if (portalManagedTournaments.some(pm => pm._id.equals(tournament._id))) {
          continue;
        }
        
        try {
          const tournamentNameLower = tournament.name.trim().toLowerCase();
          
          // If this live tournament doesn't exist in approved portal list
          if (!approvedTournamentNames.has(tournamentNameLower)) {
            console.log(`🔍 Tournament "${tournament.name}" not found in approved portal list - checking if it existed in portal...`);
            
            // Check if this tournament name ever existed in portal (even if deleted/rejected)
            const existedInPortal = await this.checkTournamentExistsByName(tournament.name);
            
            if (!existedInPortal) {
              // This tournament doesn't exist in portal at all anymore
              // It might have been deleted from portal but lost its portal connection flags
              console.log(`🗑️ Tournament "${tournament.name}" appears to have been deleted from portal - removing...`);
              
              await this.Tournament.findByIdAndDelete(tournament._id);
              console.log(`✅ Deleted tournament "${tournament.name}" - No longer exists in portal (name-based check)`);
              deletedCount++;
            }
          }
        } catch (error) {
          console.error(`❌ Error processing non-portal tournament ${tournament.name}:`, error.message);
          errors.push({
            tournament: tournament.name,
            error: error.message,
            action: 'name_based_deletion_check'
          });
        }
      }

      console.log(`🗑️ Deletion check completed: ${deletedCount} tournaments deleted`);
      
      return {
        deletedCount,
        errors
      };
      
    } catch (error) {
      console.error('❌ Error checking for deleted tournaments:', error);
      return {
        deletedCount: 0,
        errors: [{ error: error.message, action: 'deletion_check' }]
      };
    }
  }

  async checkTournamentStatusInPortal(applicationId) {
    try {
      const tournament = await this.TournamentApplication.findOne({ applicationId });
      return tournament ? tournament.status : null;
    } catch (error) {
      console.error(`❌ Error checking portal status for ${applicationId}:`, error);
      return null;
    }
  }

  async checkTournamentExistsByName(tournamentName) {
    try {
      const tournament = await this.TournamentApplication.findOne({ 
        eventTitle: { $regex: new RegExp(`^${tournamentName.trim()}$`, 'i') }
      });
      return tournament !== null;
    } catch (error) {
      console.error(`❌ Error checking tournament existence by name ${tournamentName}:`, error);
      return false;
    }
  }

  async syncTournaments() {
    try {
      console.log('🔄 Starting tournament sync process...');

      // Get approved tournaments from portal
      const approvedTournaments = await this.getApprovedTournaments();
      
      // Check for deleted/rejected tournaments and remove them
      const deletionResult = await this.handleDeletedTournaments(approvedTournaments);
      
      if (approvedTournaments.length === 0) {
        console.log('ℹ️  No approved tournaments found in portal');
        return { 
          synced: 0, 
          skipped: 0, 
          deleted: deletionResult.deletedCount,
          errors: deletionResult.errors 
        };
      }

      let syncedCount = 0;
      let skippedCount = 0;
      const errors = [...deletionResult.errors];

      for (const portalTournament of approvedTournaments) {
        try {
          // Check if tournament already exists in main database
          let existingTournament = await this.Tournament.findOne({
            portalApplicationId: portalTournament.applicationId
          });

          // If not found by Portal ID, try to find by name (for tournaments missing Portal ID)
          if (!existingTournament) {
            existingTournament = await this.Tournament.findOne({
              name: portalTournament.eventTitle
            });
            
            // If found by name but missing Portal ID, link them
            if (existingTournament) {
              console.log(`🔗 Linking existing tournament "${portalTournament.eventTitle}" with Portal ID ${portalTournament.applicationId}`);
              await this.Tournament.findByIdAndUpdate(existingTournament._id, {
                portalApplicationId: portalTournament.applicationId,
                managedByPortal: true,
                syncedFromPortal: true,
                lastModifiedBy: 'mpa-portal'
              });
            }
          }

          if (existingTournament) {
            // Check if portal tournament was updated after last sync
            if (portalTournament.lastUpdated > existingTournament.lastPortalUpdate) {
              // Update existing tournament
              const updatedData = this.mapPortalToMainTournament(portalTournament);
              await this.Tournament.findByIdAndUpdate(existingTournament._id, updatedData);
              console.log(`✅ Updated tournament: ${portalTournament.eventTitle}`);
              syncedCount++;
            } else {
              console.log(`⏭️  Skipped (no changes): ${portalTournament.eventTitle}`);
              skippedCount++;
            }
          } else {
            // Create new tournament
            const tournamentData = this.mapPortalToMainTournament(portalTournament);
            const newTournament = new this.Tournament(tournamentData);
            await newTournament.save();
            console.log(`✅ Created new tournament: ${portalTournament.eventTitle}`);
            syncedCount++;
          }
        } catch (error) {
          console.error(`❌ Error syncing tournament ${portalTournament.eventTitle}:`, error);
          console.error('📋 Portal tournament data:', JSON.stringify(portalTournament, null, 2));
          
          if (error.name === 'ValidationError') {
            console.error('🚫 Mongoose validation errors:', error.errors);
            for (let field in error.errors) {
              console.error(`  - ${field}: ${error.errors[field].message}`);
            }
          }
          
          errors.push({
            tournament: portalTournament.eventTitle,
            error: error.message,
            validationErrors: error.name === 'ValidationError' ? error.errors : null
          });
        }
      }

      console.log(`🔄 Sync completed: ${syncedCount} synced, ${skippedCount} skipped, ${deletionResult.deletedCount} deleted, ${errors.length} errors`);
      
      return {
        synced: syncedCount,
        skipped: skippedCount,
        deleted: deletionResult.deletedCount,
        errors: errors,
        totalProcessed: approvedTournaments.length
      };

    } catch (error) {
      console.error('❌ Tournament sync failed:', error);
      throw error;
    }
  }

  async cleanup() {
    try {
      if (this.portalConnection) {
        await this.portalConnection.close();
        console.log('✅ Portal database connection closed');
      }
      if (this.mainConnection) {
        await this.mainConnection.close();
        console.log('✅ Main database connection closed');
      }
    } catch (error) {
      console.error('❌ Error closing database connections:', error);
    }
  }
}

module.exports = TournamentSyncService;