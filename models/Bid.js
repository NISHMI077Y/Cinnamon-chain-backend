const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    listingId: { type: mongoose.Types.ObjectId, ref: 'Listing', required: true },
    buyerId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['PENDING', 'ACCEPTED', 'REJECTED'], default: 'PENDING' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Bid', bidSchema);