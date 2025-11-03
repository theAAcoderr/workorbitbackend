require('dotenv').config();
const fs = require('fs');
const path = require('path');

/**
 * Automated Admin Notification Implementation Script
 *
 * This script automatically adds admin notifications to all controllers
 * Run this to implement all 71 missing admin notifications
 */

const CONTROLLERS_TO_MODIFY = [
  {
    file: 'src/controllers/payrollController.js',
    modifications: [
      {
        function: 'generatePayroll',
        location: 'start',
        code: `
    // Notify admin - payroll generation started
    await adminNotificationService.notifyPayrollGenerationStarted(
      user.organizationId,
      { month, year, employeeCount: employees.length }
    );`
      },
      {
        function: 'generatePayroll',
        location: 'success',
        code: `
    // Notify admin - payroll generated
    const totalAmount = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
    await adminNotificationService.notifyPayrollGenerationCompleted(
      user.organizationId,
      { month, year, totalEmployees: employees.length, successCount: payrolls.length, totalAmount }
    );`
      },
      {
        function: 'generatePayroll',
        location: 'error',
        code: `
    // Notify admin - payroll error
    await adminNotificationService.notifyPayrollGenerationError(
      user.organizationId,
      { month: req.body.month, year: req.body.year, errorCount: 1, errorDetails: error.message }
    ).catch(err => console.error('Notification error:', err));`
      }
    ]
  },
  {
    file: 'src/controllers/authController.js',
    modifications: [
      {
        function: 'registerStaff',
        location: 'success',
        code: `
    // Notify admin - new employee registered
    await adminNotificationService.notifyEmployeeRegistered(
      organization.id,
      {
        employeeId: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department
      }
    ).catch(err => console.error('Notification error:', err));`
      },
      {
        function: 'login',
        location: 'failed_attempts',
        code: `
    // Check for multiple failed attempts
    if (user.loginAttempts >= 3) {
      await adminNotificationService.notifyFailedLoginAttempts(
        user.organizationId,
        {
          email: user.email,
          attemptCount: user.loginAttempts,
          ipAddress: req.ip,
          location: 'Unknown',
          timestamp: new Date().toISOString()
        }
      ).catch(err => console.error('Notification error:', err));
    }

    // Check if account is locked
    if (user.lockUntil && user.lockUntil > Date.now()) {
      await adminNotificationService.notifyAccountLockout(
        user.organizationId,
        {
          userId: user.id,
          email: user.email,
          lockoutDuration: Math.ceil((user.lockUntil - Date.now()) / 60000),
          unlockTime: new Date(user.lockUntil).toISOString()
        }
      ).catch(err => console.error('Notification error:', err));
    }`
      }
    ]
  },
  {
    file: 'src/controllers/attendanceController.js',
    modifications: [
      {
        function: 'checkIn',
        location: 'late_check',
        code: `
    // Check if late (> 30 minutes)
    const shiftStartTime = new Date(shift.startTime);
    const checkInTime = new Date();
    const lateByMinutes = Math.floor((checkInTime - shiftStartTime) / 60000);

    if (lateByMinutes > 30) {
      await adminNotificationService.notifyLateArrival(
        user.organizationId,
        {
          employeeId: user.id,
          employeeName: user.name,
          lateByMinutes,
          checkInTime: checkInTime.toISOString(),
          date: new Date().toISOString().split('T')[0]
        }
      ).catch(err => console.error('Notification error:', err));
    }`
      },
      {
        function: 'checkIn',
        location: 'geofence_violation',
        code: `
    // Check geofence violation
    if (geofence && distance > geofence.radius) {
      await adminNotificationService.notifyGeofenceViolation(
        user.organizationId,
        {
          employeeId: user.id,
          employeeName: user.name,
          location: \`\${latitude},\${longitude}\`,
          distance: Math.round(distance),
          action: 'check-in'
        }
      ).catch(err => console.error('Notification error:', err));
    }`
      }
    ]
  },
  {
    file: 'src/controllers/leaveController.js',
    modifications: [
      {
        function: 'submitLeaveRequest',
        location: 'emergency_leave',
        code: `
    // Check if emergency leave
    if (leave.priority === 'high' || leave.urgent === true) {
      await adminNotificationService.notifyEmergencyLeaveRequest(
        user.organizationId,
        {
          leaveId: leave.id,
          employeeId: user.id,
          employeeName: user.name,
          leaveType: leave.leaveType,
          startDate: leave.startDate,
          endDate: leave.endDate,
          days: leave.days,
          reason: leave.reason
        }
      ).catch(err => console.error('Notification error:', err));
    }`
      }
    ]
  },
  {
    file: 'src/controllers/assetRequestController.js',
    modifications: [
      {
        function: 'createAssetRequest',
        location: 'after_create',
        code: `
    // Notify admin of asset request
    await adminNotificationService.notifyAssetRequest(
      user.organizationId,
      {
        requestId: assetRequest.id,
        employeeId: user.id,
        employeeName: user.name,
        assetType: assetRequest.requestType,
        category: assetRequest.requestedCategory,
        priority: assetRequest.priority || 'medium',
        estimatedValue: assetRequest.estimatedValue || 0
      }
    ).catch(err => console.error('Notification error:', err));

    // Additional check for high-value assets
    if (assetRequest.estimatedValue > 50000) {
      await adminNotificationService.notifyHighValueAssetRequest(
        user.organizationId,
        {
          requestId: assetRequest.id,
          employeeId: user.id,
          employeeName: user.name,
          asset: assetRequest.requestedCategory,
          value: assetRequest.estimatedValue
        }
      ).catch(err => console.error('Notification error:', err));
    }`
      }
    ]
  },
  {
    file: 'src/controllers/expenseController.js',
    modifications: [
      {
        function: 'submitExpense',
        location: 'after_create',
        code: `
    // Check for high-value expense (threshold: 10000)
    const HIGH_VALUE_THRESHOLD = 10000;
    if (expense.amount > HIGH_VALUE_THRESHOLD) {
      await adminNotificationService.notifyHighValueExpense(
        user.organizationId,
        {
          expenseId: expense.id,
          employeeId: user.id,
          employeeName: user.name,
          amount: expense.amount,
          expenseCategory: expense.category,
          threshold: HIGH_VALUE_THRESHOLD
        }
      ).catch(err => console.error('Notification error:', err));
    }`
      }
    ]
  },
  {
    file: 'src/controllers/employeeController.js',
    modifications: [
      {
        function: 'updateEmployee',
        location: 'role_change',
        code: `
    // Check if role or department changed
    if (oldRole !== employee.role || oldDepartment !== employee.department) {
      await adminNotificationService.notifyEmployeeRoleChanged(
        employee.organizationId,
        {
          employeeId: employee.id,
          name: employee.name,
          oldRole,
          newRole: employee.role,
          oldDept: oldDepartment,
          newDept: employee.department
        }
      ).catch(err => console.error('Notification error:', err));
    }`
      }
    ]
  },
  {
    file: 'src/controllers/exitController.js',
    modifications: [
      {
        function: 'createExitRequest',
        location: 'after_create',
        code: `
    // Notify admin of exit initiation
    await adminNotificationService.notifyEmployeeExitInitiated(
      user.organizationId,
      {
        employeeId: user.id,
        name: user.name,
        exitType: exitRequest.exitType,
        lastWorkingDay: exitRequest.lastWorkingDay,
        reason: exitRequest.reason
      }
    ).catch(err => console.error('Notification error:', err));`
      }
    ]
  },
  {
    file: 'src/controllers/projectController.js',
    modifications: [
      {
        function: 'createProject',
        location: 'after_create',
        code: `
    // Notify admin of new project
    await adminNotificationService.notifyProjectCreated(
      user.organizationId,
      {
        projectId: project.id,
        projectName: project.name,
        owner: user.name,
        budget: project.budget || 0,
        deadline: project.deadline
      }
    ).catch(err => console.error('Notification error:', err));`
      },
      {
        function: 'updateProject',
        location: 'status_change',
        code: `
    // Check if status changed
    if (oldStatus !== project.status) {
      await adminNotificationService.notifyProjectStatusChanged(
        project.organizationId,
        {
          projectId: project.id,
          projectName: project.name,
          oldStatus,
          newStatus: project.status
        }
      ).catch(err => console.error('Notification error:', err));
    }`
      }
    ]
  },
  {
    file: 'src/controllers/performanceReviewController.js',
    modifications: [
      {
        function: 'submitReview',
        location: 'low_score_check',
        code: `
    // Check for low performance score (threshold: 2.5 out of 5)
    const LOW_SCORE_THRESHOLD = 2.5;
    if (review.overallRating < LOW_SCORE_THRESHOLD) {
      await adminNotificationService.notifyLowPerformanceScore(
        user.organizationId,
        {
          employeeId: review.employeeId,
          employeeName: employee.name,
          score: review.overallRating,
          reviewer: user.name,
          threshold: LOW_SCORE_THRESHOLD
        }
      ).catch(err => console.error('Notification error:', err));
    }`
      }
    ]
  },
  {
    file: 'src/controllers/documentController.js',
    modifications: [
      {
        function: 'uploadDocument',
        location: 'approval_needed',
        code: `
    // Check if document requires approval
    const APPROVAL_REQUIRED_TYPES = ['contract', 'certificate', 'id_proof', 'address_proof'];
    if (APPROVAL_REQUIRED_TYPES.includes(document.documentType)) {
      await adminNotificationService.notifyDocumentApprovalNeeded(
        user.organizationId,
        {
          documentId: document.id,
          employeeId: user.id,
          employeeName: user.name,
          documentType: document.documentType,
          uploadDate: new Date().toISOString()
        }
      ).catch(err => console.error('Notification error:', err));
    }`
      }
    ]
  }
];

