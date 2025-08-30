const mongoose = require('mongoose');

const pastPresidentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  image: {
    type: String,
    default: null
  },
  imageAlt: {
    type: String,
    default: null
  },
  startYear: {
    type: Number,
    required: true,
    min: 1990,
    max: new Date().getFullYear()
  },
  endYear: {
    type: Number,
    required: true,
    min: 1990,
    max: new Date().getFullYear()
  },
  contribution: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'archived'],
    default: 'active'
  },
  order: {
    type: Number,
    default: 0
  },
  achievements: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  createdBy: {
    type: String,
    required: true,
    default: 'admin'
  },
  updatedBy: {
    type: String,
    default: null
  }
}, {
  timestamps: true
});

// Index for better performance
pastPresidentSchema.index({ status: 1, startYear: -1 });
pastPresidentSchema.index({ order: 1 });
pastPresidentSchema.index({ startYear: -1, endYear: -1 });

// Virtual for years of service
pastPresidentSchema.virtual('yearsOfService').get(function() {
  return `${this.startYear} - ${this.endYear}`;
});

// Virtual for service duration
pastPresidentSchema.virtual('serviceDuration').get(function() {
  return this.endYear - this.startYear + 1;
});

// Virtual for formatted period
pastPresidentSchema.virtual('formattedPeriod').get(function() {
  return `${this.startYear} - ${this.endYear} (${this.serviceDuration} years)`;
});

// Pre-save middleware to handle order and validation
pastPresidentSchema.pre('save', function(next) {
  // Validate that endYear is not before startYear
  if (this.endYear < this.startYear) {
    const error = new Error('End year cannot be before start year');
    return next(error);
  }
  
  // Auto-assign order based on start year (more recent presidents get higher order)
  if (this.isNew && this.order === 0) {
    this.order = this.startYear * 100 + (this.endYear - this.startYear);
  }
  
  next();
});

// Static method to get active past presidents
pastPresidentSchema.statics.getActive = function() {
  return this.find({ status: 'active' })
    .sort({ startYear: -1 })
    .select('name image imageAlt startYear endYear contribution achievements yearsOfService formattedPeriod');
};

// Static method to get past presidents sorted by chronological order
pastPresidentSchema.statics.getChronological = function() {
  return this.find({ status: 'active' })
    .sort({ startYear: 1 })
    .select('name image imageAlt startYear endYear contribution achievements yearsOfService formattedPeriod');
};

// Static method to get past presidents by year range
pastPresidentSchema.statics.getByYearRange = function(startYear, endYear) {
  return this.find({ 
    status: 'active',
    $or: [
      { startYear: { $gte: startYear, $lte: endYear } },
      { endYear: { $gte: startYear, $lte: endYear } },
      { startYear: { $lte: startYear }, endYear: { $gte: endYear } }
    ]
  })
  .sort({ startYear: -1 })
  .select('name image imageAlt startYear endYear contribution achievements yearsOfService formattedPeriod');
};

module.exports = mongoose.model('PastPresident', pastPresidentSchema);