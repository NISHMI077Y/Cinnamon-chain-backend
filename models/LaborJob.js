const mongoose = require('mongoose');

const laborJobSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    plantationLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number], // [lng, lat]
    },
    requiredSkills: [String],
    payAmount: Number,
    notes: String,
    status: {
      type: String,
      enum: ['OPEN', 'ASSIGNED', 'COMPLETED', 'CANCELLED'],
      default: 'OPEN',
    },
    assignedPeelerId: { type: mongoose.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

laborJobSchema.index({ plantationLocation: '2dsphere' });

module.exports = mongoose.model('LaborJob', laborJobSchema);