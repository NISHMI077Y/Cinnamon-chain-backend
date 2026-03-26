const catchAsync = (fn) => {
  if (typeof fn !== 'function') {
    throw new Error('catchAsync requires a function argument');
  }
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = catchAsync;