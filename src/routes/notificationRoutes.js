const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const {
  getPreferences,
  updatePreferences,
  registerFCMToken,
  unregisterFCMToken
} = require('../controllers/notificationController');

// All routes require authentication
router.use(authMiddleware);

// Notification preferences
router.get('/preferences', getPreferences);
router.put('/preferences', updatePreferences);

// FCM token management
router.post('/fcm-token', registerFCMToken);
router.delete('/fcm-token', unregisterFCMToken);

module.exports = router;
