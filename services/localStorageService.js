const fs = require('fs');
const path = require('path');

// Simple local file-based storage for organization chart data
class LocalStorageService {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data');
    this.orgChartFile = path.join(this.dataDir, 'organization-chart.json');
    
    // Ensure data directory exists
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }
  
  // Get organization chart data
  getOrganizationChartData() {
    try {
      if (fs.existsSync(this.orgChartFile)) {
        const data = fs.readFileSync(this.orgChartFile, 'utf8');
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Error reading organization chart data:', error);
      return null;
    }
  }
  
  // Save organization chart data
  saveOrganizationChartData(data) {
    try {
      const jsonData = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
      fs.writeFileSync(this.orgChartFile, jsonData, 'utf8');
      console.log('✅ Organization chart data saved to local file');
      return true;
    } catch (error) {
      console.error('Error saving organization chart data:', error);
      return false;
    }
  }
  
  // Generic setting storage
  getSetting(key, defaultValue = null) {
    if (key === 'organization_chart_data') {
      const data = this.getOrganizationChartData();
      return data ? JSON.stringify(data) : defaultValue;
    }
    
    // For other settings, use a settings file
    const settingsFile = path.join(this.dataDir, 'settings.json');
    try {
      if (fs.existsSync(settingsFile)) {
        const settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
        return settings[key] || defaultValue;
      }
    } catch (error) {
      console.error('Error reading settings:', error);
    }
    
    return defaultValue;
  }
  
  setSetting(key, value) {
    if (key === 'organization_chart_data') {
      const data = typeof value === 'string' ? JSON.parse(value) : value;
      return this.saveOrganizationChartData(data);
    }
    
    // For other settings
    const settingsFile = path.join(this.dataDir, 'settings.json');
    try {
      let settings = {};
      if (fs.existsSync(settingsFile)) {
        settings = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
      }
      
      settings[key] = value;
      fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf8');
      console.log(`✅ Setting '${key}' saved to local file`);
      return true;
    } catch (error) {
      console.error('Error saving setting:', error);
      return false;
    }
  }
}

module.exports = new LocalStorageService();
