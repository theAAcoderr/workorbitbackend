# PAYROLL CONTROLLER - ADMIN NOTIFICATIONS PATCH

## File to Modify
`src/controllers/payrollController.js`

## Add Import at Top of File

```javascript
const adminNotificationService = require('../services/adminNotificationService');
```

## Modifications

### 1. generatePayroll() - Add 3 Notifications

**Location:** After line where payroll generation starts

**Add BEFORE processing:**
```javascript
// Notify admin that payroll generation started
await adminNotificationService.notifyPayrollGenerationStarted(
  user.organizationId,
  {
    month,
    year,
    employeeCount: employees.length
  }
);
```

**Add AFTER successful generation (in try block, after all payrolls created):**
```javascript
// Calculate totals
const totalAmount = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
const successCount = payrolls.length;

// Notify admin of successful completion
await adminNotificationService.notifyPayrollGenerationCompleted(
  user.organizationId,
  {
    month,
    year,
    totalEmployees: employees.length,
    successCount,
    totalAmount
  }
);
```

**Add in CATCH block:**
```javascript
// Notify admin of error
await adminNotificationService.notifyPayrollGenerationError(
  user.organizationId,
  {
    month,
    year,
    errorCount: 1,
    errorDetails: error.message
  }
);
```

### 2. approvePayroll() - Add Notification

**Location:** After finding payroll records that need approval

**Add BEFORE approval process:**
```javascript
// If approval needed, notify admin
const pendingPayrolls = await Payroll.findAll({
  where: {
    organizationId: user.organizationId,
    month,
    year,
    status: 'pending_approval'
  }
});

if (pendingPayrolls.length > 0) {
  const totalAmount = pendingPayrolls.reduce((sum, p) => sum + p.netSalary, 0);

  await adminNotificationService.notifyPayrollApprovalNeeded(
    user.organizationId,
    {
      payrollId: payrollId || 'bulk',
      month,
      year,
      totalAmount,
      employeeCount: pendingPayrolls.length
    }
  );
}
```

### 3. processPayment() or distributePayslips() - Add Notification

**Location:** After payslips are distributed to employees

**Add:**
```javascript
// Notify admin that payslips were distributed
await adminNotificationService.notifyPayslipsDistributed(
  user.organizationId,
  {
    month,
    year,
    distributedCount: successCount,
    totalCount: employees.length
  }
);
```

### 4. updateSalaryStructure() - Add Notification

**If this function exists, add:**
```javascript
// Notify admin of salary change
await adminNotificationService.notifySalaryStructureUpdated(
  user.organizationId,
  {
    employeeId: employee.id,
    employeeName: employee.name,
    oldSalary: oldSalaryAmount,
    newSalary: newSalaryAmount,
    effectiveFrom: effectiveDate
  }
);
```

## Complete Example Implementation

```javascript
// In payrollController.js - generatePayroll function

const generatePayroll = async (req, res) => {
  try {
    const user = req.user;
    const { month, year } = req.body;

    // Get all active employees
    const employees = await User.findAll({
      where: {
        organizationId: user.organizationId,
        status: 'active',
        role: { [Op.ne]: 'temp_setup' }
      }
    });

    // ✅ NEW: Notify admin - payroll generation started
    await adminNotificationService.notifyPayrollGenerationStarted(
      user.organizationId,
      {
        month,
        year,
        employeeCount: employees.length
      }
    );

    const payrolls = [];
    let successCount = 0;
    let totalAmount = 0;

    // Generate payroll for each employee
    for (const employee of employees) {
      try {
        const payroll = await payrollService.generateEmployeePayroll(employee, month, year);
        payrolls.push(payroll);
        successCount++;
        totalAmount += payroll.netSalary;
      } catch (error) {
        console.error(`Failed to generate payroll for ${employee.name}:`, error);
      }
    }

    // ✅ NEW: Notify admin - payroll generation completed
    await adminNotificationService.notifyPayrollGenerationCompleted(
      user.organizationId,
      {
        month,
        year,
        totalEmployees: employees.length,
        successCount,
        totalAmount
      }
    );

    res.json({
      success: true,
      message: `Payroll generated for ${successCount} employees`,
      data: {
        month,
        year,
        successCount,
        totalAmount,
        payrolls
      }
    });

  } catch (error) {
    console.error('Generate payroll error:', error);

    // ✅ NEW: Notify admin - payroll generation error
    await adminNotificationService.notifyPayrollGenerationError(
      user.organizationId,
      {
        month: req.body.month,
        year: req.body.year,
        errorCount: 1,
        errorDetails: error.message
      }
    ).catch(err => console.error('Failed to send error notification:', err));

    res.status(500).json({
      success: false,
      message: 'Failed to generate payroll',
      error: error.message
    });
  }
};
```

## Testing

After implementing, test with:

```bash
# Test payroll generation
curl -X POST http://localhost:5000/api/v1/payroll/generate \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"month": 11, "year": 2025}'

# Check OneSignal notifications in admin's device
# Verify 3 notifications received:
# 1. "Payroll Generation Started"
# 2. "Payroll Generated Successfully" (or error if failed)
# 3. "Payslips Distributed" (if that step runs)
```

## Expected Notifications

Admin should receive:

1. **🟠 Payroll Generation Started**
   - "Generating payroll for 11/2025 - 50 employees"

2. **🔴 Payroll Generated Successfully**
   - "Payroll for 11/2025 completed - 50/50 employees, Total: ₹2,45,000"

3. **🟡 Payslips Distributed**
   - "Payslips for 11/2025 sent to 50/50 employees"

## Priority
**CRITICAL** - Payroll is the #1 missing admin notification

## Impact
- Admin gets real-time visibility into payroll processing
- Immediate alerts for payroll errors
- Approval workflow notifications
- Salary change tracking
