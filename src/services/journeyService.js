// Journey Service - handles all journey/milestone CRUD operations
// Now uses backend API with Cloudinary storage instead of localStorage

class JourneyService {
  constructor() {
    this.API_URL = import.meta.env.VITE_PORTAL_API_URL || '/api';
  }

  /**
   * Get all milestones sorted by date (chronological order)
   */
  async getAllMilestones() {
    try {
      const response = await fetch(`${this.API_URL}/milestones`);
      if (!response.ok) {
        throw new Error('Failed to fetch milestones');
      }
      const milestones = await response.json();
      // Backend already sorts by date, but ensure it's sorted
      return milestones.sort((a, b) => new Date(a.date) - new Date(b.date));
    } catch (error) {
      console.error('Error fetching milestones:', error);
      return [];
    }
  }

  /**
   * Get a single milestone by ID
   */
  async getMilestoneById(id) {
    try {
      const response = await fetch(`${this.API_URL}/milestones/${id}`);
      if (!response.ok) {
        throw new Error('Milestone not found');
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching milestone:', error);
      throw error;
    }
  }

  /**
   * Create a new milestone
   */
  async createMilestone(milestoneData) {
    try {
      const formData = new FormData();
      formData.append('date', milestoneData.date);
      formData.append('title', milestoneData.title);
      formData.append('description', milestoneData.description);
      if (milestoneData.order !== undefined) {
        formData.append('order', milestoneData.order);
      }
      if (milestoneData.imageFile) {
        formData.append('milestoneImage', milestoneData.imageFile);
      }

      const response = await fetch(`${this.API_URL}/milestones`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create milestone');
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating milestone:', error);
      throw error;
    }
  }

  /**
   * Update an existing milestone
   */
  async updateMilestone(id, updates) {
    try {
      const formData = new FormData();
      if (updates.date) formData.append('date', updates.date);
      if (updates.title) formData.append('title', updates.title);
      if (updates.description) formData.append('description', updates.description);
      if (updates.order !== undefined) formData.append('order', updates.order);
      if (updates.imageFile) formData.append('milestoneImage', updates.imageFile);

      const response = await fetch(`${this.API_URL}/milestones/${id}`, {
        method: 'PATCH',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update milestone');
      }

      return await response.json();
    } catch (error) {
      console.error('Error updating milestone:', error);
      throw error;
    }
  }

  /**
   * Delete a milestone
   */
  async deleteMilestone(id) {
    try {
      const response = await fetch(`${this.API_URL}/milestones/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete milestone');
      }

      return await response.json();
    } catch (error) {
      console.error('Error deleting milestone:', error);
      throw error;
    }
  }

  /**
   * Reorder milestones (update order values)
   */
  async reorderMilestones(orderedIds) {
    try {
      // Update each milestone's order
      const promises = orderedIds.map((id, index) =>
        this.updateMilestone(id, { order: index + 1 })
      );

      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error('Error reordering milestones:', error);
      throw error;
    }
  }
}

export default new JourneyService();
