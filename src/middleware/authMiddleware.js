const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization; // "Bearer token"
  if (!authHeader) return res.status(401).json({ error: 'No token' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};