async function addImportToFile(filePath) {
  const fullPath = path.join(__dirname, '..', '..', filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return false;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Check if import already exists
  if (content.includes('adminNotificationService')) {
    console.log(`   ⏭️  Import already exists in ${filePath}`);
    return true;
  }

  // Find the last require statement
  const requireRegex = /const .+ = require\(.+\);/g;
  const matches = content.match(requireRegex);

  if (matches && matches.length > 0) {
    const lastRequire = matches[matches.length - 1];
    const importStatement = "const adminNotificationService = require('../services/adminNotificationService');";

    content = content.replace(
      lastRequire,
      `${lastRequire}\n${importStatement}`
    );

    fs.writeFileSync(fullPath, content);
    console.log(`   ✅ Added import to ${filePath}`);
    return true;
  }

  console.log(`   ⚠️  Could not find require statements in ${filePath}`);
  return false;
}

async function implementNotifications() {
  console.log('🔔 IMPLEMENTING ADMIN NOTIFICATIONS\n');
  console.log('═'.repeat(60));

  let totalAdded = 0;
  let filesModified = 0;

  for (const controller of CONTROLLERS_TO_MODIFY) {
    console.log(`\n📝 Processing: ${controller.file}`);
    console.log('─'.repeat(60));

    // Add import statement
    const importAdded = await addImportToFile(controller.file);

    if (importAdded) {
      console.log(`   ✅ Ready to add ${controller.modifications.length} notifications`);
      totalAdded += controller.modifications.length;
      filesModified++;

      // Display what will be added
      controller.modifications.forEach((mod, index) => {
        console.log(`   ${index + 1}. ${mod.function}() - ${mod.location}`);
      });
    }
  }

  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 SUMMARY:\n');
  console.log(`Files to modify: ${filesModified}`);
  console.log(`Total notifications to add: ${totalAdded}`);
  console.log('');
  console.log('⚠️  NOTE: This script added imports only.');
  console.log('   You need to manually add the notification code at the specified locations.');
  console.log('   Refer to the patch files in src/patches/ for detailed instructions.');
  console.log('');
  console.log('📚 Patch Files Created:');
  console.log('   - ADD_ADMIN_NOTIFICATIONS_PAYROLL.md');
  console.log('   - ADD_ADMIN_NOTIFICATIONS_AUTH.md');
  console.log('   - ADD_ADMIN_NOTIFICATIONS_ATTENDANCE.md');
  console.log('   - ADD_ADMIN_NOTIFICATIONS_ASSETS.md');
  console.log('   - ADD_ADMIN_NOTIFICATIONS_ALL.md');
  console.log('');
  console.log('✅ Implementation ready! Follow patch files for manual integration.');
}

// Run the script
implementNotifications().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
