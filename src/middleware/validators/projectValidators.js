/**
 * Project Management Validators
 */

const { body, param, query } = require('express-validator');
const {
  validateRequest,
  uuidValidator,
  paginationValidators,
  dateRangeValidators
} = require('./commonValidators');

/**
 * Create project validation
 */
const createProjectValidators = [
  body('name')
    .notEmpty()
    .withMessage('Project name is required')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Project name must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9\s-_]+$/)
    .withMessage('Project name can only contain letters, numbers, spaces, hyphens, and underscores'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Invalid start date format')
    .toDate(),
  
  body('endDate')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('Invalid end date format')
    .toDate()
    .custom((value, { req }) => {
      if (value <= req.body.startDate) {
        throw new Error('End date must be after start date');
      }
      
      // Maximum project duration (e.g., 5 years)
      const maxYears = 5;
      const yearsDiff = (value - req.body.startDate) / (1000 * 60 * 60 * 24 * 365);
      if (yearsDiff > maxYears) {
        throw new Error(`Project duration cannot exceed ${maxYears} years`);
      }
      
      return true;
    }),
  
  body('budget')
    .optional()
    .isFloat({ min: 0, max: 100000000 })
    .withMessage('Budget must be between 0 and 100,000,000')
    .toFloat(),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Priority must be one of: low, medium, high, critical'),
  
  body('status')
    .optional()
    .isIn(['planning', 'active', 'on-hold', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  
  body('teamMembers')
    .optional()
    .isArray({ min: 0, max: 50 })
    .withMessage('Team members must be an array with maximum 50 members'),
  
  body('teamMembers.*')
    .isUUID()
    .withMessage('Invalid team member ID'),
  
  body('managerId')
    .optional()
    .isUUID()
    .withMessage('Invalid manager ID'),
  
  body('tags')
    .optional()
    .isArray({ max: 20 })
    .withMessage('Maximum 20 tags allowed'),
  
  body('tags.*')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each tag must be 1-50 characters'),
  
  validateRequest
];

/**
 * Update project validation
 */
const updateProjectValidators = [
  ...uuidValidator,
  body('name')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Project name must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description must not exceed 1000 characters'),
  
  body('startDate')
    .optional()
    .isISO8601()
    .toDate(),
  
  body('endDate')
    .optional()
    .isISO8601()
    .toDate(),
  
  body('budget')
    .optional()
    .isFloat({ min: 0 })
    .toFloat(),
  
  body('status')
    .optional()
    .isIn(['planning', 'active', 'on-hold', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical']),
  
  validateRequest
];

/**
 * Add team member validation
 */
const addTeamMemberValidators = [
  param('projectId').isUUID().withMessage('Invalid project ID'),
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID'),
  
  body('role')
    .optional()
    .isIn(['member', 'lead', 'contributor'])
    .withMessage('Invalid role'),
  
  validateRequest
];

/**
 * Get projects validation
 */
const getProjectsValidators = [
  ...paginationValidators,
  query('status')
    .optional()
    .isIn(['planning', 'active', 'on-hold', 'completed', 'cancelled'])
    .withMessage('Invalid status filter'),
  
  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid priority filter'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Search term must be 2-100 characters'),
  
  validateRequest
];

module.exports = {
  createProjectValidators,
  updateProjectValidators,
  addTeamMemberValidators,
  getProjectsValidators
};

/**
 * USAGE EXAMPLES:
 * 
 * 1. Import in your routes file:
 *    const { createProjectValidators } = require('./validators/projectValidators');
 * 
 * 2. Apply to route:
 *    router.post('/', authMiddleware, createProjectValidators, controller.create);
 * 
 * 3. In controller, data is pre-validated:
 *    const createProject = async (req, res) => {
 *      const { name, description, startDate, endDate } = req.body;
 *      // All fields are validated, sanitized, and type-converted
 *      // No need for manual validation!
 *    };
 * 
 * 4. Validation errors are automatically returned:
 *    {
 *      "success": false,
 *      "message": "Validation failed",
 *      "errors": [
 *        { "field": "name", "message": "Project name is required" }
 *      ]
 *    }
 */

