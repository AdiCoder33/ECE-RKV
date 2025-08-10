const jwt = require('jsonwebtoken');

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  throw new Error('JWT_SECRET is not defined');
}

/**
 * Verify JWT from Authorization header and attach decoded user to request.
 *
 * Protected routes like `POST /users/bulk` require a payload of the form:
 * `{ users: [{ name, email, password, role, department, year?, section?, rollNumber?, phone? }] }`
 * along with `Authorization: Bearer <token>` header.
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

module.exports = { authenticateToken };

