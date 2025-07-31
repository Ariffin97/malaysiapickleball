const mongoose = require('mongoose');

const newsSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  summary: {
    type: String,
    required: true,
    trim: true,
    maxlength: 300
  },
  content: {
    type: String,
    required: true
  },
  author: {
    type: String,
    required: true,
    default: 'MPA Admin'
  },
  category: {
    type: String,
    required: true,
    enum: ['tournament', 'announcement', 'general', 'achievement', 'event'],
    default: 'general'
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  },
  featuredImage: {
    type: String,
    default: null
  },
  featuredVideo: {
    type: String,
    default: null
  },
  mediaType: {
    type: String,
    enum: ['none', 'image', 'video'],
    default: 'none'
  },
  tags: [{
    type: String,
    trim: true
  }],
  viewCount: {
    type: Number,
    default: 0
  },
  publishedAt: {
    type: Date,
    default: null
  },
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
newsSchema.index({ status: 1, publishedAt: -1 });
newsSchema.index({ category: 1, status: 1 });
newsSchema.index({ featured: 1, status: 1 });

// Text search index
newsSchema.index({
  title: 'text',
  summary: 'text',
  content: 'text',
  tags: 'text'
});

// Virtual for formatted date
newsSchema.virtual('formattedDate').get(function() {
  if (this.publishedAt) {
    return this.publishedAt.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
  return this.createdAt.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Pre-save middleware to set publishedAt
newsSchema.pre('save', function(next) {
  if (this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

module.exports = mongoose.model('News', newsSchema);