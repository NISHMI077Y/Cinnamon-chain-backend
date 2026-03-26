const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    transaction_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction', required: true },
    reviewer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reviewer_role: {
      type: String,
      enum: ['PEELER', 'BUYER'],
      required: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true }
);

reviewSchema.index({ transaction_id: 1, reviewer_id: 1 }, { unique: true });
reviewSchema.index({ reviewee_id: 1 });

module.exports = mongoose.model('Review', reviewSchema);