const mongoose = require('mongoose');

const peelerProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Types.ObjectId, ref: 'User', unique: true },
    availabilityStatus: {
      type: String,
      enum: ['OFFLINE', 'AVAILABLE', 'BUSY'],
      default: 'OFFLINE',
    },
    ratingAvg: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number], // [lng, lat]
    },
    lastSeenAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

peelerProfileSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('PeelerProfile', peelerProfileSchema);