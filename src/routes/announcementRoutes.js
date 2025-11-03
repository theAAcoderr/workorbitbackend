const express = require('express');
const router = express.Router();
const announcementController = require('../controllers/announcementController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get all announcements
router.get('/', announcementController.getAnnouncements);

// Get unread count
router.get('/unread-count', announcementController.getUnreadCount);

// Get single announcement
router.get('/:id', announcementController.getAnnouncement);

// Mark announcement as read
router.post('/:id/read', announcementController.markAsRead);

// Create announcement (admin, hr, manager only)
router.post(
  '/',
  authorizeRoles('admin', 'hr', 'manager'),
  announcementController.createAnnouncement
);

// Update announcement (admin, hr, manager only)
router.put(
  '/:id',
  authorizeRoles('admin', 'hr', 'manager'),
  announcementController.updateAnnouncement
);

// Delete announcement (admin, hr only)
router.delete(
  '/:id',
  authorizeRoles('admin', 'hr'),
  announcementController.deleteAnnouncement
);

module.exports = router;
