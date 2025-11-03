const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    console.log('🔒 Auth middleware - checking token for:', req.method, req.originalUrl);
    console.log('   Token provided:', token ? 'Yes' : 'No');
    if (token) {
      console.log('   Token length:', token.length);
      console.log('   Token starts with:', token.substring(0, 20) + '...');
    }
    
    if (!token) {
      console.log('❌ No token provided');
      return res.status(401).json({ 
        success: false, 
        message: 'No authentication token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔑 Token decoded, user ID:', decoded.id);
    
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password', 'refreshToken'] }
    });

    if (!user) {
      console.log('❌ User not found with ID:', decoded.id);
      return res.status(401).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    console.log('✅ User authenticated:', user.email, 'Status:', user.status);

    if (user.status === 'inactive' || user.status === 'suspended') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is inactive or suspended' 
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    console.error('❌ Auth middleware error:', error.name, error.message);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expired' 
      });
    }
    return res.status(500).json({ 
      success: false, 
      message: 'Authentication error' 
    });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Handle both array and spread operator formats
    let allowedRoles;
    if (roles.length === 1 && Array.isArray(roles[0])) {
      // Called with an array: authorizeRoles(['hr', 'admin'])
      allowedRoles = roles[0];
    } else {
      // Called with spread: authorizeRoles('hr', 'admin')
      allowedRoles = roles;
    }

    // Normalize roles to lowercase for case-insensitive comparison
    const normalizedAllowedRoles = allowedRoles.map(role => role.toLowerCase().trim());
    const userRole = req.user.role ? req.user.role.toLowerCase().trim() : '';

    console.log(`🔐 Authorization check - User role: ${userRole}, Required roles: [${normalizedAllowedRoles.join(', ')}]`);

    if (!normalizedAllowedRoles.includes(userRole)) {
      console.log(`❌ Authorization failed - Role ${userRole} not in [${normalizedAllowedRoles.join(', ')}]`);
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} is not authorized to access this resource`
      });
    }

    console.log(`✅ Authorization successful for role: ${req.user.role}`);
    next();
  };
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password', 'refreshToken'] }
      });
      
      if (user && (user.status === 'active' || user.status === 'approved')) {
        req.user = user;
        req.token = token;
      }
    }
  } catch (error) {
    // Silently continue without authentication
  }
  
  next();
};

module.exports = {
  authMiddleware,
  authorizeRoles,
  optionalAuth
};