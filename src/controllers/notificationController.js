const NotificationPreference = require('../models/NotificationPreference');
const { User } = require('../models');
const { logger } = require('../middleware/logger');

/**
 * @swagger
 * /api/v1/notifications/preferences:
 *   get:
 *     summary: Get user notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification preferences retrieved successfully
 */
const getPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    let preferences = await NotificationPreference.findOne({
      where: { userId }
    });

    // Create default preferences if not exists
    if (!preferences) {
      preferences = await NotificationPreference.create({ userId });
    }

    res.json({
      success: true,
      data: preferences
    });
  } catch (error) {
    logger.error('Get notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notification preferences',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/v1/notifications/preferences:
 *   put:
 *     summary: Update user notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               emailEnabled:
 *                 type: boolean
 *               pushEnabled:
 *                 type: boolean
 *               emailAttendance:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 */
const updatePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    let preferences = await NotificationPreference.findOne({
      where: { userId }
    });

    if (!preferences) {
      preferences = await NotificationPreference.create({
        userId,
        ...updates
      });
    } else {
      await preferences.update(updates);
    }

    logger.info('Notification preferences updated', { userId, updates });

    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: preferences
    });
  } catch (error) {
    logger.error('Update notification preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification preferences',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/v1/notifications/fcm-token:
 *   post:
 *     summary: Register FCM token for push notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: FCM token registered successfully
 */
const registerFCMToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'FCM token is required'
      });
    }

    let preferences = await NotificationPreference.findOne({
      where: { userId }
    });

    if (!preferences) {
      preferences = await NotificationPreference.create({ userId });
    }

    // Add token if not already exists
    const tokens = preferences.fcmTokens || [];
    if (!tokens.includes(token)) {
      tokens.push(token);
      await preferences.update({ fcmTokens: tokens });
    }

    logger.info('FCM token registered', { userId });

    res.json({
      success: true,
      message: 'FCM token registered successfully'
    });
  } catch (error) {
    logger.error('Register FCM token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to register FCM token',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/v1/notifications/fcm-token:
 *   delete:
 *     summary: Unregister FCM token
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: FCM token unregistered successfully
 */
const unregisterFCMToken = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    const preferences = await NotificationPreference.findOne({
      where: { userId }
    });

    if (preferences && preferences.fcmTokens) {
      const tokens = preferences.fcmTokens.filter(t => t !== token);
      await preferences.update({ fcmTokens: tokens });
    }

    logger.info('FCM token unregistered', { userId });

    res.json({
      success: true,
      message: 'FCM token unregistered successfully'
    });
  } catch (error) {
    logger.error('Unregister FCM token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unregister FCM token',
      error: error.message
    });
  }
};

/**
 * @swagger
 * /api/v1/notifications/test:
 *   post:
 *     summary: Send test notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test notification sent
 */
const sendTestNotification = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get socket instance from app
    const notificationSocket = req.app.get('notificationSocket');

    if (notificationSocket) {
      notificationSocket.sendToUser(userId, 'system:test', {
        title: 'Test Notification',
        message: 'This is a test notification from WorkOrbit',
        type: 'info'
      });
    }

    res.json({
      success: true,
      message: 'Test notification sent successfully'
    });
  } catch (error) {
    logger.error('Send test notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
      error: error.message
    });
  }
};

module.exports = {
  getPreferences,
  updatePreferences,
  registerFCMToken,
  unregisterFCMToken,
  sendTestNotification
};
