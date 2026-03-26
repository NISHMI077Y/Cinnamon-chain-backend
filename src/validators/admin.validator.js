const Joi = require('joi');

const createUser = Joi.object({
  role: Joi.string().valid('BUYER', 'LAB_TECHNICIAN').required().messages({
    'any.only': 'role must be BUYER or LAB_TECHNICIAN',
    'any.required': 'role is required',
  }),
  phone_number: Joi.string()
    .pattern(/^\+[1-9]\d{6,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'phone_number must be in E.164 format',
      'any.required': 'phone_number is required',
    }),
  national_id: Joi.string().trim().min(5).max(20).required().messages({
    'any.required': 'national_id is required',
  }),
  full_name: Joi.string().trim().min(2).max(100).required().messages({
    'any.required': 'full_name is required',
  }),
});

const suspendUser = Joi.object({
  reason: Joi.string().trim().min(5).max(500).required().messages({
    'any.required': 'reason is required',
  }),
});

const getUsers = Joi.object({
  role: Joi.string().valid('PEELER', 'PLANTATION_OWNER', 'BUYER', 'LAB_TECHNICIAN'),
  status: Joi.string().valid('ACTIVE', 'SUSPENDED'),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

const hirePeeler = Joi.object({
  job_description: Joi.string().trim().min(10).max(1000).required(),
  location: Joi.object({
    lat: Joi.number().min(-90).max(90).required(),
    lng: Joi.number().min(-180).max(180).required(),
  }).required(),
  scheduled_date: Joi.date().iso().min('now').required(),
});

const reviewBody = Joi.object({
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().trim().max(500).allow('').optional(),
});

// Debug log to verify exports
console.log('✅ admin.validator.js exports:', Object.keys({ createUser, suspendUser, getUsers, hirePeeler, reviewBody }));

module.exports = { createUser, suspendUser, getUsers, hirePeeler, reviewBody };