const { nanoid } = require('nanoid');

const generateBatchId = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const id = nanoid(8).toUpperCase();
  return `CINN-${y}${m}${d}-${id}`;
};

module.exports = { generateBatchId };