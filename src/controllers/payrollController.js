const payrollService = require('../services/payrollService');
const { validationResult } = require('express-validator');
const { User, SalaryStructure, Organization, Payslip, Payroll } = require('../models');
const oneSignalService = require('../services/oneSignalService');
const adminNotificationService = require('../services/adminNotificationService');

class PayrollController {
  // ============= SALARY STRUCTURE ENDPOINTS =============

  async createSalaryStructure(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const structureData = {
        ...req.body,
        organizationId: req.user.organizationId
      };

      const structure = await payrollService.createSalaryStructure(structureData);

      res.status(201).json({
        success: true,
        message: 'Salary structure created successfully',
        data: structure
      });
    } catch (error) {
      console.error('Create salary structure error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getSalaryStructure(req, res) {
    try {
      const { employeeId } = req.params;
      const structure = await payrollService.getSalaryStructure(
        employeeId,
        req.user.organizationId
      );

      if (!structure) {
        // Return 200 with null data instead of 404
        // This allows the frontend to handle missing salary structures gracefully
        return res.status(200).json({
          success: true,
          message: 'No salary structure configured for this employee yet',
          data: null,
          needsConfiguration: true
        });
      }

      res.json({
        success: true,
        data: structure,
        needsConfiguration: false
      });
    } catch (error) {
      console.error('Get salary structure error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updateSalaryStructure(req, res) {
    try {
      const { employeeId } = req.params;

      const structure = await payrollService.updateSalaryStructure(
        employeeId,
        req.body,
        req.user.organizationId
      );

      res.json({
        success: true,
        message: 'Salary structure updated successfully',
        data: structure
      });
    } catch (error) {
      console.error('Update salary structure error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async bulkUpdateSalaries(req, res) {
    try {
      const { salaryUpdates } = req.body;

      const results = await payrollService.bulkUpdateSalaries(
        salaryUpdates,
        req.user.organizationId,
        req.user.id
      );

      res.json({
        success: true,
        message: `Updated salaries for ${results.length} employees`,
        data: results
      });
    } catch (error) {
      console.error('Bulk update salaries error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ============= PAYROLL PROCESSING ENDPOINTS =============

  async generatePayroll(req, res) {
    try {
      const { month, year, employeeIds } = req.body;

      // 🔔 ADMIN NOTIFICATION: Payroll generation started
      const employeeCount = employeeIds ? employeeIds.length : await User.count({
        where: { organizationId: req.user.organizationId, status: 'active' }
      });

      await adminNotificationService.notifyPayrollGenerationStarted(
        req.user.organizationId,
        { month, year, employeeCount }
      ).catch(err => console.error('Admin notification error:', err));

      const payrolls = await payrollService.generatePayroll({
        month,
        year,
        employeeIds,
        organizationId: req.user.organizationId,
        processedBy: req.user.id
      });

      // Send notifications to all employees whose payroll was generated
      try {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthName = monthNames[month - 1];

        for (const payroll of payrolls) {
          await oneSignalService.sendToUser(
            payroll.employeeId.toString(),
            {
              title: `💰 Payroll Generated - ${monthName} ${year}`,
              message: `Your payroll for ${monthName} ${year} has been processed. Net Pay: ₹${payroll.netPay}`,
              data: {
                type: 'payroll_generated',
                payrollId: payroll.id,
                month: month,
                year: year,
                grossPay: payroll.grossPay,
                netPay: payroll.netPay,
                timestamp: new Date().toISOString()
              }
            }
          );
        }

        console.log(`✅ Payroll generation notifications sent to ${payrolls.length} employees`);
      } catch (notificationError) {
        console.error('⚠️ Failed to send payroll generation notifications:', notificationError);
        // Don't fail the response if notification fails
      }

      // 🔔 ADMIN NOTIFICATION: Payroll generation completed
      const totalAmount = payrolls.reduce((sum, p) => sum + (p.netPay || 0), 0);
      const successCount = payrolls.filter(p => p.status === 'generated' || p.status === 'approved').length;

      await adminNotificationService.notifyPayrollGenerationCompleted(
        req.user.organizationId,
        {
          month,
          year,
          totalEmployees: payrolls.length,
          successCount,
          totalAmount
        }
      ).catch(err => console.error('Admin notification error:', err));

      res.status(201).json({
        success: true,
        message: `Generated payroll for ${payrolls.length} employees`,
        data: payrolls
      });
    } catch (error) {
      console.error('Generate payroll error:', error);

      // 🔔 ADMIN NOTIFICATION: Payroll generation error
      await adminNotificationService.notifyPayrollGenerationError(
        req.user.organizationId,
        {
          month: req.body.month,
          year: req.body.year,
          errorCount: 1,
          errorDetails: error.message
        }
      ).catch(err => console.error('Admin notification error:', err));

      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getPayrolls(req, res) {
    try {
      const { month, year, status, employeeId } = req.query;

      const filters = {
        month: month ? parseInt(month) : undefined,
        year: year ? parseInt(year) : undefined,
        status,
        employeeId,
        organizationId: req.user.organizationId
      };

      const payrolls = await payrollService.getPayrolls(filters);

      res.json({
        success: true,
        data: payrolls
      });
    } catch (error) {
      console.error('Get payrolls error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getPayrollById(req, res) {
    try {
      const payroll = await payrollService.getPayrollById(
        req.params.id,
        req.user.organizationId
      );

      if (!payroll) {
        return res.status(404).json({
          success: false,
          message: 'Payroll not found'
        });
      }

      res.json({
        success: true,
        data: payroll
      });
    } catch (error) {
      console.error('Get payroll error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async updatePayrollStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;

      const payroll = await payrollService.updatePayrollStatus(
        id,
        status,
        req.user.id,
        remarks,
        req.user.organizationId
      );

      res.json({
        success: true,
        message: `Payroll status updated to ${status}`,
        data: payroll
      });
    } catch (error) {
      console.error('Update payroll status error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async processPayment(req, res) {
    try {
      const { payrollIds, paymentMethod, paymentDate } = req.body;

      const results = await payrollService.processPayment({
        payrollIds,
        paymentMethod,
        paymentDate,
        processedBy: req.user.id,
        organizationId: req.user.organizationId
      });

      // Send notifications to employees after payment processed
      try {
        for (const result of results) {
          await oneSignalService.sendToUser(
            result.employeeId.toString(),
            {
              title: '✅ Salary Payment Processed',
              message: `Your salary of ₹${result.netPay} has been processed via ${paymentMethod}`,
              data: {
                type: 'payment_processed',
                payrollId: result.id,
                amount: result.netPay,
                paymentMethod: paymentMethod,
                paymentDate: paymentDate,
                timestamp: new Date().toISOString()
              }
            }
          );
        }
        console.log(`✅ Payment processing notifications sent to ${results.length} employees`);
      } catch (notificationError) {
        console.error('⚠️ Failed to send payment notifications:', notificationError);
        // Don't fail the response if notification fails
      }

      res.json({
        success: true,
        message: `Processed payment for ${results.length} payrolls`,
        data: results
      });
    } catch (error) {
      console.error('Process payment error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ============= PAYSLIP ENDPOINTS =============

  async generatePayslips(req, res) {
    try {
      const { payrollIds } = req.body;

      const payslips = await payrollService.generatePayslips(
        payrollIds,
        req.user.id,
        req.user.organizationId
      );

      // Send notifications to employees when payslip is available
      try {
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        for (const payslip of payslips) {
          const monthName = monthNames[(payslip.month || 1) - 1];

          await oneSignalService.sendToUser(
            payslip.employeeId.toString(),
            {
              title: '📄 Payslip Available',
              message: `Your payslip for ${monthName} ${payslip.year} is now available for download`,
              data: {
                type: 'payslip_available',
                payslipId: payslip.id,
                month: payslip.month,
                year: payslip.year,
                timestamp: new Date().toISOString()
              }
            }
          );
        }
        console.log(`✅ Payslip availability notifications sent to ${payslips.length} employees`);
      } catch (notificationError) {
        console.error('⚠️ Failed to send payslip notifications:', notificationError);
        // Don't fail the response if notification fails
      }

      res.status(201).json({
        success: true,
        message: `Generated ${payslips.length} payslips`,
        data: payslips
      });
    } catch (error) {
      console.error('Generate payslips error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getEmployeePayslips(req, res) {
    try {
      const employeeId = req.params.employeeId || req.user.id;

      // Check if user is accessing their own payslips or has permission
      if (employeeId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'hr') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to access payslips'
        });
      }

      const payslips = await payrollService.getEmployeePayslips(
        employeeId,
        req.user.organizationId
      );

      res.json({
        success: true,
        data: payslips
      });
    } catch (error) {
      console.error('Get employee payslips error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getPayslipById(req, res) {
    try {
      const payslip = await payrollService.getPayslipById(
        req.params.id,
        req.user.organizationId
      );

      if (!payslip) {
        return res.status(404).json({
          success: false,
          message: 'Payslip not found'
        });
      }

      // Check if user has permission to access this payslip
      if (payslip.employeeId !== req.user.id &&
          req.user.role !== 'admin' &&
          req.user.role !== 'hr') {
        return res.status(403).json({
          success: false,
          message: 'Unauthorized to access this payslip'
        });
      }

      res.json({
        success: true,
        data: payslip
      });
    } catch (error) {
      console.error('Get payslip error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async sendPayslips(req, res) {
    try {
      const { payslipIds, sendEmail = true } = req.body;

      const results = await payrollService.sendPayslips(
        payslipIds,
        sendEmail,
        req.user.organizationId
      );

      res.json({
        success: true,
        message: `Sent ${results.length} payslips`,
        data: results
      });
    } catch (error) {
      console.error('Send payslips error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ============= REPORTS ENDPOINTS =============

  async getPayrollSummary(req, res) {
    try {
      const { month, year, department } = req.query;

      const summary = await payrollService.getPayrollSummary({
        month: month ? parseInt(month) : undefined,
        year: year ? parseInt(year) : undefined,
        department,
        organizationId: req.user.organizationId
      });

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Get payroll summary error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getDepartmentWiseReport(req, res) {
    try {
      const { month, year } = req.query;

      const report = await payrollService.getDepartmentWiseReport({
        month: month ? parseInt(month) : new Date().getMonth() + 1,
        year: year ? parseInt(year) : new Date().getFullYear(),
        organizationId: req.user.organizationId
      });

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Get department wise report error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async getYearlyReport(req, res) {
    try {
      const { year, employeeId } = req.query;

      const report = await payrollService.getYearlyReport({
        year: year ? parseInt(year) : new Date().getFullYear(),
        employeeId,
        organizationId: req.user.organizationId
      });

      res.json({
        success: true,
        data: report
      });
    } catch (error) {
      console.error('Get yearly report error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async exportPayrollReport(req, res) {
    try {
      const { month, year, format = 'excel' } = req.query;

      const report = await payrollService.exportPayrollReport({
        month: month ? parseInt(month) : new Date().getMonth() + 1,
        year: year ? parseInt(year) : new Date().getFullYear(),
        format,
        organizationId: req.user.organizationId
      });

      // Set appropriate headers for file download
      const filename = `payroll_report_${year}_${month}.${format === 'excel' ? 'xlsx' : 'pdf'}`;
      res.setHeader('Content-Type', format === 'excel'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

      res.send(report);
    } catch (error) {
      console.error('Export payroll report error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // ============= DEBUG ENDPOINTS =============

  async createSampleSalaryStructures(req, res) {
    try {
      const organizationId = req.user.organizationId;
      const { User: UserModel, SalaryStructure } = require('../models');
const adminNotificationService = require('../services/adminNotificationService');

      // Get all active users
      const users = await UserModel.findAll({
        where: { organizationId, status: 'active' },
        attributes: ['id', 'name', 'email']
      });

      const results = [];
      for (const user of users) {
        // Check if salary structure already exists
        const existingStructure = await SalaryStructure.findOne({
          where: { employeeId: user.id, organizationId, isActive: true }
        });

        if (!existingStructure) {
          // Create a basic salary structure
          const structure = await SalaryStructure.create({
            employeeId: user.id,
            organizationId,
            basicSalary: 50000, // ₹50,000 basic salary
            ctc: 600000, // ₹6,00,000 annual CTC
            effectiveDate: new Date(),
            isActive: true
          });

          results.push({
            employeeId: user.id,
            employeeName: user.name,
            structureId: structure.id,
            basicSalary: structure.basicSalary,
            status: 'created'
          });
        } else {
          results.push({
            employeeId: user.id,
            employeeName: user.name,
            structureId: existingStructure.id,
            basicSalary: existingStructure.basicSalary,
            status: 'already_exists'
          });
        }
      }

      res.json({
        success: true,
        message: `Processed salary structures for ${users.length} employees`,
        data: results
      });
    } catch (error) {
      console.error('Create sample salary structures error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async createSamplePayslips(req, res) {
    try {
      const organizationId = req.user.organizationId;

      console.log('=== CREATING SAMPLE PAYSLIPS ===');
      console.log('Organization ID:', organizationId);

      // Get active users with salary structures
      const users = await User.findAll({
        where: {
          organizationId,
          status: 'active'
        },
        include: [{
          model: SalaryStructure,
          as: 'salaryStructures',
          where: { isActive: true },
          required: false
        }],
        attributes: ['id', 'name', 'email', 'employeeId', 'department', 'designation']
      });

      console.log(`Found ${users.length} active users`);

      if (users.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No active employees found. Add employees first.'
        });
      }

      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      const results = [];

      for (const user of users) {
        console.log(`Processing user: ${user.name} (${user.id})`);

        // Check if payslip already exists for current month
        const existingPayslip = await Payslip.findOne({
          where: {
            employeeId: user.id,
            organizationId,
            month: month.toString().padStart(2, '0'),
            year
          }
        });

        if (existingPayslip) {
          console.log(`Payslip already exists for ${user.name}`);
          results.push({
            employeeId: user.id,
            employeeName: user.name,
            payslipId: existingPayslip.id,
            month,
            year,
            status: 'already_exists'
          });
          continue;
        }

        // Get salary structure or use defaults
        let basicSalary = 50000; // Default salary
        if (user.salaryStructures && user.salaryStructures.length > 0) {
          basicSalary = parseFloat(user.salaryStructures[0].basicSalary);
        }

        // Calculate sample payslip data - ensure all calculations are numeric
        const hra = Math.round((basicSalary * 0.4) * 100) / 100; // 40% HRA
        const da = Math.round((basicSalary * 0.1) * 100) / 100; // 10% DA
        const grossSalary = Math.round((basicSalary + hra + da) * 100) / 100;

        const pf = Math.round((basicSalary * 0.12) * 100) / 100; // 12% PF
        const esi = Math.round((grossSalary * 0.0175) * 100) / 100; // 1.75% ESI
        const incomeTax = Math.round((grossSalary * 0.1) * 100) / 100; // 10% tax (sample)
        const totalDeductions = Math.round((pf + esi + incomeTax) * 100) / 100;

        const netPay = Math.round((grossSalary - totalDeductions) * 100) / 100;

        console.log(`Creating payslip for ${user.name}: Basic: ${basicSalary}, Net: ${netPay}`);

        // Create payslip directly
        const payslip = await Payslip.create({
          payrollId: `sample-payroll-${user.id}`, // Sample payroll reference
          employeeId: user.id,
          organizationId,
          month: month.toString().padStart(2, '0'),
          year,
          employeeName: user.name,
          employeeCode: user.employeeId || `EMP${user.id.slice(-4)}`,
          designation: user.designation || 'Employee',
          department: user.department || 'General',
          basicSalary,
          grossSalary,
          netPay,
          allowances: {
            hra,
            da,
            other: 0
          },
          deductions: {
            pf,
            esi,
            incomeTax,
            other: 0
          },
          allowancesTotal: Math.round((hra + da) * 100) / 100,
          deductionsTotal: totalDeductions,
          taxAmount: incomeTax,
          status: 'generated',
          generatedBy: req.user.id
        });

        console.log(`Created payslip ${payslip.id} for ${user.name}`);

        results.push({
          employeeId: user.id,
          employeeName: user.name,
          payslipId: payslip.id,
          month,
          year,
          netPay: parseFloat(netPay.toFixed(2)),
          status: 'created'
        });
      }

      console.log(`Processed ${results.length} employees for payslips`);

      res.json({
        success: true,
        message: `Processed ${results.length} employees for payslips`,
        data: results
      });
    } catch (error) {
      console.error('Create sample payslips error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  async debugPayrollData(req, res) {
    try {
      const organizationId = req.user.organizationId;

      console.log('=== PAYROLL DEBUG ENDPOINT ===');
      console.log('User making request:', req.user.id, req.user.name, req.user.role);
      console.log('Organization ID:', organizationId);

      // Check organization
      const org = await Organization.findByPk(organizationId);
      console.log('Organization found:', !!org, org?.name);

      // Get all users in organization
      const allUsers = await User.findAll({
        where: { organizationId },
        attributes: ['id', 'name', 'email', 'status', 'role', 'organizationId']
      });

      // Get active users in organization
      const activeUsers = await User.findAll({
        where: { organizationId, status: 'active' },
        attributes: ['id', 'name', 'email', 'status', 'role', 'organizationId']
      });

      // Get salary structures
      const salaryStructures = await SalaryStructure.findAll({
        where: { organizationId },
        include: [{
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email']
        }]
      });

      // Get payslips
      const payslips = await Payslip.findAll({
        where: { organizationId },
        include: [{
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email']
        }],
        order: [['year', 'DESC'], ['month', 'DESC']],
        limit: 10 // Only show recent 10
      });

      // Get payrolls
      const payrolls = await Payroll.findAll({
        where: { organizationId },
        include: [{
          model: User,
          as: 'employee',
          attributes: ['id', 'name', 'email']
        }],
        order: [['year', 'DESC'], ['month', 'DESC']],
        limit: 10 // Only show recent 10
      });

      const debugData = {
        organization: org ? { id: org.id, name: org.name } : null,
        totalUsers: allUsers.length,
        activeUsers: activeUsers.length,
        salaryStructures: salaryStructures.length,
        payslips: payslips.length,
        payrolls: payrolls.length,
        users: allUsers,
        activeUsersDetails: activeUsers,
        salaryStructuresDetails: salaryStructures,
        payslipsDetails: payslips,
        payrollsDetails: payrolls
      };

      console.log('Debug data summary:', {
        totalUsers: debugData.totalUsers,
        activeUsers: debugData.activeUsers,
        salaryStructures: debugData.salaryStructures
      });

      res.json({
        success: true,
        data: debugData
      });
    } catch (error) {
      console.error('Debug payroll data error:', error);
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new PayrollController();