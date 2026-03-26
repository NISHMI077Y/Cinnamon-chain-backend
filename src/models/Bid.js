const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema(
  {
    buyer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    listing_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    amount: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN'],
      default: 'PENDING',
    },
    is_sealed: { type: Boolean, default: true },
  },
  { timestamps: true }
);

bidSchema.index({ listing_id: 1, buyer_id: 1 });
bidSchema.index({ listing_id: 1, status: 1 });

module.exports = mongoose.model('Bid', bidSchema);