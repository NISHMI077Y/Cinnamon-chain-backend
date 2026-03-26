const mongoose = require('mongoose');

const listingSchema = new mongoose.Schema(
  {
    peeler_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    batch_id: { type: String, unique: true, required: true },
    grade: { type: String },
    quantity_kg: { type: Number, required: true, min: 0.1 },
    price_min: { type: Number, required: true, min: 0 },
    price_max: { type: Number, required: true, min: 0 },
    harvest_date: { type: Date, required: true },
    description: { type: String, trim: true },
    image_urls: [{ type: String }],
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'DRAFT',
    },
    lab_status: {
      type: String,
      enum: ['NONE', 'SAMPLE_REQUESTED', 'VERIFIED'],
      default: 'NONE',
    },
    lab_data: {
      coumarin_level: Number,
      moisture_content: Number,
      oil_content: Number,
      cinnamaldehyde_percent: Number,
      tested_at: Date,
    },
    pdf_report_url: { type: String },
    sha256_hash: { type: String },
    blockchain_tx_hash: { type: String },
    is_lab_verified: { type: Boolean, default: false },
    suggested_price_per_kg: { type: Number },
    tested_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

listingSchema.index({ peeler_id: 1, status: 1 });
listingSchema.index({ status: 1 });

module.exports = mongoose.model('Listing', listingSchema);