const mongoose = require('mongoose');

const deliverySessionSchema = new mongoose.Schema(
  {
    listingId: { type: mongoose.Types.ObjectId, ref: 'Listing', required: true },
    peelerId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    buyerId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'], default: 'ACTIVE' },
    buyerLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number], // [lng, lat]
    },
  },
  { timestamps: true }
);

deliverySessionSchema.index({ buyerLocation: '2dsphere' });

module.exports = mongoose.model('DeliverySession', deliverySessionSchema);