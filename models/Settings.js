const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  category: {
    type: String,
    enum: ['general', 'appearance', 'email', 'security', 'tournament', 'player'],
    default: 'general'
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  modifiedBy: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

// Static method to get setting by key
settingsSchema.statics.getSetting = async function(key, defaultValue = null) {
  try {
    const setting = await this.findOne({ key });
    return setting ? setting.value : defaultValue;
  } catch (error) {
    console.error('Error getting setting:', error);
    return defaultValue;
  }
};

// Static method to set setting
settingsSchema.statics.setSetting = async function(key, value, description = '', category = 'general', modifiedBy = 'system') {
  try {
    const setting = await this.findOneAndUpdate(
      { key },
      { 
        value, 
        description, 
        category, 
        lastModified: new Date(),
        modifiedBy 
      },
      { 
        upsert: true, 
        new: true 
      }
    );
    return setting;
  } catch (error) {
    console.error('Error setting setting:', error);
    throw error;
  }
};

// Static method to get all settings by category
settingsSchema.statics.getSettingsByCategory = async function(category) {
  try {
    const settings = await this.find({ category });
    const result = {};
    settings.forEach(setting => {
      result[setting.key] = setting.value;
    });
    return result;
  } catch (error) {
    console.error('Error getting settings by category:', error);
    return {};
  }
};

module.exports = mongoose.model('Settings', settingsSchema); 