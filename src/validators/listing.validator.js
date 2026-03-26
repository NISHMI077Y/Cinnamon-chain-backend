const Joi = require('joi');

const createListing = Joi.object({
  grade: Joi.string().trim().required(),
  quantity_kg: Joi.number().positive().required(),
  price_min: Joi.number().min(0).required(),
  price_max: Joi.number().min(Joi.ref('price_min')).required().messages({
    'number.min': 'price_max must be greater than or equal to price_min',
  }),
  harvest_date: Joi.date().iso().max('now').required(),
  description: Joi.string().trim().max(2000).required(),
});

module.exports = { createListing };