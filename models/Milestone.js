const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  date: {
    type: Date,
    required: true
  },
  image: {
    type: String,
    default: null
  },
  imageAlt: {
    type: String,
    default: null
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'published', 'archived'],
    default: 'published'
  },
  featured: {
    type: Boolean,
    default: false
  },
  order: {
    type: Number,
    default: 0
  },
  category: {
    type: String,
    enum: ['foundation', 'tournament', 'recognition', 'development', 'partnership', 'achievement', 'expansion', 'innovation'],
    default: 'achievement'
  },
  tags: [{
    type: String,
    trim: true
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
milestoneSchema.index({ status: 1, date: -1 });
milestoneSchema.index({ featured: 1, status: 1 });
milestoneSchema.index({ category: 1, status: 1 });
milestoneSchema.index({ date: -1 });

// Text search index
milestoneSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
});

// Virtual for formatted date
milestoneSchema.virtual('formattedDate').get(function() {
  return this.date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for short formatted date
milestoneSchema.virtual('shortDate').get(function() {
  return this.date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

// Virtual for year only
milestoneSchema.virtual('year').get(function() {
  return this.date.getFullYear();
});

// Pre-save middleware to handle order
milestoneSchema.pre('save', function(next) {
  if (this.isNew && this.order === 0) {
    // Auto-assign order based on date (newer milestones get higher order)
    this.order = Date.now();
  }
  next();
});

// Static method to get published milestones
milestoneSchema.statics.getPublished = function() {
  return this.find({ status: 'published' })
    .sort({ date: -1 })
    .select('title description date image imageAlt category tags formattedDate shortDate year');
};

// Static method to get featured milestones
milestoneSchema.statics.getFeatured = function() {
  return this.find({ status: 'published', featured: true })
    .sort({ date: -1 })
    .select('title description date image imageAlt category tags formattedDate shortDate year');
};

// Static method to get milestones by category
milestoneSchema.statics.getByCategory = function(category) {
  return this.find({ status: 'published', category: category })
    .sort({ date: -1 })
    .select('title description date image imageAlt category tags formattedDate shortDate year');
};

// Static method to get milestones by year
milestoneSchema.statics.getByYear = function(year) {
  const startOfYear = new Date(year, 0, 1);
  const endOfYear = new Date(year, 11, 31, 23, 59, 59);
  
  return this.find({ 
    status: 'published',
    date: { $gte: startOfYear, $lte: endOfYear }
  })
  .sort({ date: -1 })
  .select('title description date image imageAlt category tags formattedDate shortDate year');
};

module.exports = mongoose.model('Milestone', milestoneSchema);