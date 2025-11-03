const express = require('express');
const multer = require('multer');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { cacheMiddleware } = require('../config/redis');
const {
  createLeave,
  getEmployeeLeaves,
  getPendingApprovals,
  approveLeave,
  rejectLeave,
  withdrawLeave,
  getLeaveBalance,
  getLeavePolicy,
  getTeamLeaves,
  checkLeaveConflicts
} = require('../controllers/leaveController');

// Configure multer for leave attachment uploads (using memory storage for S3)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common document and image formats for leave attachments
    const allowedMimeTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.doc', '.docx', '.txt'];
    const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));

    if (allowedMimeTypes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'), false);
    }
  }
});

// Employee routes
router.post('/apply', authMiddleware, upload.single('attachment'), createLeave);
// Cache for 2 minutes
router.get('/my-leaves', authMiddleware, cacheMiddleware(120), getEmployeeLeaves);
router.get('/balance', authMiddleware, cacheMiddleware(300), getLeaveBalance);
// Cache for 10 minutes (rarely changes)
router.get('/policy', authMiddleware, cacheMiddleware(600), getLeavePolicy);
router.get('/check-conflicts', authMiddleware, checkLeaveConflicts);
router.post('/withdraw/:leaveId', authMiddleware, withdrawLeave);

// Manager/HR routes
// Cache for 1 minute (frequently updated)
router.get('/pending-approvals', authMiddleware, cacheMiddleware(60), getPendingApprovals);
router.get('/team-leaves', authMiddleware, cacheMiddleware(120), getTeamLeaves);
router.post('/approve/:leaveId', authMiddleware, approveLeave);
router.post('/reject/:leaveId', authMiddleware, rejectLeave);

module.exports = router;