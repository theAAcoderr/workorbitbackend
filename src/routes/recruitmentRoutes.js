const express = require('express');
const router = express.Router();
const recruitmentController = require('../controllers/recruitmentController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// Job Management Routes (Protected - HR/Admin only)
router.post('/jobs', authMiddleware, authorizeRoles('admin', 'hr'), recruitmentController.createJob);
router.get('/jobs', authMiddleware, recruitmentController.getJobs);
router.get('/jobs/:id', authMiddleware, recruitmentController.getJob);
router.put('/jobs/:id', authMiddleware, authorizeRoles('admin', 'hr'), recruitmentController.updateJob);
router.delete('/jobs/:id', authMiddleware, authorizeRoles('admin', 'hr'), recruitmentController.deleteJob);
router.patch('/jobs/:id/status', authMiddleware, authorizeRoles('admin', 'hr'), recruitmentController.toggleJobStatus);

// Application Management Routes (Protected - HR/Admin only)
router.get('/applications', authMiddleware, recruitmentController.getApplications);
router.get('/applications/:id', authMiddleware, recruitmentController.getApplication);
router.patch('/applications/:id/status', authMiddleware, authorizeRoles('admin', 'hr'), recruitmentController.updateApplicationStatus);
router.post('/applications/:id/notes', authMiddleware, authorizeRoles('admin', 'hr'), recruitmentController.addApplicationNote);
router.post('/applications/:id/notify', authMiddleware, authorizeRoles('admin', 'hr'), recruitmentController.sendNotification);
router.post('/applications/bulk-update', authMiddleware, authorizeRoles('admin', 'hr'), recruitmentController.bulkUpdateStatus);
router.delete('/applications/:id', authMiddleware, authorizeRoles('admin', 'hr'), recruitmentController.deleteApplication);

// Statistics and Analytics Routes (Protected)
router.get('/recruitment/statistics', authMiddleware, recruitmentController.getStatistics);
router.get('/jobs/:id/analytics', authMiddleware, recruitmentController.getJobAnalytics);

// Public Routes (For job applicants)
router.get('/public/jobs', recruitmentController.getPublicJobs); // Public - for job seekers to browse jobs
router.get('/public/jobs/:id', recruitmentController.getPublicJob); // Public - for job seekers to view job details
router.post('/applications', recruitmentController.createApplication); // Public - for job applicants
router.post('/applications/track', recruitmentController.trackApplication); // Public - for tracking applications

module.exports = router;