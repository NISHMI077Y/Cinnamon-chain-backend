const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    sellerId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['HARVESTED_STICKS', 'STANDING_TREES'], required: true },
    title: String,
    description: String,

    minPrice: Number,
    status: { type: String, enum: ['OPEN', 'CLOSED', 'ACCEPTED'], default: 'OPEN' },
    endsAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Listing', listingSchema);