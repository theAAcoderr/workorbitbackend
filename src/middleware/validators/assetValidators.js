const { body, param, query } = require('express-validator');

// Validate asset creation
exports.validateCreateAsset = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Asset name is required')
    .isLength({ min: 2, max: 255 })
    .withMessage('Asset name must be between 2 and 255 characters'),

  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isIn([
      'laptop',
      'desktop',
      'monitor',
      'keyboard',
      'mouse',
      'phone',
      'tablet',
      'printer',
      'scanner',
      'network_device',
      'server',
      'accessory',
      'furniture',
      'vehicle',
      'other'
    ])
    .withMessage('Invalid category'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters'),

  body('type')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Type must not exceed 255 characters'),

  body('brand')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Brand must not exceed 255 characters'),

  body('model')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Model must not exceed 255 characters'),

  body('serialNumber')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Serial number must not exceed 255 characters'),

  body('purchaseDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid purchase date format'),

  body('purchasePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be a positive number'),

  body('warrantyExpiryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid warranty expiry date format'),

  body('condition')
    .optional()
    .isIn(['excellent', 'good', 'fair', 'poor', 'damaged'])
    .withMessage('Invalid condition'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Location must not exceed 500 characters'),

  body('departmentId')
    .optional()
    .isUUID()
    .withMessage('Invalid department ID'),

  body('specifications')
    .optional()
    .isObject()
    .withMessage('Specifications must be an object'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters'),

  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array')
];

// Validate asset update
exports.validateUpdateAsset = [
  param('id')
    .isUUID()
    .withMessage('Invalid asset ID'),

  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Asset name cannot be empty')
    .isLength({ min: 2, max: 255 })
    .withMessage('Asset name must be between 2 and 255 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must not exceed 5000 characters'),

  body('type')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Type must not exceed 255 characters'),

  body('brand')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Brand must not exceed 255 characters'),

  body('model')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Model must not exceed 255 characters'),

  body('serialNumber')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Serial number must not exceed 255 characters'),

  body('purchaseDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid purchase date format'),

  body('purchasePrice')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be a positive number'),

  body('warrantyExpiryDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid warranty expiry date format'),

  body('status')
    .optional()
    .isIn([
      'available',
      'assigned',
      'in_use',
      'maintenance',
      'repair',
      'retired',
      'lost',
      'damaged'
    ])
    .withMessage('Invalid status'),

  body('condition')
    .optional()
    .isIn(['excellent', 'good', 'fair', 'poor', 'damaged'])
    .withMessage('Invalid condition'),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Location must not exceed 500 characters'),

  body('departmentId')
    .optional()
    .isUUID()
    .withMessage('Invalid department ID'),

  body('specifications')
    .optional()
    .isObject()
    .withMessage('Specifications must be an object'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters'),

  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array')
];

// Validate asset assignment
exports.validateAssignAsset = [
  param('id')
    .isUUID()
    .withMessage('Invalid asset ID'),

  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isUUID()
    .withMessage('Invalid employee ID')
];

// Validate maintenance record
exports.validateMaintenanceRecord = [
  param('id')
    .isUUID()
    .withMessage('Invalid asset ID'),

  body('description')
    .trim()
    .notEmpty()
    .withMessage('Maintenance description is required')
    .isLength({ min: 5, max: 2000 })
    .withMessage('Description must be between 5 and 2000 characters'),

  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number'),

  body('performedBy')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Performed by must not exceed 255 characters'),

  body('scheduledDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid scheduled date format')
];

// Validate asset request creation
exports.validateCreateAssetRequest = [
  body('requestType')
    .notEmpty()
    .withMessage('Request type is required')
    .isIn(['new_asset', 'return_asset', 'replacement', 'repair'])
    .withMessage('Invalid request type'),

  body('assetId')
    .optional()
    .isUUID()
    .withMessage('Invalid asset ID'),

  body('requestedCategory')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Requested category must not exceed 100 characters'),

  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Reason is required')
    .isLength({ min: 3, max: 2000 })
    .withMessage('Reason must be between 3 and 2000 characters'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters')
];

// Validate request approval/rejection
exports.validateApproveRequest = [
  param('id')
    .isUUID()
    .withMessage('Invalid request ID'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Notes must not exceed 2000 characters')
];

exports.validateRejectRequest = [
  param('id')
    .isUUID()
    .withMessage('Invalid request ID'),

  body('rejectionReason')
    .trim()
    .notEmpty()
    .withMessage('Rejection reason is required')
    .isLength({ min: 5, max: 1000 })
    .withMessage('Rejection reason must be between 5 and 1000 characters')
];

// Validate UUID param
exports.validateAssetId = [
  param('id')
    .isUUID()
    .withMessage('Invalid asset ID')
];

exports.validateRequestId = [
  param('id')
    .isUUID()
    .withMessage('Invalid request ID')
];

// Validate query parameters
exports.validateAssetQuery = [
  query('status')
    .optional()
    .isIn([
      'available',
      'assigned',
      'in_use',
      'maintenance',
      'repair',
      'retired',
      'lost',
      'damaged'
    ])
    .withMessage('Invalid status'),

  query('category')
    .optional()
    .isIn([
      'laptop',
      'desktop',
      'monitor',
      'keyboard',
      'mouse',
      'phone',
      'tablet',
      'printer',
      'scanner',
      'network_device',
      'server',
      'accessory',
      'furniture',
      'vehicle',
      'other'
    ])
    .withMessage('Invalid category'),

  query('assignedToId')
    .optional()
    .isUUID()
    .withMessage('Invalid assigned to ID'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
];

exports.validateRequestQuery = [
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'completed', 'cancelled'])
    .withMessage('Invalid status'),

  query('requestType')
    .optional()
    .isIn(['new_asset', 'return_asset', 'replacement', 'repair'])
    .withMessage('Invalid request type'),

  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),

  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt()
];
