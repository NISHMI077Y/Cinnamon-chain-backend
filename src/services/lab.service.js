const gradeCalculator = require('../utils/gradeCalculator');

const processLabResults = (labData) => {
  return gradeCalculator.calculate(labData);
};

module.exports = { processLabResults };