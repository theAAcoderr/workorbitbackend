const express = require('express');
const router = express.Router();
const formController = require('../controllers/formController');
const { authMiddleware, authorizeRoles } = require('../middleware/auth');
const { cacheMiddleware } = require('../config/redis');

/**
 * @route   GET /api/v1/forms
 * @desc    Get all forms for organization
 * @access  Private
 */
router.get('/', 
  authMiddleware,
  cacheMiddleware(180), 
  formController.getForms
);

/**
 * @route   POST /api/v1/forms
 * @desc    Create a new form
 * @access  Private (Admin, HR, Manager)
 */
router.post('/', 
  authMiddleware,
  authorizeRoles('admin', 'hr', 'manager'), 
  formController.createForm
);

/**
 * @route   GET /api/v1/forms/:id
 * @desc    Get form by ID
 * @access  Private
 */
router.get('/:id', 
  authMiddleware,
  cacheMiddleware(300), 
  formController.getFormById
);

/**
 * @route   PUT /api/v1/forms/:id
 * @desc    Update form
 * @access  Private (Creator, Admin, HR)
 */
router.put('/:id', 
  authMiddleware,
  formController.updateForm
);

/**
 * @route   DELETE /api/v1/forms/:id
 * @desc    Delete form
 * @access  Private (Creator, Admin)
 */
router.delete('/:id', 
  authMiddleware,
  formController.deleteForm
);

/**
 * @route   POST /api/v1/forms/:id/publish
 * @desc    Publish form
 * @access  Private (Creator, Admin, HR)
 */
router.post('/:id/publish', 
  authMiddleware,
  formController.publishForm
);

/**
 * @route   POST /api/v1/forms/:id/submit
 * @desc    Submit form response
 * @access  Private (or Public for anonymous forms)
 */
router.post('/:id/submit', 
  authMiddleware,
  formController.submitFormResponse
);

/**
 * @route   GET /api/v1/forms/:id/responses
 * @desc    Get form responses
 * @access  Private (Creator, Admin, HR)
 */
router.get('/:id/responses', 
  authMiddleware,
  formController.getFormResponses
);

/**
 * @route   GET /api/v1/forms/:id/analytics
 * @desc    Get form analytics
 * @access  Private (Creator, Admin, HR)
 */
router.get('/:id/analytics', 
  authMiddleware,
  cacheMiddleware(300),
  formController.getFormAnalytics
);

module.exports = router;

