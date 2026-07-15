const jwt = require('jsonwebtoken');

/**
 * JWT Authentication Middleware
 * Verifies the JWT token from cookie or Authorization header
 */
const authenticateToken = (req, res, next) => {
  try {
    // Try to get token from cookie first, then from Authorization header
    const token = req.cookies?.auth_token || (req.headers['authorization'] && req.headers['authorization'].split(' ')[1]);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    // Verify token
    const secret = process.env.JWT_SECRET || 'your-secret-key';
    jwt.verify(token, secret, (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: 'Invalid or expired token'
        });
      }

      // Attach user info to request
      req.user = {
        userId: decoded.userId,
        gmail: decoded.gmail
      };

      next();
    });
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};

module.exports = { authenticateToken };

