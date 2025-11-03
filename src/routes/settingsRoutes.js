const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authMiddleware } = require('../middleware/auth');
const { cacheMiddleware } = require('../config/redis');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/v1/settings
 * @desc    Get user settings
 * @access  Private
 */
router.get('/', 
  cacheMiddleware(300), // Cache for 5 minutes
  settingsController.getSettings
);

/**
 * @route   PUT /api/v1/settings
 * @desc    Update user settings
 * @access  Private
 */
router.put('/', 
  settingsController.updateSettings
);

/**
 * @route   PUT /api/v1/settings/reset
 * @desc    Reset settings to default
 * @access  Private
 */
router.put('/reset', 
  settingsController.resetSettings
);

/**
 * @route   GET /api/v1/settings/app-config
 * @desc    Get app configuration
 * @access  Private
 */
router.get('/app-config', 
  cacheMiddleware(600), // Cache for 10 minutes
  settingsController.getAppConfig
);

/**
 * @route   GET /api/v1/settings/defaults
 * @desc    Get default settings structure
 * @access  Private
 */
router.get('/defaults', 
  settingsController.getDefaults
);

/**
 * @route   PATCH /api/v1/settings/notifications
 * @desc    Update only notification settings
 * @access  Private
 */
router.patch('/notifications', 
  settingsController.updateNotificationSettings
);

/**
 * @route   PATCH /api/v1/settings/appearance
 * @desc    Update only appearance settings
 * @access  Private
 */
router.patch('/appearance', 
  settingsController.updateAppearanceSettings
);

/**
 * @route   PATCH /api/v1/settings/privacy
 * @desc    Update only privacy settings
 * @access  Private
 */
router.patch('/privacy', 
  settingsController.updatePrivacySettings
);

module.exports = router;

