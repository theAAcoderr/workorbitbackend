const oneSignalService = require('./oneSignalService');
const { logger } = require('../middleware/logger');

/**
 * Admin Notification Service
 *
 * Centralized service for sending notifications to admin users
 * Handles all admin-specific notification types with proper categorization,
 * priority levels, and consistent messaging
 */
class AdminNotificationService {
  constructor() {
    this.PRIORITIES = {
      CRITICAL: { level: 10, icon: '🔴', sound: 'critical' },
      HIGH: { level: 7, icon: '🟠', sound: 'alert' },
      MEDIUM: { level: 5, icon: '🟡', sound: 'notification' },
      LOW: { level: 3, icon: '🔵', sound: 'default' }
    };

    this.CATEGORIES = {
      EMPLOYEE: 'employee_management',
      PAYROLL: 'payroll',
      ATTENDANCE: 'attendance',
      LEAVE: 'leave_management',
      ASSET: 'asset_management',
      EXPENSE: 'expense_management',
      PROJECT: 'project_management',
      TASK: 'task_management',
      PERFORMANCE: 'performance_review',
      RECRUITMENT: 'recruitment',
      TRAINING: 'training',
      MEETING: 'meeting',
      COMPLIANCE: 'compliance',
      SECURITY: 'security',
      SYSTEM: 'system'
    };
  }

