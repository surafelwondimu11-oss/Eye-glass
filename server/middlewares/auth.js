const jwt = require('jsonwebtoken');
const { getConnection } = require('../config/mysql');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');

      // Get user from the token
      const connection = getConnection();
      const query = 'SELECT id, name, email, isAdmin FROM users WHERE id = ?';
      connection.query(query, [decoded.id], (err, results) => {
        if (err) {
          console.error('Error fetching user:', err);
          return res.status(401).json({ message: 'Not authorized' });
        }

        if (results.length === 0) {
          return res.status(401).json({ message: 'Not authorized' });
        }

        req.user = results[0];
        next();
      });
    } catch (error) {
      console.error('Error in protect middleware:', error);
      res.status(401).json({ message: 'Not authorized' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(401).json({ message: 'Not authorized as admin' });
  }
};

module.exports = { protect, admin };
