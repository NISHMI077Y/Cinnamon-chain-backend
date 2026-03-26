const mongoose = require('mongoose');

const systemAdminActionSchema = new mongoose.Schema(
  {
    admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action_type: {
      type: String,
      enum: [
        'ADMIN_LOGIN',
        'USER_CREATED',
        'USER_SUSPENDED',
        'USER_REACTIVATED',
        'LISTING_REMOVED',
      ],
      required: true,
    },
    target_entity: { type: String },
    target_id: { type: mongoose.Schema.Types.ObjectId },
    reason: { type: String },
    ip: { type: String },
    metadata: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

systemAdminActionSchema.index({ admin_id: 1 });

module.exports = mongoose.model('SystemAdminAction', systemAdminActionSchema);