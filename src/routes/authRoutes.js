const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const {
  validateRegistration,
  validateLogin,
  validateOrganizationCreation,
  validateJoinRequest
} = require('../middleware/validation');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for profile picture uploads (using memory storage for S3)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check MIME type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp'
    ];

    // Check file extension
    const allowedExtensions = /\.(jpg|jpeg|png|gif|webp)$/i;
    const hasValidExtension = allowedExtensions.test(file.originalname);
    const hasValidMimeType = allowedMimeTypes.includes(file.mimetype.toLowerCase());

    console.log('File validation:', {
      originalname: file.originalname,
      mimetype: file.mimetype,
      hasValidExtension,
      hasValidMimeType
    });

    if (hasValidMimeType || hasValidExtension) {
      return cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Received: ${file.mimetype}. Only JPEG, PNG, GIF, WebP images are allowed.`));
    }
  }
});

// Public routes
router.post('/register', validateRegistration, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/register-admin', validateRegistration, authController.registerAdmin);
router.post('/register-staff', validateRegistration, authController.registerStaff);
router.post('/refresh-token', authController.refreshToken);

// Password reset routes (with OTP rate limiting)
router.post('/forgot-password', otpLimiter, authController.forgotPassword);
router.post('/verify-otp', authController.verifyResetOTP);
router.post('/reset-password', authController.resetPassword);
// Legacy routes (keeping for backward compatibility)
router.get('/reset-password/:token', authController.verifyResetToken);
router.post('/reset-password/:token', authController.resetPassword);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentUser);
router.put('/profile', authMiddleware, authController.updateProfile);
router.put('/profile-picture', authMiddleware, upload.single('profilePicture'), authController.updateProfilePicture);
router.put('/onesignal-player-id', authMiddleware, authController.updateOneSignalPlayerId);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;