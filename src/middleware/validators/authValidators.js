/**
 * Authentication-specific validators
 */

const { body } = require('express-validator');
const {
  validateRequest,
  emailValidator,
  passwordValidator,
  nameValidator,
  phoneValidator
} = require('./commonValidators');

/**
 * Register validation
 */
const registerValidators = [
  ...emailValidator('email'),
  ...passwordValidator('password'),
  ...nameValidator('name'),
  ...phoneValidator('phone'),
  validateRequest
];

/**
 * Login validation
 */
const loginValidators = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Invalid email format')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  validateRequest
];

/**
 * Forgot password validation
 */
const forgotPasswordValidators = [
  ...emailValidator('email'),
  validateRequest
];

/**
 * Reset password validation
 */
const resetPasswordValidators = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 20 })
    .withMessage('Invalid reset token'),
  ...passwordValidator('newPassword'),
  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  validateRequest
];

/**
 * Change password validation
 */
const changePasswordValidators = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  ...passwordValidator('newPassword'),
  body('newPassword')
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error('New password must be different from current password');
      }
      return true;
    }),
  validateRequest
];

/**
 * Refresh token validation
 */
const refreshTokenValidators = [
  body('refreshToken')
    .notEmpty()
    .withMessage('Refresh token is required'),
  validateRequest
];

/**
 * Email verification validation
 */
const verifyEmailValidators = [
  body('token')
    .notEmpty()
    .withMessage('Verification token is required'),
  validateRequest
];

/**
 * Two-factor authentication validation
 */
const twoFactorValidators = [
  body('code')
    .notEmpty()
    .withMessage('2FA code is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('2FA code must be 6 digits')
    .isNumeric()
    .withMessage('2FA code must contain only numbers'),
  validateRequest
];

module.exports = {
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
  changePasswordValidators,
  refreshTokenValidators,
  verifyEmailValidators,
  twoFactorValidators
};

