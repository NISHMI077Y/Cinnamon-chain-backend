const SystemAdminAction = require('../models/SystemAdminAction');

const log = async ({ admin_id, action_type, target_entity, target_id, reason, ip, metadata }) => {
  try {
    await SystemAdminAction.create({
      admin_id,
      action_type,
      target_entity,
      target_id,
      reason,
      ip,
      metadata,
    });
  } catch (err) {
    console.error('Failed to log admin action:', err.message);
  }
};

module.exports = { log };