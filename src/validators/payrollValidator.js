const { body, param, query } = require('express-validator');

const salaryStructureValidation = [
  body('employeeId')
    .isUUID()
    .withMessage('Employee ID must be a valid UUID'),
  body('basicSalary')
    .isFloat({ min: 0 })
    .withMessage('Basic salary must be a positive number'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-character code'),
  body('components')
    .optional()
    .isArray()
    .withMessage('Components must be an array'),
  body('components.*.name')
    .if(body('components').exists())
    .notEmpty()
    .withMessage('Component name is required'),
  body('components.*.componentType')
    .if(body('components').exists())
    .isIn(['allowance', 'deduction'])
    .withMessage('Component type must be allowance or deduction'),
  body('components.*.calculationType')
    .if(body('components').exists())
    .isIn(['fixed', 'percentage'])
    .withMessage('Calculation type must be fixed or percentage'),
  body('components.*.amount')
    .if(body('components.*.calculationType').equals('fixed'))
    .isFloat({ min: 0 })
    .withMessage('Amount must be a positive number for fixed components'),
  body('components.*.percentage')
    .if(body('components.*.calculationType').equals('percentage'))
    .isFloat({ min: 0, max: 100 })
    .withMessage('Percentage must be between 0 and 100')
];

const bulkSalaryUpdateValidation = [
  body('salaryUpdates')
    .isArray({ min: 1 })
    .withMessage('Salary updates must be a non-empty array'),
  body('salaryUpdates.*.employeeId')
    .isUUID()
    .withMessage('Employee ID must be a valid UUID'),
  body('salaryUpdates.*.basicSalary')
    .isFloat({ min: 0 })
    .withMessage('Basic salary must be a positive number')
];

const generatePayrollValidation = [
  body('month')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  body('year')
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Year must be between 2020 and 2100'),
  body('employeeIds')
    .optional()
    .isArray()
    .withMessage('Employee IDs must be an array'),
  body('employeeIds.*')
    .if(body('employeeIds').exists())
    .isUUID()
    .withMessage('Each employee ID must be a valid UUID')
];

const payrollStatusUpdateValidation = [
  param('id')
    .isUUID()
    .withMessage('Payroll ID must be a valid UUID'),
  body('status')
    .isIn(['draft', 'processing', 'approved', 'paid', 'cancelled', 'on-hold'])
    .withMessage('Invalid status value'),
  body('remarks')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Remarks must not exceed 500 characters')
];

const processPaymentValidation = [
  body('payrollIds')
    .isArray({ min: 1 })
    .withMessage('Payroll IDs must be a non-empty array'),
  body('payrollIds.*')
    .isUUID()
    .withMessage('Each payroll ID must be a valid UUID'),
  body('paymentMethod')
    .isIn(['bank_transfer', 'cash', 'cheque', 'online'])
    .withMessage('Invalid payment method'),
  body('paymentDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Payment date must be a valid date')
];

const generatePayslipsValidation = [
  body('payrollIds')
    .isArray({ min: 1 })
    .withMessage('Payroll IDs must be a non-empty array'),
  body('payrollIds.*')
    .isUUID()
    .withMessage('Each payroll ID must be a valid UUID')
];

const sendPayslipsValidation = [
  body('payslipIds')
    .isArray({ min: 1 })
    .withMessage('Payslip IDs must be a non-empty array'),
  body('payslipIds.*')
    .isUUID()
    .withMessage('Each payslip ID must be a valid UUID'),
  body('sendEmail')
    .optional()
    .isBoolean()
    .withMessage('Send email must be a boolean value')
];

const employeeIdParamValidation = [
  param('employeeId')
    .isUUID()
    .withMessage('Employee ID must be a valid UUID')
];

const payrollIdParamValidation = [
  param('id')
    .isUUID()
    .withMessage('Payroll ID must be a valid UUID')
];

const payslipIdParamValidation = [
  param('id')
    .isUUID()
    .withMessage('Payslip ID must be a valid UUID')
];

const payrollQueryValidation = [
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Year must be between 2020 and 2100'),
  query('status')
    .optional()
    .isIn(['draft', 'processing', 'approved', 'paid', 'cancelled', 'on-hold'])
    .withMessage('Invalid status value'),
  query('employeeId')
    .optional()
    .isUUID()
    .withMessage('Employee ID must be a valid UUID')
];

const reportQueryValidation = [
  query('month')
    .optional()
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),
  query('year')
    .optional()
    .isInt({ min: 2020, max: 2100 })
    .withMessage('Year must be between 2020 and 2100'),
  query('department')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Department name must be between 1 and 100 characters'),
  query('employeeId')
    .optional()
    .isUUID()
    .withMessage('Employee ID must be a valid UUID'),
  query('format')
    .optional()
    .isIn(['excel', 'pdf'])
    .withMessage('Format must be excel or pdf')
];

module.exports = {
  salaryStructureValidation,
  bulkSalaryUpdateValidation,
  generatePayrollValidation,
  payrollStatusUpdateValidation,
  processPaymentValidation,
  generatePayslipsValidation,
  sendPayslipsValidation,
  employeeIdParamValidation,
  payrollIdParamValidation,
  payslipIdParamValidation,
  payrollQueryValidation,
  reportQueryValidation
};