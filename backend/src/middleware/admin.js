export const adminMiddleware = (req, res, next) => {
  const pool = require('../config/db').default;

  if (req.user.role !== 'admin') {
    return res.status(403).json({ msg: 'Admin access denied' });
  }
  next();
};