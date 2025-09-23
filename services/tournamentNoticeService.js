const DatabaseService = require('./databaseService');
const Tournament = require('../models/Tournament');
const TournamentNotice = require('../models/TournamentNotice');

class TournamentNoticeService {
  /**
   * Automatically generates tournament notices when tournament data changes
   */
  static async generateAutomaticNotices(tournamentId, originalData, updatedData, modifiedBy = 'system') {
    try {
      const notices = [];
      const tournament = await Tournament.findById(tournamentId);
      
      if (!tournament) {
        console.error('Tournament not found for notice generation:', tournamentId);
        return [];
      }

      // Check for date changes
      if (this.hasDateChanged(originalData, updatedData)) {
        const dateNotice = await this.createDateChangeNotice(tournament, originalData, updatedData, modifiedBy);
        if (dateNotice) notices.push(dateNotice);
      }

      // Check for venue changes
      if (this.hasVenueChanged(originalData, updatedData)) {
        const venueNotice = await this.createVenueChangeNotice(tournament, originalData, updatedData, modifiedBy);
        if (venueNotice) notices.push(venueNotice);
      }

      // Check for name changes
      if (this.hasNameChanged(originalData, updatedData)) {
        const nameNotice = await this.createNameChangeNotice(tournament, originalData, updatedData, modifiedBy);
        if (nameNotice) notices.push(nameNotice);
      }

      // Check for organizer changes
      if (this.hasOrganizerChanged(originalData, updatedData)) {
        const organizerNotice = await this.createOrganizerChangeNotice(tournament, originalData, updatedData, modifiedBy);
        if (organizerNotice) notices.push(organizerNotice);
      }

      // Check for contact changes
      if (this.hasContactChanged(originalData, updatedData)) {
        const contactNotice = await this.createContactChangeNotice(tournament, originalData, updatedData, modifiedBy);
        if (contactNotice) notices.push(contactNotice);
      }

      console.log(`Generated ${notices.length} automatic notices for tournament: ${tournament.name}`);
      return notices;

    } catch (error) {
      console.error('Error generating automatic notices:', error);
      return [];
    }
  }

  /**
   * Check if tournament dates have changed
   */
  static hasDateChanged(originalData, updatedData) {
    const originalStart = originalData.startDate ? new Date(originalData.startDate).toISOString() : null;
    const updatedStart = updatedData.startDate ? new Date(updatedData.startDate).toISOString() : null;
    const originalEnd = originalData.endDate ? new Date(originalData.endDate).toISOString() : null;
    const updatedEnd = updatedData.endDate ? new Date(updatedData.endDate).toISOString() : null;

    return originalStart !== updatedStart || originalEnd !== updatedEnd;
  }

  /**
   * Check if venue has changed
   */
  static hasVenueChanged(originalData, updatedData) {
    return originalData.venue !== updatedData.venue || originalData.city !== updatedData.city;
  }

  /**
   * Check if tournament name has changed
   */
  static hasNameChanged(originalData, updatedData) {
    return originalData.name !== updatedData.name;
  }

  /**
   * Check if organizer has changed
   */
  static hasOrganizerChanged(originalData, updatedData) {
    return originalData.organizer !== updatedData.organizer;
  }

  /**
   * Check if contact information has changed
   */
  static hasContactChanged(originalData, updatedData) {
    return originalData.personInCharge !== updatedData.personInCharge || 
           originalData.phoneNumber !== updatedData.phoneNumber;
  }

  /**
   * Create date change notice
   */
  static async createDateChangeNotice(tournament, originalData, updatedData, modifiedBy) {
    try {
      const originalDateStr = this.formatDateRange(originalData.startDate, originalData.endDate);
      const newDateStr = this.formatDateRange(updatedData.startDate, updatedData.endDate);

      const noticeData = {
        title: `Date Change: ${tournament.name}`,
        tournamentName: tournament.name,
        type: 'date_change',
        priority: 'high',
        message: `The tournament dates have been updated. Please note the new schedule.`,
        details: {
          originalDate: originalDateStr,
          newDate: newDateStr,
          reason: 'Schedule adjustment'
        },
        status: 'active',
        createdBy: modifiedBy
      };

      const notice = await DatabaseService.createTournamentNotice(noticeData);
      console.log('✅ Created date change notice:', notice.title);
      return notice;
    } catch (error) {
      console.error('Error creating date change notice:', error);
      return null;
    }
  }

  /**
   * Create venue change notice
   */
  static async createVenueChangeNotice(tournament, originalData, updatedData, modifiedBy) {
    try {
      const originalVenue = this.formatVenue(originalData.venue, originalData.city);
      const newVenue = this.formatVenue(updatedData.venue, updatedData.city);

      const noticeData = {
        title: `Venue Change: ${tournament.name}`,
        tournamentName: tournament.name,
        type: 'venue_change',
        priority: 'high',
        message: `The tournament venue has been changed. Please update your travel plans accordingly.`,
        details: {
          originalVenue: originalVenue,
          newVenue: newVenue,
          reason: 'Venue update'
        },
        status: 'active',
        createdBy: modifiedBy
      };

      const notice = await DatabaseService.createTournamentNotice(noticeData);
      console.log('✅ Created venue change notice:', notice.title);
      return notice;
    } catch (error) {
      console.error('Error creating venue change notice:', error);
      return null;
    }
  }

