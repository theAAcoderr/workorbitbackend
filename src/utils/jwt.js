const jwt = require('jsonwebtoken');

const generateToken = (payload, secret = process.env.JWT_SECRET, expiresIn = process.env.JWT_EXPIRES_IN) => {
  return jwt.sign(payload, secret, { expiresIn });
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN
  });
};

const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  return jwt.verify(token, secret);
};

const generateTokens = (user) => {
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role
  };

  const accessToken = generateToken(payload);
  const refreshToken = generateRefreshToken(payload);

  return {
    accessToken,
    refreshToken
  };
};

module.exports = {
  generateToken,
  generateRefreshToken,
  verifyToken,
  generateTokens
};