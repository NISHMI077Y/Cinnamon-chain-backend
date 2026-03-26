const Joi = require('joi');

const placeBid = Joi.object({
  listing_id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'listing_id must be a valid ObjectId',
      'any.required': 'listing_id is required',
    }),
  amount: Joi.number().positive().required().messages({
    'number.positive': 'Bid amount must be a positive number',
    'any.required': 'amount is required',
  }),
});

module.exports = { placeBid };