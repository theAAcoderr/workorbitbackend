const express = require('express');
const router = express.Router();
const {
  getHolidays,
  getHoliday,
  createHoliday,
  updateHoliday,
  deleteHoliday,
  getUpcomingHolidays,
  checkHoliday
} = require('../controllers/holidayController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Public routes (all authenticated users)
router.get('/', getHolidays);
router.get('/upcoming', getUpcomingHolidays);
router.get('/check/:date', checkHoliday);
router.get('/:id', getHoliday);

// Protected routes (Admin, HR, Manager)
router.post('/', authorizeRoles('admin', 'hr', 'manager'), createHoliday);
router.put('/:id', authorizeRoles('admin', 'hr', 'manager'), updateHoliday);
router.delete('/:id', authorizeRoles('admin', 'hr', 'manager'), deleteHoliday);

module.exports = router;
