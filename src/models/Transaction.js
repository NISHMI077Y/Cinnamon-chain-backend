const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    listing_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    peeler_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    buyer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    bid_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Bid', required: true },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'IN_PROGRESS',
    },
    completed_at: { type: Date },
  },
  { timestamps: true }
);

transactionSchema.index({ peeler_id: 1 });
transactionSchema.index({ buyer_id: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);