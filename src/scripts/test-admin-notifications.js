require('dotenv').config();
const adminNotificationService = require('../services/adminNotificationService');

/**
 * Test Admin Notification Service
 *
 * Run this to test if admin notifications are working properly
 */

async function testNotifications() {
  console.log('🧪 TESTING ADMIN NOTIFICATIONS\n');
  console.log('═'.repeat(60));

  // Use a test organization ID (replace with actual org ID from your database)
  const testOrgId = process.argv[2];

  if (!testOrgId) {
    console.log('\n❌ Usage: node test-admin-notifications.js <ORGANIZATION_ID>\n');
    console.log('Example:');
    console.log('  node src/scripts/test-admin-notifications.js fb1ed0f2-f928-4ad4-8783-2ddcf47ee9dc\n');
    process.exit(1);
  }

  const tests = [
    {
      name: '1. Employee Registration',
      fn: () => adminNotificationService.notifyEmployeeRegistered(testOrgId, {
        employeeId: 'test-123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'employee',
        department: 'IT'
      })
    },
    {
      name: '2. Payroll Generation Started',
      fn: () => adminNotificationService.notifyPayrollGenerationStarted(testOrgId, {
        month: 11,
        year: 2025,
        employeeCount: 50
      })
    },
    {
      name: '3. Payroll Generation Completed',
      fn: () => adminNotificationService.notifyPayrollGenerationCompleted(testOrgId, {
        month: 11,
        year: 2025,
        totalEmployees: 50,
        successCount: 50,
        totalAmount: 2450000
      })
    },
    {
      name: '4. Late Arrival Alert',
      fn: () => adminNotificationService.notifyLateArrival(testOrgId, {
        employeeId: 'test-123',
        employeeName: 'John Doe',
        lateByMinutes: 45,
        checkInTime: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0]
      })
    },
    {
      name: '5. Emergency Leave Request',
      fn: () => adminNotificationService.notifyEmergencyLeaveRequest(testOrgId, {
        leaveId: 'leave-123',
        employeeId: 'test-123',
        employeeName: 'John Doe',
        leaveType: 'Sick Leave',
        startDate: '2025-11-05',
        endDate: '2025-11-06',
        days: 2,
        reason: 'Medical emergency'
      })
    },
    {
      name: '6. Asset Request',
      fn: () => adminNotificationService.notifyAssetRequest(testOrgId, {
        requestId: 'asset-123',
        employeeId: 'test-123',
        employeeName: 'John Doe',
        assetType: 'Laptop',
        category: 'Electronics',
        priority: 'high',
        estimatedValue: 75000
      })
    },
    {
      name: '7. High-Value Expense',
      fn: () => adminNotificationService.notifyHighValueExpense(testOrgId, {
        expenseId: 'expense-123',
        employeeId: 'test-123',
        employeeName: 'John Doe',
        amount: 15000,
        expenseCategory: 'Travel',
        threshold: 10000
      })
    },
    {
      name: '8. Failed Login Attempts',
      fn: () => adminNotificationService.notifyFailedLoginAttempts(testOrgId, {
        email: 'suspicious@example.com',
        attemptCount: 5,
        ipAddress: '192.168.1.100',
        location: 'Mumbai, India',
        timestamp: new Date().toISOString()
      })
    },
    {
      name: '9. Project Deadline Approaching',
      fn: () => adminNotificationService.notifyProjectDeadlineApproaching(testOrgId, {
        projectId: 'proj-123',
        projectName: 'Website Redesign',
        deadline: '2025-11-10',
        daysRemaining: 3,
        completionPercentage: 65
      })
    },
    {
      name: '10. Low Performance Score',
      fn: () => adminNotificationService.notifyLowPerformanceScore(testOrgId, {
        employeeId: 'test-123',
        employeeName: 'John Doe',
        score: 2.0,
        reviewer: 'Manager Name',
        threshold: 2.5
      })
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const test of tests) {
    try {
      console.log(`\n${test.name}`);
      console.log('─'.repeat(60));

      const result = await test.fn();

      if (result.success) {
        console.log('✅ PASS - Notification sent successfully');
        console.log(`   Notification ID: ${result.notificationId || 'N/A'}`);
        console.log(`   Recipients: ${result.recipients || 'N/A'}`);
        successCount++;
      } else {
        console.log('❌ FAIL - Notification failed');
        console.log(`   Error: ${result.error}`);
        failCount++;
      }

      // Wait 1 second between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.log('❌ FAIL - Exception thrown');
      console.log(`   Error: ${error.message}`);
      failCount++;
    }
  }

  console.log('\n');
  console.log('═'.repeat(60));
  console.log('📊 TEST RESULTS:\n');
  console.log(`Total tests: ${tests.length}`);
  console.log(`✅ Passed: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`Success rate: ${Math.round((successCount / tests.length) * 100)}%`);
  console.log('');

  if (successCount === tests.length) {
    console.log('🎉 ALL TESTS PASSED!');
    console.log('✅ Admin notification system is working correctly.\n');
    console.log('📱 Check your admin user\'s mobile device for notifications.');
    console.log('   Make sure admin user has:');
    console.log('   - Logged into mobile app');
    console.log('   - Allowed push notifications');
    console.log('   - Same organization ID as test');
    console.log('');
  } else {
    console.log('⚠️  SOME TESTS FAILED!');
    console.log('');
    console.log('Possible issues:');
    console.log('1. OneSignal credentials not configured in .env');
    console.log('2. Admin user not registered in OneSignal');
    console.log('3. Network connectivity issues');
    console.log('4. Organization ID doesn\'t have admin users');
    console.log('');
    console.log('Troubleshooting:');
    console.log('- Check .env has ONESIGNAL_APP_ID and ONESIGNAL_API_KEY');
    console.log('- Verify admin user logged into mobile app');
    console.log('- Check server logs for errors');
    console.log('');
  }

  process.exit(failCount > 0 ? 1 : 0);
}

// Run tests
testNotifications().catch(error => {
  console.error('❌ Fatal error:', error.message);
  console.error(error.stack);
  process.exit(1);
});
