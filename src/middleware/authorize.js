const AppError = require('../utils/AppError');

const authorize = (...roles) => {
  return (req, _res, next) => {
    if (!req.user) {
      return next(new AppError('Authentication required', 401, 'NO_TOKEN'));
    }
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403, 'FORBIDDEN')
      );
    }
    next();
  };
};

module.exports = authorize;