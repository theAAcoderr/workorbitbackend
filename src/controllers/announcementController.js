const { Announcement, AnnouncementRead, User } = require('../models');
const { Op } = require('sequelize');
const oneSignalService = require('../services/oneSignalService');

// Get all announcements for user
exports.getAnnouncements = async (req, res) => {
  try {
    const { organizationId, id: userId } = req.user;

    const announcements = await Announcement.findAll({
      where: {
        organizationId,
        isActive: true,
        [Op.or]: [
          { expiryDate: null },
          { expiryDate: { [Op.gte]: new Date() } }
        ]
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: AnnouncementRead,
          as: 'reads',
          where: { userId },
          required: false,
          attributes: ['id', 'readAt'],
        },
      ],
      order: [
        ['isPinned', 'DESC'],
        ['createdAt', 'DESC']
      ],
    });

    // Add isRead field to each announcement
    const announcementsWithReadStatus = announcements.map(announcement => {
      const plain = announcement.get({ plain: true });
      return {
        ...plain,
        isRead: plain.reads && plain.reads.length > 0,
        reads: undefined, // Remove the reads array from response
      };
    });

    res.json({
      success: true,
      data: announcementsWithReadStatus,
    });
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcements',
      error: error.message,
    });
  }
};

// Get single announcement
exports.getAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId, id: userId } = req.user;

    const announcement = await Announcement.findOne({
      where: {
        id,
        organizationId,
        isActive: true,
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: AnnouncementRead,
          as: 'reads',
          where: { userId },
          required: false,
        },
      ],
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    const plain = announcement.get({ plain: true });
    res.json({
      success: true,
      data: {
        ...plain,
        isRead: plain.reads && plain.reads.length > 0,
      },
    });
  } catch (error) {
    console.error('Get announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch announcement',
      error: error.message,
    });
  }
};

// Create announcement
exports.createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      message,
      priority,
      category,
      attachmentUrl,
      targetAudience,
      targetDepartment,
      targetRole,
      expiryDate,
      isPinned,
    } = req.body;

    const { organizationId, id: userId } = req.user;

    const announcement = await Announcement.create({
      organizationId,
      title,
      message,
      priority: priority || 'medium',
      category,
      attachmentUrl,
      targetAudience: targetAudience || 'all',
      targetDepartment,
      targetRole,
      expiryDate,
      isPinned: isPinned || false,
      createdBy: userId,
    });

    const announcementWithCreator = await Announcement.findByPk(announcement.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    // Send notification to target audience
    try {
      const isUrgent = priority === 'urgent' || priority === 'critical';
      const notificationTitle = isUrgent ? '🚨 URGENT: ' + title : '📢 ' + title;
      const notificationMessage = message.substring(0, 100) + (message.length > 100 ? '...' : '');

      const notificationData = {
        type: 'announcement',
        announcementId: announcement.id,
        title: title,
        priority: priority || 'medium',
        category: category,
        createdBy: req.user.name,
        timestamp: new Date().toISOString()
      };

      if (targetAudience === 'all' || !targetAudience) {
        // Send to all users in organization
        await oneSignalService.sendToSegment(
          organizationId,
          {},
          {
            title: notificationTitle,
            message: notificationMessage,
            data: notificationData
          }
        );
        console.log('✅ Announcement notification sent to all users');
      } else if (targetRole) {
        // Send to specific role
        await oneSignalService.sendToRole(
          organizationId,
          targetRole,
          {
            title: notificationTitle,
            message: notificationMessage,
            data: { ...notificationData, targetRole: targetRole }
          }
        );
        console.log(`✅ Announcement notification sent to role: ${targetRole}`);
      } else if (targetDepartment) {
        // Send to specific department
        await oneSignalService.sendToSegment(
          organizationId,
          { department: targetDepartment },
          {
            title: notificationTitle,
            message: notificationMessage,
            data: { ...notificationData, targetDepartment: targetDepartment }
          }
        );
        console.log(`✅ Announcement notification sent to department: ${targetDepartment}`);
      }
    } catch (notificationError) {
      console.error('⚠️ Failed to send announcement notifications:', notificationError);
      // Don't fail the announcement creation if notification fails
    }

    res.status(201).json({
      success: true,
      message: 'Announcement created successfully',
      data: announcementWithCreator,
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create announcement',
      error: error.message,
    });
  }
};

// Update announcement
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;

    const announcement = await Announcement.findOne({
      where: {
        id,
        organizationId,
        isActive: true,
      },
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    const {
      title,
      message,
      priority,
      category,
      attachmentUrl,
      targetAudience,
      targetDepartment,
      targetRole,
      expiryDate,
      isPinned,
    } = req.body;

    await announcement.update({
      title: title || announcement.title,
      message: message || announcement.message,
      priority,
      category,
      attachmentUrl,
      targetAudience,
      targetDepartment,
      targetRole,
      expiryDate,
      isPinned,
    });

    const updatedAnnouncement = await Announcement.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    res.json({
      success: true,
      message: 'Announcement updated successfully',
      data: updatedAnnouncement,
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update announcement',
      error: error.message,
    });
  }
};

// Delete announcement
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;

    const announcement = await Announcement.findOne({
      where: {
        id,
        organizationId,
        isActive: true,
      },
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    await announcement.update({ isActive: false });

    res.json({
      success: true,
      message: 'Announcement deleted successfully',
    });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete announcement',
      error: error.message,
    });
  }
};

// Mark announcement as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId, id: userId } = req.user;

    // Verify announcement exists and belongs to user's organization
    const announcement = await Announcement.findOne({
      where: {
        id,
        organizationId,
        isActive: true,
      },
    });

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: 'Announcement not found',
      });
    }

    // Check if already read
    const existingRead = await AnnouncementRead.findOne({
      where: {
        announcementId: id,
        userId,
      },
    });

    if (existingRead) {
      return res.json({
        success: true,
        message: 'Announcement already marked as read',
      });
    }

    // Create read record
    await AnnouncementRead.create({
      announcementId: id,
      userId,
    });

    res.json({
      success: true,
      message: 'Announcement marked as read',
    });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark announcement as read',
      error: error.message,
    });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const { organizationId, id: userId } = req.user;

    const totalAnnouncements = await Announcement.count({
      where: {
        organizationId,
        isActive: true,
        [Op.or]: [
          { expiryDate: null },
          { expiryDate: { [Op.gte]: new Date() } }
        ]
      },
    });

    const readCount = await AnnouncementRead.count({
      where: { userId },
      include: [{
        model: Announcement,
        as: 'announcement',
        where: {
          organizationId,
          isActive: true,
        },
        required: true,
      }],
    });

    res.json({
      success: true,
      data: {
        total: totalAnnouncements,
        read: readCount,
        unread: totalAnnouncements - readCount,
      },
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get unread count',
      error: error.message,
    });
  }
};
