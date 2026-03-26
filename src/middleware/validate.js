const AppError = require('../utils/AppError');

const validate = (schema, source = 'body') => {
  return (req, _res, next) => {
    if (!schema) {
      return next(new Error('Validation schema is undefined'));
    }

    const data = source === 'query' ? req.query : req.body;
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((d) => ({
        field: d.context?.key || d.path?.join('.'),
        message: d.message.replace(/"/g, ''),
      }));
      const appError = new AppError('Validation failed', 422, 'VALIDATION_ERROR');
      appError.errors = errors;
      return next(appError);
    }

    if (source === 'query') {
      req.query = value;
    } else {
      req.body = value;
    }
    next();
  };
};

module.exports = validate;