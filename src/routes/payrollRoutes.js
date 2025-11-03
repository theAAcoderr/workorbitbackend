const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payrollController');
const { authMiddleware } = require('../middleware/auth');
const { cacheMiddleware } = require('../config/redis');
const {
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
} = require('../validators/payrollValidator');

// ============= SALARY STRUCTURE ROUTES =============

/**
 * @route   POST /api/v1/payroll/salary-structure
 * @desc    Create or update salary structure for an employee
 * @access  Private (HR/Admin only)
 */
router.post(
  '/salary-structure',
  authMiddleware,
  ...salaryStructureValidation,
  payrollController.createSalaryStructure
);

/**
 * @route   GET /api/v1/payroll/salary-structure/:employeeId
 * @desc    Get salary structure for an employee
 * @access  Private (HR/Admin only)
 */
router.get(
  '/salary-structure/:employeeId',
  authMiddleware,
  cacheMiddleware(300),
  ...employeeIdParamValidation,
  payrollController.getSalaryStructure
);

/**
 * @route   PUT /api/v1/payroll/salary-structure/:employeeId
 * @desc    Update salary structure for an employee
 * @access  Private (HR/Admin only)
 */
router.put(
  '/salary-structure/:employeeId',
  authMiddleware,
  ...employeeIdParamValidation,
  payrollController.updateSalaryStructure
);

/**
 * @route   POST /api/v1/payroll/bulk-salary-update
 * @desc    Bulk update salaries for multiple employees
 * @access  Private (HR/Admin only)
 */
router.post(
  '/bulk-salary-update',
  authMiddleware,
  ...bulkSalaryUpdateValidation,
  payrollController.bulkUpdateSalaries
);

// ============= PAYROLL PROCESSING ROUTES =============

/**
 * @route   POST /api/v1/payroll/generate
 * @desc    Generate payroll for employees for a specific month/year
 * @access  Private (HR/Admin only)
 */
router.post(
  '/generate',
  authMiddleware,
  ...generatePayrollValidation,
  payrollController.generatePayroll
);

/**
 * @route   POST /api/v1/payroll/process-payment
 * @desc    Process payment for multiple payrolls
 * @access  Private (HR/Admin only)
 * NOTE: Must be before /:id routes
 */
router.post(
  '/process-payment',
  authMiddleware,
  ...processPaymentValidation,
  payrollController.processPayment
);

/**
 * @route   GET /api/v1/payroll
 * @desc    Get payrolls with filters
 * @access  Private (HR/Admin only)
 */
router.get(
  '/',
  authMiddleware,
  ...payrollQueryValidation,
  payrollController.getPayrolls
);

/**
 * @route   GET /api/v1/payroll/my-payslips
 * @desc    Get current user's payslips
 * @access  Private (Employee)
 * NOTE: This must be defined BEFORE /:id route
 */
router.get(
  '/my-payslips',
  authMiddleware,
  payrollController.getEmployeePayslips
);

/**
 * @route   GET /api/v1/payroll/:id
 * @desc    Get specific payroll by ID
 * @access  Private (HR/Admin only)
 */
router.get(
  '/:id',
  authMiddleware,
  ...payrollIdParamValidation,
  payrollController.getPayrollById
);

/**
 * @route   PUT /api/v1/payroll/:id/status
 * @desc    Update payroll status (approve, cancel, etc.)
 * @access  Private (HR/Admin only)
 */
router.put(
  '/:id/status',
  authMiddleware,
  ...payrollStatusUpdateValidation,
  payrollController.updatePayrollStatus
);

// ============= PAYSLIP ROUTES =============

/**
 * @route   POST /api/v1/payroll/generate-payslips
 * @desc    Generate payslips for processed payrolls
 * @access  Private (HR/Admin only)
 */
router.post(
  '/generate-payslips',
  authMiddleware,
  ...generatePayslipsValidation,
  payrollController.generatePayslips
);

/**
 * @route   POST /api/v1/payroll/send-payslips
 * @desc    Send payslips to employees via email
 * @access  Private (HR/Admin only)
 */
router.post(
  '/send-payslips',
  authMiddleware,
  ...sendPayslipsValidation,
  payrollController.sendPayslips
);

/**
 * @route   GET /api/v1/payroll/employee-payslips/:employeeId
 * @desc    Get payslips for a specific employee
 * @access  Private (HR/Admin can access any employee)
 */
router.get(
  '/employee-payslips/:employeeId',
  authMiddleware,
  ...employeeIdParamValidation,
  payrollController.getEmployeePayslips
);

/**
 * @route   GET /api/v1/payroll/payslip/:id
 * @desc    Get specific payslip by ID
 * @access  Private (Employee can access own, HR/Admin can access any)
 */
router.get(
  '/payslip/:id',
  authMiddleware,
  ...payslipIdParamValidation,
  payrollController.getPayslipById
);

// ============= REPORTING ROUTES =============

/**
 * @route   GET /api/v1/payroll/reports/summary
 * @desc    Get payroll summary report
 * @access  Private (HR/Admin only)
 */
router.get(
  '/reports/summary',
  authMiddleware,
  ...reportQueryValidation,
  payrollController.getPayrollSummary
);

/**
 * @route   GET /api/v1/payroll/reports/department-wise
 * @desc    Get department-wise payroll report
 * @access  Private (HR/Admin only)
 */
router.get(
  '/reports/department-wise',
  authMiddleware,
  ...reportQueryValidation,
  payrollController.getDepartmentWiseReport
);

/**
 * @route   GET /api/v1/payroll/reports/yearly
 * @desc    Get yearly payroll report
 * @access  Private (HR/Admin only)
 */
router.get(
  '/reports/yearly',
  authMiddleware,
  ...reportQueryValidation,
  payrollController.getYearlyReport
);

/**
 * @route   GET /api/v1/payroll/reports/export
 * @desc    Export payroll report as Excel or PDF
 * @access  Private (HR/Admin only)
 */
router.get(
  '/reports/export',
  authMiddleware,
  ...reportQueryValidation,
  payrollController.exportPayrollReport
);

// ============= DEBUG ROUTES =============

/**
 * @route   GET /api/v1/payroll/debug
 * @desc    Debug payroll data for troubleshooting
 * @access  Private (HR/Admin only)
 */
router.get(
  '/debug',
  authMiddleware,
  payrollController.debugPayrollData
);

/**
 * @route   POST /api/v1/payroll/debug/create-sample-salary-structures
 * @desc    Create sample salary structures for testing
 * @access  Private (HR/Admin only)
 */
router.post(
  '/debug/create-sample-salary-structures',
  authMiddleware,
  payrollController.createSampleSalaryStructures
);

/**
 * @route   POST /api/v1/payroll/debug/create-sample-payslips
 * @desc    Create sample payslips for testing
 * @access  Private (HR/Admin only)
 */
router.post(
  '/debug/create-sample-payslips',
  authMiddleware,
  payrollController.createSamplePayslips
);

module.exports = router;