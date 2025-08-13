const mongoose = require('mongoose');

const venueSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, index: true },
  address: { type: String, required: true },
  bookingUrl: { type: String, required: false },
  imageUrl: { type: String, required: false }, // legacy single image
  imageUrls: [{ type: String }],
  tournamentLevels: [{ type: String }],
  totalCourts: { type: Number, default: 0 },
  owner: { type: String, required: false },
  phone: { type: String, required: false },
  mapsUrl: { type: String, required: false },
  history: [{ type: String }],
  description: { type: String, required: false },
}, { timestamps: true });

function toSlug(input) {
  return (input || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

venueSchema.pre('validate', function(next) {
  if (!this.slug && this.name) {
    this.slug = toSlug(this.name);
  }
  next();
});

module.exports = mongoose.model('Venue', venueSchema);


