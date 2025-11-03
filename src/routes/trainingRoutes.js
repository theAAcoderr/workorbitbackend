const express = require('express');
const router = express.Router();
const trainingController = require('../controllers/trainingController');
const { authMiddleware } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authMiddleware);

// Course routes
router.get('/courses', trainingController.getCourses);
router.get('/courses/:id', trainingController.getCourseById);
router.post('/courses', trainingController.createCourse);
router.put('/courses/:id', trainingController.updateCourse);
router.delete('/courses/:id', trainingController.deleteCourse);

// Enrollment routes
router.post('/courses/:id/enroll', trainingController.enrollInCourse);
router.get('/enrollments', trainingController.getEnrollments);
router.put('/enrollments/:id/progress', trainingController.updateProgress);
router.post('/enrollments/:id/complete', trainingController.completeCourse);
router.delete('/enrollments/:id', trainingController.dropCourse);

module.exports = router;