  /**
   * Create tournament name change notice
   */
  static async createNameChangeNotice(tournament, originalData, updatedData, modifiedBy) {
    try {
      const noticeData = {
        title: `Tournament Name Updated`,
        tournamentName: updatedData.name, // Use the new name
        type: 'general',
        priority: 'medium',
        message: `The tournament "${originalData.name}" has been renamed to "${updatedData.name}". All other details remain the same.`,
        details: {
          reason: 'Tournament name update'
        },
        status: 'active',
        createdBy: modifiedBy
      };

      const notice = await DatabaseService.createTournamentNotice(noticeData);
      console.log('✅ Created name change notice:', notice.title);
      return notice;
    } catch (error) {
      console.error('Error creating name change notice:', error);
      return null;
    }
  }

  /**
   * Create organizer change notice
   */
  static async createOrganizerChangeNotice(tournament, originalData, updatedData, modifiedBy) {
    try {
      const noticeData = {
        title: `Organizer Update: ${tournament.name}`,
        tournamentName: tournament.name,
        type: 'general',
        priority: 'medium',
        message: `The tournament organizer has been updated from "${originalData.organizer || 'TBA'}" to "${updatedData.organizer || 'TBA'}".`,
        details: {
          reason: 'Organizer information update'
        },
        status: 'active',
        createdBy: modifiedBy
      };

      const notice = await DatabaseService.createTournamentNotice(noticeData);
      console.log('✅ Created organizer change notice:', notice.title);
      return notice;
    } catch (error) {
      console.error('Error creating organizer change notice:', error);
      return null;
    }
  }

  /**
   * Create contact change notice
   */
  static async createContactChangeNotice(tournament, originalData, updatedData, modifiedBy) {
    try {
      const contactChanges = [];
      
      if (originalData.personInCharge !== updatedData.personInCharge) {
        contactChanges.push(`Contact person: ${originalData.personInCharge || 'TBA'} → ${updatedData.personInCharge || 'TBA'}`);
      }
      
      if (originalData.phoneNumber !== updatedData.phoneNumber) {
        contactChanges.push(`Phone: ${originalData.phoneNumber || 'TBA'} → ${updatedData.phoneNumber || 'TBA'}`);
      }

      const noticeData = {
        title: `Contact Update: ${tournament.name}`,
        tournamentName: tournament.name,
        type: 'general',
        priority: 'medium',
        message: `Tournament contact information has been updated: ${contactChanges.join(', ')}`,
        details: {
          reason: 'Contact information update'
        },
        status: 'active',
        createdBy: modifiedBy
      };

      const notice = await DatabaseService.createTournamentNotice(noticeData);
      console.log('✅ Created contact change notice:', notice.title);
      return notice;
    } catch (error) {
      console.error('Error creating contact change notice:', error);
      return null;
    }
  }

  /**
   * Create cancellation notice
   */
  static async createCancellationNotice(tournament, reason, modifiedBy = 'system') {
    try {
      const noticeData = {
        title: `CANCELLED: ${tournament.name}`,
        tournamentName: tournament.name,
        type: 'cancellation',
        priority: 'urgent',
        message: `This tournament has been cancelled. We apologize for any inconvenience caused.`,
        details: {
          reason: reason || 'Tournament cancelled'
        },
        status: 'active',
        createdBy: modifiedBy
      };

      const notice = await DatabaseService.createTournamentNotice(noticeData);
      console.log('✅ Created cancellation notice:', notice.title);
      return notice;
    } catch (error) {
      console.error('Error creating cancellation notice:', error);
      return null;
    }
  }

  /**
   * Format date range for display
   */
  static formatDateRange(startDate, endDate) {
    if (!startDate && !endDate) return 'TBA';
    
    const formatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    
    if (startDate && endDate) {
      const start = new Date(startDate).toLocaleDateString('en-US', formatOptions);
      const end = new Date(endDate).toLocaleDateString('en-US', formatOptions);
      return `${start} - ${end}`;
    } else if (startDate) {
      return new Date(startDate).toLocaleDateString('en-US', formatOptions);
    }
    
    return 'TBA';
  }

  /**
   * Format venue for display
   */
  static formatVenue(venue, city) {
    if (!venue && !city) return 'TBA';
    if (!venue) return city;
    if (!city) return venue;
    return `${venue}, ${city}`;
  }

  /**
   * Clean up old automatic notices for a tournament
   */
  static async cleanupOldNotices(tournamentName, maxAge = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAge);

      const result = await TournamentNotice.deleteMany({
        tournamentName: tournamentName,
        createdBy: 'system',
        createdAt: { $lt: cutoffDate }
      });

      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} old automatic notices for: ${tournamentName}`);
      }
    } catch (error) {
      console.error('Error cleaning up old notices:', error);
    }
  }
}

module.exports = TournamentNoticeService;