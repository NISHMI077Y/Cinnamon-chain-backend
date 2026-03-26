const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/AppError');
const User = require('../models/User');
const tokenService = require('../services/token.service');
const adminActionService = require('../services/adminAction.service');

const createUser = catchAsync(async (req, res) => {
  const { role, phone_number, national_id, full_name } = req.body;

  if (!['BUYER', 'LAB_TECHNICIAN'].includes(role)) {
    throw new AppError('role must be BUYER or LAB_TECHNICIAN', 400, 'VALIDATION_ERROR');
  }

  const existing = await User.findOne({ phone_number });
  if (existing) {
    throw new AppError('Phone number already registered', 409, 'PHONE_DUPLICATE');
  }

  const national_id_hash = crypto.createHash('sha256').update(national_id).digest('hex');

  const user = await User.create({
    role,
    phone_number,
    national_id_hash,
    full_name,
    display_name: full_name,
    status: 'ACTIVE',
    auth_method: 'PHONE_OTP',
    created_by: req.user.user_id,
  });

  await adminActionService.log({
    admin_id: req.user.user_id,
    action_type: 'USER_CREATED',
    target_entity: 'User',
    target_id: user._id,
    ip: req.ip,
  });

  res.status(201).json({
    status: 'success',
    data: {
      user_id: user._id,
      role: user.role,
      phone_number: user.phone_number,
      full_name: user.full_name,
      created_at: user.createdAt,
    },
  });
});

const suspendUser = catchAsync(async (req, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }
  if (user.role === 'SYSTEM_ADMIN') {
    throw new AppError('Cannot suspend admin accounts via API', 403, 'FORBIDDEN');
  }

  user.status = 'SUSPENDED';
  await user.save();

  await tokenService.revokeAllUserTokens(user._id);

  await adminActionService.log({
    admin_id: req.user.user_id,
    action_type: 'USER_SUSPENDED',
    target_entity: 'User',
    target_id: user._id,
    reason,
    ip: req.ip,
  });

  res.status(200).json({
    status: 'success',
    data: { message: 'User suspended' },
  });
});

const getUsers = catchAsync(async (req, res) => {
  const { role, status, page = 1, limit = 20 } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (status) filter.status = status;

  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter)
      .select('-password_hash -totp_secret -national_id_hash')
      .skip(skip)
      .limit(parseInt(limit, 10))
      .sort({ createdAt: -1 })
      .lean(),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    status: 'success',
    data: users,
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Debug log
console.log('✅ admin.controller.js exports:', Object.keys({ createUser, suspendUser, getUsers }));

module.exports = { createUser, suspendUser, getUsers };