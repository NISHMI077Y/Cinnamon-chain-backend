const mongoose = require('mongoose');

const buyerActionSchema = new mongoose.Schema(
  {
    buyer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action_type: {
      type: String,
      enum: ['BID_PLACED', 'BID_WITHDRAWN', 'REVIEW_SUBMITTED', 'PURCHASE_COMPLETED'],
      required: true,
    },
    listing_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing' },
    transaction_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

buyerActionSchema.index({ buyer_id: 1 });

module.exports = mongoose.model('BuyerAction', buyerActionSchema);