  /**
   * Send notification to admin role
   * @private
   */
  async _sendToAdmin(organizationId, { title, message, data = {}, priority = 'MEDIUM' }) {
    try {
      const priorityConfig = this.PRIORITIES[priority] || this.PRIORITIES.MEDIUM;

      // Add priority icon to title
      const fullTitle = `${priorityConfig.icon} ${title}`;

      // Add metadata
      const fullData = {
        ...data,
        priority: priority.toLowerCase(),
        priorityLevel: priorityConfig.level,
        timestamp: new Date().toISOString(),
        notificationSource: 'admin_notification_service'
      };

      const result = await oneSignalService.sendToRole(
        organizationId,
        'admin',
        {
          title: fullTitle,
          message,
          data: fullData
        }
      );

      logger.info('Admin notification sent', {
        organizationId,
        type: data.type,
        priority,
        success: result.success
      });

      return result;
    } catch (error) {
      logger.error('Admin notification error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Also send to HR role for critical items
   * @private
   */
  async _sendToAdminAndHR(organizationId, notificationData) {
    const results = await Promise.all([
      this._sendToAdmin(organizationId, notificationData),
      oneSignalService.sendToRole(organizationId, 'hr', {
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data
      })
    ]);

    return results[0]; // Return admin result
  }

  // ========================================
  // EMPLOYEE MANAGEMENT NOTIFICATIONS
  // ========================================

  /**
   * Notify admin when new employee registers
   */
  async notifyEmployeeRegistered(organizationId, { employeeId, name, email, role, department }) {
    return this._sendToAdmin(organizationId, {
      title: 'New Employee Registered',
      message: `${name} joined as ${role}${department ? ` in ${department}` : ''}`,
      data: {
        type: 'employee_registered',
        category: this.CATEGORIES.EMPLOYEE,
        employeeId,
        name,
        email,
        role,
        department
      },
      priority: 'HIGH'
    });
  }

  /**
   * Notify admin when employee profile updated
   */
  async notifyEmployeeUpdated(organizationId, { employeeId, name, changes, updatedBy }) {
    const changesSummary = Object.keys(changes).join(', ');
    return this._sendToAdmin(organizationId, {
      title: 'Employee Profile Updated',
      message: `${name}'s profile updated: ${changesSummary}`,
      data: {
        type: 'employee_updated',
        category: this.CATEGORIES.EMPLOYEE,
        employeeId,
        name,
        changes,
        updatedBy
      },
      priority: 'MEDIUM'
    });
  }

  /**
   * Notify admin when employee role/department changes
   */
  async notifyEmployeeRoleChanged(organizationId, { employeeId, name, oldRole, newRole, oldDept, newDept }) {
    const message = oldRole !== newRole && oldDept !== newDept
      ? `${name}: ${oldRole} → ${newRole}, ${oldDept} → ${newDept}`
      : oldRole !== newRole
      ? `${name}: ${oldRole} → ${newRole}`
      : `${name}: ${oldDept} → ${newDept}`;

    return this._sendToAdmin(organizationId, {
      title: 'Employee Role/Department Changed',
      message,
      data: {
        type: 'employee_role_changed',
        category: this.CATEGORIES.EMPLOYEE,
        employeeId,
        name,
        oldRole,
        newRole,
        oldDept,
        newDept
      },
      priority: 'CRITICAL'
    });
  }

  /**
   * Notify admin when employee exit initiated
   */
  async notifyEmployeeExitInitiated(organizationId, { employeeId, name, exitType, lastWorkingDay, reason }) {
    return this._sendToAdmin(organizationId, {
      title: 'Employee Exit Initiated',
      message: `${name} - ${exitType}, Last day: ${lastWorkingDay}`,
      data: {
        type: 'employee_exit_initiated',
        category: this.CATEGORIES.EMPLOYEE,
        employeeId,
        name,
        exitType,
        lastWorkingDay,
        reason
      },
      priority: 'CRITICAL'
    });
  }

  /**
   * Notify admin when employee exit completed
   */
  async notifyEmployeeExitCompleted(organizationId, { employeeId, name, exitDate }) {
    return this._sendToAdmin(organizationId, {
      title: 'Employee Exit Completed',
      message: `${name} has exited the organization on ${exitDate}`,
      data: {
        type: 'employee_exit_completed',
        category: this.CATEGORIES.EMPLOYEE,
        employeeId,
        name,
        exitDate
      },
      priority: 'HIGH'
    });
  }

  // ========================================
  // PAYROLL NOTIFICATIONS (MAJOR GAP)
  // ========================================

  /**
   * Notify admin when payroll generation starts
   */
  async notifyPayrollGenerationStarted(organizationId, { month, year, employeeCount }) {
    return this._sendToAdmin(organizationId, {
      title: 'Payroll Generation Started',
      message: `Generating payroll for ${month}/${year} - ${employeeCount} employees`,
      data: {
        type: 'payroll_generation_started',
        category: this.CATEGORIES.PAYROLL,
        month,
        year,
        employeeCount
      },
      priority: 'HIGH'
    });
  }

  /**
   * Notify admin when payroll generation completes
   */
  async notifyPayrollGenerationCompleted(organizationId, { month, year, totalEmployees, successCount, totalAmount }) {
    return this._sendToAdmin(organizationId, {
      title: 'Payroll Generated Successfully',
      message: `Payroll for ${month}/${year} completed - ${successCount}/${totalEmployees} employees, Total: ₹${totalAmount.toLocaleString()}`,
      data: {
        type: 'payroll_generation_completed',
        category: this.CATEGORIES.PAYROLL,
        month,
        year,
        totalEmployees,
        successCount,
        totalAmount
      },
      priority: 'CRITICAL'
    });
  }

  /**
   * Notify admin when payroll generation has errors
   */
  async notifyPayrollGenerationError(organizationId, { month, year, errorCount, errorDetails }) {
    return this._sendToAdmin(organizationId, {
      title: 'Payroll Generation Error',
      message: `Payroll generation failed for ${month}/${year} - ${errorCount} error(s)`,
      data: {
        type: 'payroll_generation_error',
        category: this.CATEGORIES.PAYROLL,
        month,
        year,
        errorCount,
        errorDetails
      },
      priority: 'CRITICAL'
    });
  }

  /**
   * Notify admin when payroll needs approval
   */
  async notifyPayrollApprovalNeeded(organizationId, { payrollId, month, year, totalAmount, employeeCount }) {
    return this._sendToAdmin(organizationId, {
      title: 'Payroll Approval Required',
      message: `Review and approve payroll for ${month}/${year} - ₹${totalAmount.toLocaleString()} for ${employeeCount} employees`,
      data: {
        type: 'payroll_approval_needed',
        category: this.CATEGORIES.PAYROLL,
        payrollId,
        month,
        year,
        totalAmount,
        employeeCount
      },
      priority: 'CRITICAL'
    });
  }

  /**
   * Notify admin when salary structure updated
   */
  async notifySalaryStructureUpdated(organizationId, { employeeId, employeeName, oldSalary, newSalary, effectiveFrom }) {
    const change = newSalary > oldSalary ? 'increased' : 'decreased';
    const diff = Math.abs(newSalary - oldSalary);
    return this._sendToAdmin(organizationId, {
      title: 'Salary Structure Updated',
      message: `${employeeName}'s salary ${change} by ₹${diff.toLocaleString()} (Effective: ${effectiveFrom})`,
      data: {
        type: 'salary_structure_updated',
        category: this.CATEGORIES.PAYROLL,
        employeeId,
        employeeName,
        oldSalary,
        newSalary,
        effectiveFrom
      },
      priority: 'HIGH'
    });
  }

  /**
   * Notify admin when payslips distributed
   */
  async notifyPayslipsDistributed(organizationId, { month, year, distributedCount, totalCount }) {
    return this._sendToAdmin(organizationId, {
      title: 'Payslips Distributed',
      message: `Payslips for ${month}/${year} sent to ${distributedCount}/${totalCount} employees`,
      data: {
        type: 'payslips_distributed',
        category: this.CATEGORIES.PAYROLL,
        month,
        year,
        distributedCount,
        totalCount
      },
      priority: 'MEDIUM'
    });
  }

  // ========================================
  // ATTENDANCE NOTIFICATIONS
  // ========================================

  /**
   * Notify admin of late arrival
   */
  async notifyLateArrival(organizationId, { employeeId, employeeName, lateByMinutes, checkInTime, date }) {
    if (lateByMinutes < 30) return; // Only notify if > 30 minutes

    return this._sendToAdmin(organizationId, {
      title: 'Late Arrival Alert',
      message: `${employeeName} checked in ${lateByMinutes} minutes late at ${checkInTime}`,
      data: {
        type: 'late_arrival_alert',
        category: this.CATEGORIES.ATTENDANCE,
        employeeId,
        employeeName,
        lateByMinutes,
        checkInTime,
        date,
        severity: lateByMinutes > 60 ? 'high' : 'medium'
      },
      priority: lateByMinutes > 60 ? 'HIGH' : 'MEDIUM'
    });
  }

  /**
   * Notify admin of consecutive absences
   */
  async notifyConsecutiveAbsences(organizationId, { employeeId, employeeName, absenceDays, lastSeenDate }) {
    return this._sendToAdmin(organizationId, {
      title: 'Consecutive Absences Alert',
      message: `${employeeName} absent for ${absenceDays} consecutive days (Last seen: ${lastSeenDate})`,
      data: {
        type: 'consecutive_absences_alert',
        category: this.CATEGORIES.ATTENDANCE,
        employeeId,
        employeeName,
        absenceDays,
        lastSeenDate
      },
      priority: 'CRITICAL'
    });
  }

  /**
   * Notify admin of geofence violation
   */
  async notifyGeofenceViolation(organizationId, { employeeId, employeeName, location, distance, action }) {
    return this._sendToAdmin(organizationId, {
      title: 'Geofence Violation',
      message: `${employeeName} ${action} outside geofence (${distance}m away)`,
      data: {
        type: 'geofence_violation',
        category: this.CATEGORIES.ATTENDANCE,
        employeeId,
        employeeName,
        location,
        distance,
        action
      },
      priority: 'HIGH'
    });
  }

  /**
   * Notify admin of missing check-out
   */
  async notifyMissingCheckOut(organizationId, { employeeId, employeeName, checkInTime, hoursElapsed }) {
    return this._sendToAdmin(organizationId, {
      title: 'Missing Check-Out',
      message: `${employeeName} hasn't checked out - ${hoursElapsed}h since check-in at ${checkInTime}`,
      data: {
        type: 'missing_checkout',
        category: this.CATEGORIES.ATTENDANCE,
        employeeId,
        employeeName,
        checkInTime,
        hoursElapsed
      },
      priority: 'MEDIUM'
    });
  }

  // ========================================
  // LEAVE MANAGEMENT NOTIFICATIONS
  // ========================================

  /**
   * Notify admin of emergency leave request
   */
  async notifyEmergencyLeaveRequest(organizationId, { leaveId, employeeId, employeeName, leaveType, startDate, endDate, days, reason }) {
    return this._sendToAdminAndHR(organizationId, {
      title: 'Emergency Leave Request',
      message: `${employeeName} requested emergency ${leaveType} (${startDate} to ${endDate}, ${days} days)`,
      data: {
        type: 'emergency_leave_request',
        category: this.CATEGORIES.LEAVE,
        leaveId,
        employeeId,
        employeeName,
        leaveType,
        startDate,
        endDate,
        days,
        reason
      },
      priority: 'HIGH'
    });
  }

  /**
   * Notify admin of overlapping leave requests
   */
  async notifyOverlappingLeaves(organizationId, { department, dates, employeeCount, employees }) {
    return this._sendToAdmin(organizationId, {
      title: 'Overlapping Leave Requests',
      message: `${employeeCount} employees in ${department} requested leave for ${dates}`,
      data: {
        type: 'overlapping_leaves',
        category: this.CATEGORIES.LEAVE,
        department,
        dates,
        employeeCount,
        employees
      },
      priority: 'HIGH'
    });
  }

  /**
   * Notify admin of leave policy violation
   */
  async notifyLeavePolicyViolation(organizationId, { leaveId, employeeId, employeeName, violationType, policyDetails }) {
    return this._sendToAdmin(organizationId, {
      title: 'Leave Policy Violation',
      message: `${employeeName}'s leave request violates policy: ${violationType}`,
      data: {
        type: 'leave_policy_violation',
        category: this.CATEGORIES.LEAVE,
        leaveId,
        employeeId,
        employeeName,
        violationType,
        policyDetails
      },
      priority: 'HIGH'
    });
  }

  /**
   * Notify admin of critical leave balance
   */
  async notifyLeaveBalanceCritical(organizationId, { employeeId, employeeName, leaveType, remainingBalance }) {
    return this._sendToAdmin(organizationId, {
      title: 'Critical Leave Balance',
      message: `${employeeName} has only ${remainingBalance} ${leaveType} days remaining`,
      data: {
        type: 'leave_balance_critical',
        category: this.CATEGORIES.LEAVE,
        employeeId,
        employeeName,
        leaveType,
        remainingBalance
      },
      priority: 'MEDIUM'
    });
  }

  // ========================================
  // ASSET MANAGEMENT NOTIFICATIONS
  // ========================================

  /**
   * Notify admin of new asset request
   */
  async notifyAssetRequest(organizationId, { requestId, employeeId, employeeName, assetType, category, priority, estimatedValue }) {
    const priorityTag = priority === 'high' ? ' [HIGH PRIORITY]' : '';
    return this._sendToAdminAndHR(organizationId, {
      title: 'New Asset Request',
      message: `${employeeName} requested ${assetType}: ${category}${priorityTag}`,
      data: {
        type: 'asset_request',
        category: this.CATEGORIES.ASSET,
        requestId,
        employeeId,
        employeeName,
        assetType,
        assetCategory: category,
        requestPriority: priority,
        estimatedValue
      },
      priority: priority === 'high' || estimatedValue > 50000 ? 'HIGH' : 'MEDIUM'
    });
  }

  /**
   * Notify admin of high-value asset request
   */
  async notifyHighValueAssetRequest(organizationId, { requestId, employeeId, employeeName, asset, value }) {
    return this._sendToAdmin(organizationId, {
      title: 'High-Value Asset Request',
      message: `${employeeName} requested ${asset} (₹${value.toLocaleString()}) - Approval needed`,
      data: {
        type: 'high_value_asset_request',
        category: this.CATEGORIES.ASSET,
        requestId,
        employeeId,
        employeeName,
        asset,
        value
      },
      priority: 'CRITICAL'
    });
  }

  /**
   * Notify admin of overdue asset return
   */
  async notifyAssetReturnOverdue(organizationId, { assetId, assetName, employeeId, employeeName, overdueDays }) {
    return this._sendToAdmin(organizationId, {
      title: 'Asset Return Overdue',
      message: `${employeeName} - ${assetName} overdue by ${overdueDays} days`,
      data: {
        type: 'asset_return_overdue',
        category: this.CATEGORIES.ASSET,
        assetId,
        assetName,
        employeeId,
        employeeName,
        overdueDays
      },
      priority: 'HIGH'
    });
  }

  /**
   * Notify admin of asset damage report
   */
  async notifyAssetDamage(organizationId, { assetId, assetName, employeeId, employeeName, damageDescription, estimatedCost }) {
    return this._sendToAdmin(organizationId, {
      title: 'Asset Damage Reported',
      message: `${employeeName} reported damage to ${assetName} - ${damageDescription}`,
      data: {
        type: 'asset_damage_report',
        category: this.CATEGORIES.ASSET,
        assetId,
        assetName,
        employeeId,
        employeeName,
        damageDescription,
        estimatedCost
      },
      priority: 'HIGH'
    });
  }

  // ========================================
  // EXPENSE MANAGEMENT NOTIFICATIONS
  // ========================================

  /**
   * Notify admin of high-value expense
   */
  async notifyHighValueExpense(organizationId, { expenseId, employeeId, employeeName, amount, expenseCategory, threshold }) {
    return this._sendToAdmin(organizationId, {
      title: 'High-Value Expense Alert',
      message: `${employeeName} submitted ₹${amount.toLocaleString()} expense for ${expenseCategory} (Threshold: ₹${threshold.toLocaleString()})`,
      data: {
        type: 'high_value_expense',
        category: this.CATEGORIES.EXPENSE,
        expenseId,
        employeeId,
        employeeName,
        amount,
        expenseCategory,
        threshold
      },
      priority: 'HIGH'
    });
  }

  /**
   * Notify admin of expense policy violation
   */
  async notifyExpensePolicyViolation(organizationId, { expenseId, employeeId, employeeName, violationType, policyDetails }) {
    return this._sendToAdmin(organizationId, {
      title: 'Expense Policy Violation',
      message: `${employeeName}'s expense violates policy: ${violationType}`,
      data: {
        type: 'expense_policy_violation',
        category: this.CATEGORIES.EXPENSE,
        expenseId,
        employeeId,
        employeeName,
        violationType,
        policyDetails
      },
      priority: 'HIGH'
    });
  }

  /**
   * Notify admin of budget threshold exceeded
   */
  async notifyBudgetThresholdExceeded(organizationId, { budgetType, budgetName, currentSpend, budgetLimit, percentage }) {
    return this._sendToAdmin(organizationId, {
      title: 'Budget Threshold Exceeded',
      message: `${budgetName} budget at ${percentage}% (₹${currentSpend.toLocaleString()} of ₹${budgetLimit.toLocaleString()})`,
      data: {
        type: 'budget_threshold_exceeded',
        category: this.CATEGORIES.EXPENSE,
        budgetType,
        budgetName,
        currentSpend,
        budgetLimit,
        percentage
      },
      priority: 'CRITICAL'
    });
  }

  /**
   * Send daily pending approvals digest
   */
  async notifyPendingApprovalsDigest(organizationId, { expenseCount, totalAmount, oldestDays }) {
    if (expenseCount === 0) return;

    return this._sendToAdmin(organizationId, {
      title: 'Pending Expense Approvals',
      message: `${expenseCount} expenses pending approval (Total: ₹${totalAmount.toLocaleString()}, Oldest: ${oldestDays} days)`,
      data: {
        type: 'pending_approvals_digest',
        category: this.CATEGORIES.EXPENSE,
        expenseCount,
        totalAmount,
        oldestDays
      },
      priority: 'MEDIUM'
    });
  }

  // ========================================
  // PROJECT MANAGEMENT NOTIFICATIONS
  // ========================================

  /**
   * Notify admin when new project created
   */
  async notifyProjectCreated(organizationId, { projectId, projectName, owner, budget, deadline }) {
    return this._sendToAdmin(organizationId, {
      title: 'New Project Created',
      message: `${projectName} by ${owner} (Budget: ₹${budget.toLocaleString()}, Deadline: ${deadline})`,
      data: {
        type: 'project_created',
        category: this.CATEGORIES.PROJECT,
        projectId,
        projectName,
        owner,
        budget,
        deadline
      },
      priority: 'MEDIUM'
    });
  }

  /**
   * Notify admin of project deadline approaching
   */
  async notifyProjectDeadlineApproaching(organizationId, { projectId, projectName, deadline, daysRemaining, completionPercentage }) {
    return this._sendToAdmin(organizationId, {
      title: 'Project Deadline Approaching',
      message: `${projectName} due in ${daysRemaining} days (${completionPercentage}% complete)`,
      data: {
        type: 'project_deadline_approaching',
        category: this.CATEGORIES.PROJECT,
        projectId,
        projectName,
        deadline,
        daysRemaining,
        completionPercentage
      },
      priority: 'HIGH'
    });
  }

  /**
   * Notify admin of overdue project
   */
  async notifyProjectOverdue(organizationId, { projectId, projectName, deadline, overdueDays, status }) {
    return this._sendToAdmin(organizationId, {
      title: 'Project Overdue',
      message: `${projectName} is ${overdueDays} days overdue (Status: ${status})`,
      data: {
        type: 'project_overdue',
        category: this.CATEGORIES.PROJECT,
        projectId,
        projectName,
        deadline,
        overdueDays,
        status
      },
      priority: 'CRITICAL'
    });
  }

  /**
   * Notify admin of project budget alert
   */
  async notifyProjectBudgetAlert(organizationId, { projectId, projectName, spent, budget, percentage }) {
    return this._sendToAdmin(organizationId, {
      title: 'Project Budget Alert',
      message: `${projectName} at ${percentage}% budget (₹${spent.toLocaleString()} of ₹${budget.toLocaleString()})`,
      data: {
        type: 'project_budget_alert',
        category: this.CATEGORIES.PROJECT,
        projectId,
        projectName,
        spent,
        budget,
        percentage
      },
      priority: percentage >= 90 ? 'HIGH' : 'MEDIUM'
    });
  }

  /**
   * Notify admin of project status change
   */
  async notifyProjectStatusChanged(organizationId, { projectId, projectName, oldStatus, newStatus }) {
    return this._sendToAdmin(organizationId, {
      title: 'Project Status Changed',
      message: `${projectName}: ${oldStatus} → ${newStatus}`,
      data: {
        type: 'project_status_changed',
        category: this.CATEGORIES.PROJECT,
        projectId,
        projectName,
        oldStatus,
        newStatus
      },
      priority: 'MEDIUM'
    });
  }

  /**
   * Notify admin of project milestone completed
   */
  async notifyProjectMilestoneCompleted(organizationId, { projectId, projectName, milestone, completionPercentage }) {
    return this._sendToAdmin(organizationId, {
      title: 'Project Milestone Completed',
      message: `${projectName} - ${milestone} completed (${completionPercentage}% overall)`,
      data: {
        type: 'project_milestone_completed',
        category: this.CATEGORIES.PROJECT,
        projectId,
        projectName,
        milestone,
        completionPercentage
      },
      priority: 'LOW'
    });
  }

  // ========================================
  // SECURITY & SYSTEM NOTIFICATIONS
  // ========================================

  /**
   * Notify admin of multiple failed login attempts
   */
  async notifyFailedLoginAttempts(organizationId, { email, attemptCount, ipAddress, location, timestamp }) {
    return this._sendToAdmin(organizationId, {
      title: 'Security Alert: Failed Login Attempts',
      message: `${attemptCount} failed login attempts for ${email} from ${ipAddress}`,
      data: {
        type: 'failed_login_attempts',
        category: this.CATEGORIES.SECURITY,
        email,
        attemptCount,
        ipAddress,
        location,
        timestamp
      },
      priority: 'CRITICAL'
    });
  }

  /**
   * Notify admin of account lockout
   */
  async notifyAccountLockout(organizationId, { userId, email, lockoutDuration, unlockTime }) {
    return this._sendToAdmin(organizationId, {
      title: 'Account Locked',
      message: `${email} locked for ${lockoutDuration} minutes (Unlock: ${unlockTime})`,
      data: {
        type: 'account_lockout',
        category: this.CATEGORIES.SECURITY,
        userId,
        email,
        lockoutDuration,
        unlockTime
      },
      priority: 'HIGH'
    });
  }

  /**
   * Notify admin of unusual activity
   */
  async notifyUnusualActivity(organizationId, { userId, userName, activityType, location, device, description }) {
    return this._sendToAdmin(organizationId, {
      title: 'Unusual Activity Detected',
      message: `${userName}: ${activityType} from ${location} on ${device}`,
      data: {
        type: 'unusual_activity',
        category: this.CATEGORIES.SECURITY,
        userId,
        userName,
        activityType,
        location,
        device,
        description
      },
      priority: 'HIGH'
    });
  }

  /**
   * Notify admin of system error
   */
  async notifySystemError(organizationId, { errorType, errorMessage, affectedModule, severity }) {
    return this._sendToAdmin(organizationId, {
      title: 'System Error Alert',
      message: `${errorType} in ${affectedModule}: ${errorMessage}`,
      data: {
        type: 'system_error',
        category: this.CATEGORIES.SYSTEM,
        errorType,
        errorMessage,
        affectedModule,
        severity
      },
      priority: 'CRITICAL'
    });
  }

  // ========================================
  // PERFORMANCE REVIEW NOTIFICATIONS
  // ========================================

  /**
   * Notify admin of review deadline approaching
   */
  async notifyReviewDeadlineApproaching(organizationId, { reviewCycle, pendingCount, daysRemaining }) {
    return this._sendToAdmin(organizationId, {
      title: 'Review Deadline Approaching',
      message: `${pendingCount} reviews pending for ${reviewCycle} (${daysRemaining} days remaining)`,
      data: {
        type: 'review_deadline_approaching',
        category: this.CATEGORIES.PERFORMANCE,
        reviewCycle,
        pendingCount,
        daysRemaining
      },
      priority: 'HIGH'
    });
  }

  /**
   * Notify admin of overdue reviews
   */
  async notifyReviewsOverdue(organizationId, { reviewCycle, overdueCount, reviewers }) {
    return this._sendToAdmin(organizationId, {
      title: 'Reviews Overdue',
      message: `${overdueCount} reviews overdue for ${reviewCycle}`,
      data: {
        type: 'reviews_overdue',
        category: this.CATEGORIES.PERFORMANCE,
        reviewCycle,
        overdueCount,
        reviewers
      },
      priority: 'CRITICAL'
    });
  }

  /**
   * Notify admin of low performance score
   */
  async notifyLowPerformanceScore(organizationId, { employeeId, employeeName, score, reviewer, threshold }) {
    return this._sendToAdmin(organizationId, {
      title: 'Low Performance Score Alert',
      message: `${employeeName} received score of ${score} (Threshold: ${threshold})`,
      data: {
        type: 'low_performance_score',
        category: this.CATEGORIES.PERFORMANCE,
        employeeId,
        employeeName,
        score,
        reviewer,
        threshold
      },
      priority: 'HIGH'
    });
  }

  // ========================================
  // TRAINING & COMPLIANCE NOTIFICATIONS
  // ========================================

  /**
   * Notify admin of certification expiring
   */
  async notifyCertificationExpiring(organizationId, { employeeId, employeeName, certification, expiryDate, daysRemaining }) {
    return this._sendToAdmin(organizationId, {
      title: 'Certification Expiring',
      message: `${employeeName}'s ${certification} expires in ${daysRemaining} days (${expiryDate})`,
      data: {
        type: 'certification_expiring',
        category: this.CATEGORIES.TRAINING,
        employeeId,
        employeeName,
        certification,
        expiryDate,
        daysRemaining
      },
      priority: 'HIGH'
    });
  }

  /**
   * Notify admin of compliance violation
   */
  async notifyComplianceViolation(organizationId, { employeeId, employeeName, violationType, policy, severity, description }) {
    return this._sendToAdmin(organizationId, {
      title: 'Compliance Violation Detected',
      message: `${employeeName}: ${violationType} - ${policy}`,
      data: {
        type: 'compliance_violation',
        category: this.CATEGORIES.COMPLIANCE,
        employeeId,
        employeeName,
        violationType,
        policy,
        severity,
        description
      },
      priority: 'CRITICAL'
    });
  }

  /**
   * Notify admin of document approval needed
   */
  async notifyDocumentApprovalNeeded(organizationId, { documentId, employeeId, employeeName, documentType, uploadDate }) {
    return this._sendToAdmin(organizationId, {
      title: 'Document Approval Needed',
      message: `${employeeName} uploaded ${documentType} for approval`,
      data: {
        type: 'document_approval_needed',
        category: this.CATEGORIES.COMPLIANCE,
        documentId,
        employeeId,
        employeeName,
        documentType,
        uploadDate
      },
      priority: 'MEDIUM'
    });
  }

  /**
   * Notify admin of document expiring
   */
  async notifyDocumentExpiring(organizationId, { documentId, employeeId, employeeName, documentType, expiryDate, daysRemaining }) {
    return this._sendToAdmin(organizationId, {
      title: 'Document Expiring',
      message: `${employeeName}'s ${documentType} expires in ${daysRemaining} days`,
      data: {
        type: 'document_expiring',
        category: this.CATEGORIES.COMPLIANCE,
        documentId,
        employeeId,
        employeeName,
        documentType,
        expiryDate,
        daysRemaining
      },
      priority: 'HIGH'
    });
  }
}

module.exports = new AdminNotificationService();
