const mongoose = require('mongoose');

const jobAssignmentSchema = new mongoose.Schema(
  {
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    peeler_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['OFFERED', 'ACCEPTED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
      default: 'OFFERED',
    },
    job_description: { type: String, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number] },
    },
    scheduled_date: { type: Date, required: true },
  },
  { timestamps: true }
);

jobAssignmentSchema.index({ owner_id: 1 });
jobAssignmentSchema.index({ peeler_id: 1 });

module.exports = mongoose.model('JobAssignment', jobAssignmentSchema);