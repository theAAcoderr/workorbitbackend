
const express = require('express');
const router = express.Router();
const progressReportController = require('../controllers/progressReportController');
const { authMiddleware } = require('../middleware/auth');

// All progress report routes require authentication
router.use(authMiddleware);

// GET /api/v1/progress-reports - Get progress reports
router.get('/', progressReportController.getProgressReports);

// GET /api/v1/progress-reports/stats - Get progress statistics
router.get('/stats', progressReportController.getProgressStats);

// GET /api/v1/progress-reports/:id - Get specific progress report
router.get('/:id', progressReportController.getProgressReportById);

// POST /api/v1/progress-reports - Create new progress report
router.post('/',
  progressReportController.upload,
  progressReportController.createProgressReport
);

// PUT /api/v1/progress-reports/:id - Update progress report
router.put('/:id',
  progressReportController.upload,
  progressReportController.updateProgressReport
);

// DELETE /api/v1/progress-reports/:id - Delete progress report
router.delete('/:id', progressReportController.deleteProgressReport);

module.exports = router;