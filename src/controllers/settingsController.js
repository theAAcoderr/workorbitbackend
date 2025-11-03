const { UserSetting, User } = require('../models');
const logger = require('../middleware/logger');

/**
 * User Settings Controller
 * Manages user-specific application settings and preferences
 */

/**
 * @route   GET /api/v1/settings
 * @desc    Get user settings
 * @access  Private
 */
exports.getSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    let settings = await UserSetting.findOne({
      where: { userId }
    });

    // If no settings exist, create default settings
    if (!settings) {
      settings = await UserSetting.create({
        userId,
        ...UserSetting.getDefaultSettings()
      });
    }

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    logger.error('Get settings error:', error);
    next(error);
  }
};

/**
 * @route   PUT /api/v1/settings
 * @desc    Update user settings
 * @access  Private
 */
exports.updateSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // Remove fields that shouldn't be updated directly
    delete updates.id;
    delete updates.userId;
    delete updates.createdAt;
    delete updates.updatedAt;

    let settings = await UserSetting.findOne({
      where: { userId }
    });

    if (!settings) {
      // Create new settings with updates
      settings = await UserSetting.create({
        userId,
        ...UserSetting.getDefaultSettings(),
        ...updates
      });
    } else {
      // Update existing settings
      await settings.update(updates);
    }

    logger.info(`Settings updated for user ${userId}`);

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: settings
    });
  } catch (error) {
    logger.error('Update settings error:', error);
    next(error);
  }
};

/**
 * @route   PUT /api/v1/settings/reset
 * @desc    Reset settings to default
 * @access  Private
 */
exports.resetSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;

    let settings = await UserSetting.findOne({
      where: { userId }
    });

    const defaultSettings = UserSetting.getDefaultSettings();

    if (!settings) {
      settings = await UserSetting.create({
        userId,
        ...defaultSettings
      });
    } else {
      await settings.update(defaultSettings);
    }

    logger.info(`Settings reset to default for user ${userId}`);

    res.json({
      success: true,
      message: 'Settings reset to default successfully',
      data: settings
    });
  } catch (error) {
    logger.error('Reset settings error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/v1/settings/app-config
 * @desc    Get app configuration (organization-wide settings)
 * @access  Private
 */
exports.getAppConfig = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;

    // App configuration that applies to all users in the organization
    const config = {
      organizationId,
      features: {
        attendance: true,
        leave: true,
        payroll: true,
        projects: true,
        meetings: true,
        recruitment: true,
        geofencing: true,
        aiAssistant: true,
        formBuilder: true
      },
      limits: {
        maxFileUploadSize: 10 * 1024 * 1024, // 10MB
        maxMeetingDuration: 480, // 8 hours in minutes
        maxProjectMembers: 50,
        maxTeamMembers: 30
      },
      policies: {
        requireGeofenceForCheckIn: false,
        allowRemoteWork: true,
        requirePhotoForCheckIn: false,
        autoApproveLeaves: false,
        maxLeaveDaysPerRequest: 30
      },
      branding: {
        primaryColor: '#6B8EFF',
        secondaryColor: '#9747FF',
        logoUrl: null,
        companyName: 'WorkOrbit'
      },
      version: '1.0.0',
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    logger.error('Get app config error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/v1/settings/defaults
 * @desc    Get default settings structure
 * @access  Private
 */
exports.getDefaults = async (req, res, next) => {
  try {
    const defaults = UserSetting.getDefaultSettings();

    res.json({
      success: true,
      data: defaults
    });
  } catch (error) {
    logger.error('Get defaults error:', error);
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/settings/notifications
 * @desc    Update only notification settings
 * @access  Private
 */
exports.updateNotificationSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      emailNotifications,
      pushNotifications,
      smsNotifications,
      notifyOnLeaveApproval,
      notifyOnTaskAssignment,
      notifyOnMeetingInvite,
      notifyOnPayslipGeneration
    } = req.body;

    let settings = await UserSetting.findOne({
      where: { userId }
    });

    if (!settings) {
      settings = await UserSetting.create({
        userId,
        ...UserSetting.getDefaultSettings()
      });
    }

    const updates = {};
    if (emailNotifications !== undefined) updates.emailNotifications = emailNotifications;
    if (pushNotifications !== undefined) updates.pushNotifications = pushNotifications;
    if (smsNotifications !== undefined) updates.smsNotifications = smsNotifications;
    if (notifyOnLeaveApproval !== undefined) updates.notifyOnLeaveApproval = notifyOnLeaveApproval;
    if (notifyOnTaskAssignment !== undefined) updates.notifyOnTaskAssignment = notifyOnTaskAssignment;
    if (notifyOnMeetingInvite !== undefined) updates.notifyOnMeetingInvite = notifyOnMeetingInvite;
    if (notifyOnPayslipGeneration !== undefined) updates.notifyOnPayslipGeneration = notifyOnPayslipGeneration;

    await settings.update(updates);

    logger.info(`Notification settings updated for user ${userId}`);

    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: settings
    });
  } catch (error) {
    logger.error('Update notification settings error:', error);
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/settings/appearance
 * @desc    Update only appearance settings
 * @access  Private
 */
exports.updateAppearanceSettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { theme, language, fontSize } = req.body;

    let settings = await UserSetting.findOne({
      where: { userId }
    });

    if (!settings) {
      settings = await UserSetting.create({
        userId,
        ...UserSetting.getDefaultSettings()
      });
    }

    const updates = {};
    if (theme) updates.theme = theme;
    if (language) updates.language = language;
    if (fontSize) updates.fontSize = fontSize;

    await settings.update(updates);

    logger.info(`Appearance settings updated for user ${userId}`);

    res.json({
      success: true,
      message: 'Appearance settings updated successfully',
      data: settings
    });
  } catch (error) {
    logger.error('Update appearance settings error:', error);
    next(error);
  }
};

/**
 * @route   PATCH /api/v1/settings/privacy
 * @desc    Update only privacy settings
 * @access  Private
 */
exports.updatePrivacySettings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const {
      profileVisibility,
      showEmailPublicly,
      showPhonePublicly,
      allowLocationTracking
    } = req.body;

    let settings = await UserSetting.findOne({
      where: { userId }
    });

    if (!settings) {
      settings = await UserSetting.create({
        userId,
        ...UserSetting.getDefaultSettings()
      });
    }

    const updates = {};
    if (profileVisibility) updates.profileVisibility = profileVisibility;
    if (showEmailPublicly !== undefined) updates.showEmailPublicly = showEmailPublicly;
    if (showPhonePublicly !== undefined) updates.showPhonePublicly = showPhonePublicly;
    if (allowLocationTracking !== undefined) updates.allowLocationTracking = allowLocationTracking;

    await settings.update(updates);

    logger.info(`Privacy settings updated for user ${userId}`);

    res.json({
      success: true,
      message: 'Privacy settings updated successfully',
      data: settings
    });
  } catch (error) {
    logger.error('Update privacy settings error:', error);
    next(error);
  }
};

module.exports = exports;

