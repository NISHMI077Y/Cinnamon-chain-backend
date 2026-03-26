const Joi = require('joi');

const googleLogin = Joi.object({
  id_token: Joi.string().required().messages({
    'any.required': 'Google ID token is required',
  }),
  intended_role: Joi.string().valid('PEELER', 'PLANTATION_OWNER').required().messages({
    'any.only': 'intended_role must be PEELER or PLANTATION_OWNER',
    'any.required': 'intended_role is required',
  }),
});

const phoneLogin = Joi.object({
  phone_number: Joi.string()
    .pattern(/^\+[1-9]\d{6,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'phone_number must be in E.164 format (e.g. +94771234567)',
      'any.required': 'phone_number is required',
    }),
});

const phoneVerify = Joi.object({
  phone_number: Joi.string()
    .pattern(/^\+[1-9]\d{6,14}$/)
    .required()
    .messages({
      'string.pattern.base': 'phone_number must be in E.164 format',
      'any.required': 'phone_number is required',
    }),
  otp: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'OTP must be 6 digits',
    'any.required': 'OTP is required',
  }),
});

const adminLogin = Joi.object({
  username: Joi.string().trim().required().messages({
    'any.required': 'username is required',
  }),
  password: Joi.string().required().messages({
    'any.required': 'password is required',
  }),
});

const adminVerifyTotp = Joi.object({
  totp_code: Joi.string().length(6).pattern(/^\d+$/).required().messages({
    'string.length': 'TOTP code must be 6 digits',
    'any.required': 'TOTP code is required',
  }),
});

const refreshToken = Joi.object({
  refresh_token: Joi.string().required().messages({
    'any.required': 'refresh_token is required',
  }),
});

const logout = Joi.object({
  refresh_token: Joi.string().required().messages({
    'any.required': 'refresh_token is required',
  }),
});

module.exports = {
  googleLogin,
  phoneLogin,
  phoneVerify,
  adminLogin,
  adminVerifyTotp,
  refreshToken,
  logout,
};