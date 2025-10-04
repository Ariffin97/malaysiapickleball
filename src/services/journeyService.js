// Journey Service - handles all journey/milestone CRUD operations
const STORAGE_KEY = 'mpa_journey_milestones';

// Default milestones
const DEFAULT_MILESTONES = [
  {
    id: '1',
    date: '2020-01-01',
    title: 'Foundation',
    description: 'Malaysia Pickleball Association officially established',
    image: null,
    order: 1,
    createdAt: new Date('2020-01-01').toISOString()
  },
  {
    id: '2',
    date: '2021-03-15',
    title: 'First Tournament',
    description: 'Hosted the inaugural National Pickleball Championship',
    image: null,
    order: 2,
    createdAt: new Date('2021-03-15').toISOString()
  },
  {
    id: '3',
    date: '2022-06-20',
    title: 'International Recognition',
    description: 'Joined the Asian Pickleball Federation',
    image: null,
    order: 3,
    createdAt: new Date('2022-06-20').toISOString()
  },
  {
    id: '4',
    date: '2023-09-10',
    title: 'Growth & Expansion',
    description: 'Reached 400,000+ active players across Malaysia',
    image: null,
    order: 4,
    createdAt: new Date('2023-09-10').toISOString()
  },
  {
    id: '5',
    date: '2024-01-15',
    title: 'Future Goals',
    description: 'Aiming to host Southeast Asian Championship',
    image: null,
    order: 5,
    createdAt: new Date('2024-01-15').toISOString()
  }
];

class JourneyService {
  constructor() {
    this.initializeStorage();
  }

  /**
   * Initialize localStorage with default milestones if empty
   */
  initializeStorage() {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_MILESTONES));
    }
  }

  /**
   * Get all milestones sorted by order
   */
  async getAllMilestones() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      const milestones = data ? JSON.parse(data) : DEFAULT_MILESTONES;
      return milestones.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('Error fetching milestones:', error);
      return DEFAULT_MILESTONES;
    }
  }

  /**
   * Get a single milestone by ID
   */
  async getMilestoneById(id) {
    try {
      const milestones = await this.getAllMilestones();
      return milestones.find(m => m.id === id);
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
      const milestones = await this.getAllMilestones();

      const newMilestone = {
        id: Date.now().toString(),
        date: milestoneData.date,
        title: milestoneData.title,
        description: milestoneData.description,
        image: milestoneData.image || null,
        order: milestones.length + 1,
        createdAt: new Date().toISOString()
      };

      milestones.push(newMilestone);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(milestones));

      return newMilestone;
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
      const milestones = await this.getAllMilestones();
      const index = milestones.findIndex(m => m.id === id);

      if (index === -1) {
        throw new Error('Milestone not found');
      }

      milestones[index] = {
        ...milestones[index],
        ...updates,
        id, // Ensure ID doesn't change
        updatedAt: new Date().toISOString()
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(milestones));

      return milestones[index];
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
      const milestones = await this.getAllMilestones();
      const filtered = milestones.filter(m => m.id !== id);

      // Reorder remaining milestones
      const reordered = filtered.map((m, index) => ({
        ...m,
        order: index + 1
      }));

      localStorage.setItem(STORAGE_KEY, JSON.stringify(reordered));

      return { success: true };
    } catch (error) {
      console.error('Error deleting milestone:', error);
      throw error;
    }
  }

  /**
   * Reorder milestones
   */
  async reorderMilestones(orderedIds) {
    try {
      const milestones = await this.getAllMilestones();

      const reordered = orderedIds.map((id, index) => {
        const milestone = milestones.find(m => m.id === id);
        return {
          ...milestone,
          order: index + 1
        };
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(reordered));

      return reordered;
    } catch (error) {
      console.error('Error reordering milestones:', error);
      throw error;
    }
  }

  /**
   * Convert image file to base64 for storage
   */
  async imageToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
}

export default new JourneyService();
