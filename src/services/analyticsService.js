const { Op } = require('sequelize');
const { sequelize } = require('../config/database');
const {
  User,
  Attendance,
  Leave,
  Task,
  Meeting,
  Payroll,
  Project,
  Department,
  Team
} = require('../models');

/**
 * Advanced Analytics Service
 * Provides comprehensive analytics and insights across all modules
 */

class AnalyticsService {
  /**
   * Get dashboard overview with key metrics
   */
  static async getDashboardOverview(organizationId, dateRange = {}) {
    const { startDate, endDate } = dateRange;
    const where = { organizationId };

    if (startDate && endDate) {
      where.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    const [
      totalEmployees,
      activeEmployees,
      totalDepartments,
      totalTeams,
      totalProjects,
      activeTasks,
      todayAttendance,
      pendingLeaves,
      upcomingMeetings
    ] = await Promise.all([
      User.count({ where: { organizationId } }),
      User.count({ where: { organizationId, status: 'active' } }),
      Department.count({ where: { organizationId, isActive: true } }),
      Team.count({ where: { organizationId, isActive: true } }),
      Project.count({ where: { organizationId, status: { [Op.ne]: 'completed' } } }),
      Task.count({ where: { organizationId, status: { [Op.in]: ['pending', 'in-progress'] } } }),
      Attendance.count({
        where: {
          organizationId,
          checkInTime: {
            [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      Leave.count({ where: { organizationId, status: 'pending' } }),
      Meeting.count({
        where: {
          organizationId,
          startTime: {
            [Op.gte]: new Date(),
            [Op.lte]: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Next 7 days
          }
        }
      })
    ]);

    return {
      employees: {
        total: totalEmployees,
        active: activeEmployees,
        inactive: totalEmployees - activeEmployees,
        attendanceRate: totalEmployees > 0 ? ((todayAttendance / totalEmployees) * 100).toFixed(2) : 0
      },
      organization: {
        departments: totalDepartments,
        teams: totalTeams,
        projects: totalProjects
      },
      tasks: {
        active: activeTasks
      },
      leaves: {
        pending: pendingLeaves
      },
      meetings: {
        upcoming: upcomingMeetings
      }
    };
  }

  /**
   * Get attendance analytics
   */
  static async getAttendanceAnalytics(organizationId, dateRange) {
    const { startDate, endDate } = dateRange;

    const attendances = await Attendance.findAll({
      where: {
        organizationId,
        checkInTime: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'departmentId']
        }
      ],
      order: [['checkInTime', 'ASC']]
    });

    const analytics = {
      totalCheckIns: attendances.length,
      onTime: 0,
      late: 0,
      earlyCheckout: 0,
      averageWorkHours: 0,
      departmentWise: {},
      dailyTrend: {},
      lateArrivals: []
    };

    let totalWorkHours = 0;

    attendances.forEach(att => {
      const checkIn = new Date(att.checkInTime);
      const checkOut = att.checkOutTime ? new Date(att.checkOutTime) : null;
      const dateKey = checkIn.toISOString().split('T')[0];

      // Daily trend
      analytics.dailyTrend[dateKey] = (analytics.dailyTrend[dateKey] || 0) + 1;

      // Work hours calculation
      if (checkOut) {
        const hours = (checkOut - checkIn) / (1000 * 60 * 60);
        totalWorkHours += hours;

        if (hours < 8) {
          analytics.earlyCheckout++;
        }
      }

      // On-time/Late analysis (assuming 9 AM is standard)
      const checkInHour = checkIn.getHours();
      if (checkInHour <= 9) {
        analytics.onTime++;
      } else {
        analytics.late++;
        if (analytics.lateArrivals.length < 10) {
          analytics.lateArrivals.push({
            userId: att.userId,
            userName: att.user?.name,
            checkInTime: att.checkInTime,
            minutesLate: (checkInHour - 9) * 60 + checkIn.getMinutes()
          });
        }
      }

      // Department-wise
      const deptId = att.user?.departmentId || 'unassigned';
      analytics.departmentWise[deptId] = (analytics.departmentWise[deptId] || 0) + 1;
    });

    analytics.averageWorkHours = attendances.length > 0 
      ? (totalWorkHours / attendances.length).toFixed(2) 
      : 0;

    analytics.punctualityRate = attendances.length > 0 
      ? ((analytics.onTime / attendances.length) * 100).toFixed(2) 
      : 0;

    return analytics;
  }

  /**
   * Get leave analytics
   */
  static async getLeaveAnalytics(organizationId, dateRange) {
    const { startDate, endDate } = dateRange;

    const leaves = await Leave.findAll({
        where: {
          organizationId,
        startDate: {
          [Op.gte]: new Date(startDate)
        },
        endDate: {
          [Op.lte]: new Date(endDate)
        }
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'departmentId']
        }
      ]
    });

    const analytics = {
      total: leaves.length,
      approved: 0,
      pending: 0,
      rejected: 0,
      byType: {},
      byDepartment: {},
      averageDuration: 0,
      topLeaveUsers: []
    };

    let totalDays = 0;
    const userLeaveCount = {};

    leaves.forEach(leave => {
      // Status counts
      analytics[leave.status] = (analytics[leave.status] || 0) + 1;

      // By type
      analytics.byType[leave.leaveType] = (analytics.byType[leave.leaveType] || 0) + 1;

      // By department
      const deptId = leave.user?.departmentId || 'unassigned';
      analytics.byDepartment[deptId] = (analytics.byDepartment[deptId] || 0) + 1;

      // Duration calculation
      const start = new Date(leave.startDate);
      const end = new Date(leave.endDate);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      totalDays += days;

      // User leave count
      userLeaveCount[leave.userId] = (userLeaveCount[leave.userId] || 0) + 1;
    });

    analytics.averageDuration = leaves.length > 0 
      ? (totalDays / leaves.length).toFixed(2) 
      : 0;

    // Top leave users
    analytics.topLeaveUsers = Object.entries(userLeaveCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([userId, count]) => {
        const leave = leaves.find(l => l.userId === parseInt(userId));
        return {
          userId: parseInt(userId),
          userName: leave?.user?.name,
          leaveCount: count
        };
      });

    return analytics;
  }

  /**
   * Get project and task analytics
   */
  static async getProjectAnalytics(organizationId, dateRange) {
    const { startDate, endDate } = dateRange;

    const [projects, tasks] = await Promise.all([
      Project.findAll({
        where: { organizationId },
        include: [
          {
            model: Task,
            as: 'tasks',
            required: false
          }
        ]
      }),
      Task.findAll({
        where: {
          organizationId,
          createdAt: {
            [Op.between]: [new Date(startDate), new Date(endDate)]
          }
        }
      })
    ]);

    const analytics = {
      projects: {
        total: projects.length,
        active: projects.filter(p => p.status === 'active').length,
        completed: projects.filter(p => p.status === 'completed').length,
        onHold: projects.filter(p => p.status === 'on-hold').length
      },
      tasks: {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        pending: tasks.filter(t => t.status === 'pending').length,
        overdue: tasks.filter(t => {
          if (!t.dueDate) return false;
          return new Date(t.dueDate) < new Date() && t.status !== 'completed';
        }).length
      },
      productivity: {
        completionRate: tasks.length > 0 
          ? ((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100).toFixed(2) 
          : 0,
        averageTasksPerProject: projects.length > 0 
          ? (tasks.length / projects.length).toFixed(2) 
          : 0
      }
    };

    return analytics;
  }

  /**
   * Get employee performance analytics
   */
  static async getEmployeePerformanceAnalytics(organizationId, dateRange) {
    const { startDate, endDate } = dateRange;

    const [attendances, tasks, leaves] = await Promise.all([
      Attendance.findAll({
        where: {
          organizationId,
          checkInTime: {
            [Op.between]: [new Date(startDate), new Date(endDate)]
          }
        },
        attributes: [
          'userId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'attendanceCount'],
          [sequelize.fn('AVG', 
            sequelize.literal('EXTRACT(EPOCH FROM ("checkOutTime" - "checkInTime"))/3600')
          ), 'avgWorkHours']
        ],
        group: ['userId'],
        raw: true
      }),
      Task.findAll({
        where: {
          organizationId,
          assignedTo: { [Op.ne]: null },
          completedAt: {
            [Op.between]: [new Date(startDate), new Date(endDate)]
          }
        },
        attributes: [
          'assignedTo',
          [sequelize.fn('COUNT', sequelize.col('id')), 'completedTasks']
        ],
        group: ['assignedTo'],
        raw: true
      }),
      Leave.findAll({
        where: {
          organizationId,
          startDate: { [Op.gte]: new Date(startDate) },
          endDate: { [Op.lte]: new Date(endDate) },
          status: 'approved'
        },
        attributes: [
          'userId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'leaveCount']
        ],
        group: ['userId'],
        raw: true
      })
    ]);

    // Combine metrics by user
    const performanceMap = {};

    attendances.forEach(att => {
      performanceMap[att.userId] = {
        userId: att.userId,
        attendanceCount: parseInt(att.attendanceCount),
        avgWorkHours: parseFloat(att.avgWorkHours || 0).toFixed(2)
      };
    });

    tasks.forEach(task => {
      if (performanceMap[task.assignedTo]) {
        performanceMap[task.assignedTo].completedTasks = parseInt(task.completedTasks);
      } else {
        performanceMap[task.assignedTo] = {
          userId: task.assignedTo,
          completedTasks: parseInt(task.completedTasks),
          attendanceCount: 0,
          avgWorkHours: 0
        };
      }
    });

    leaves.forEach(leave => {
      if (performanceMap[leave.userId]) {
        performanceMap[leave.userId].leaveCount = parseInt(leave.leaveCount);
      }
    });

    // Calculate performance scores
    const performances = Object.values(performanceMap).map(perf => {
      const attendanceScore = Math.min((perf.attendanceCount / 30) * 100, 100);
      const taskScore = Math.min((perf.completedTasks || 0) * 10, 100);
      const workHoursScore = Math.min(((perf.avgWorkHours || 0) / 8) * 100, 100);

      return {
        ...perf,
        performanceScore: (
          (attendanceScore * 0.3) + 
          (taskScore * 0.5) + 
          (workHoursScore * 0.2)
        ).toFixed(2)
      };
    });

    // Sort by performance score
    performances.sort((a, b) => b.performanceScore - a.performanceScore);

    return {
      topPerformers: performances.slice(0, 10),
      averagePerformanceScore: performances.length > 0 
        ? (performances.reduce((sum, p) => sum + parseFloat(p.performanceScore), 0) / performances.length).toFixed(2)
        : 0,
      totalEmployeesAnalyzed: performances.length
    };
  }

  /**
   * Get payroll analytics
   */
  static async getPayrollAnalytics(organizationId, dateRange) {
    const { startDate, endDate } = dateRange;

    const payrolls = await Payroll.findAll({
      where: {
        organizationId,
        payPeriodStart: { [Op.gte]: new Date(startDate) },
        payPeriodEnd: { [Op.lte]: new Date(endDate) }
      }
    });

    const analytics = {
      total: payrolls.length,
      totalGrossSalary: 0,
      totalNetSalary: 0,
      totalDeductions: 0,
      averageGrossSalary: 0,
      averageNetSalary: 0,
      statusBreakdown: {
        pending: 0,
        approved: 0,
        processed: 0,
        paid: 0
      }
    };

    payrolls.forEach(payroll => {
      analytics.totalGrossSalary += parseFloat(payroll.grossSalary || 0);
      analytics.totalNetSalary += parseFloat(payroll.netSalary || 0);
      analytics.totalDeductions += parseFloat(payroll.totalDeductions || 0);
      analytics.statusBreakdown[payroll.status] = (analytics.statusBreakdown[payroll.status] || 0) + 1;
    });

    if (payrolls.length > 0) {
      analytics.averageGrossSalary = (analytics.totalGrossSalary / payrolls.length).toFixed(2);
      analytics.averageNetSalary = (analytics.totalNetSalary / payrolls.length).toFixed(2);
    }

    return analytics;
  }

  /**
   * Get comprehensive organization health report
   */
  static async getOrganizationHealthReport(organizationId, dateRange) {
    const [
      dashboard,
      attendance,
      leave,
      projects,
      performance,
      payroll
    ] = await Promise.all([
      this.getDashboardOverview(organizationId, dateRange),
      this.getAttendanceAnalytics(organizationId, dateRange),
      this.getLeaveAnalytics(organizationId, dateRange),
      this.getProjectAnalytics(organizationId, dateRange),
      this.getEmployeePerformanceAnalytics(organizationId, dateRange),
      this.getPayrollAnalytics(organizationId, dateRange)
    ]);

    // Calculate overall health score (0-100)
    const healthMetrics = {
      attendanceRate: parseFloat(dashboard.employees.attendanceRate) || 0,
      punctualityRate: parseFloat(attendance.punctualityRate) || 0,
      taskCompletionRate: parseFloat(projects.productivity.completionRate) || 0,
      avgPerformanceScore: parseFloat(performance.averagePerformanceScore) || 0
    };

    const overallHealthScore = (
      (healthMetrics.attendanceRate * 0.25) +
      (healthMetrics.punctualityRate * 0.25) +
      (healthMetrics.taskCompletionRate * 0.25) +
      (healthMetrics.avgPerformanceScore * 0.25)
    ).toFixed(2);

    return {
      healthScore: overallHealthScore,
      healthMetrics,
      dashboard,
      attendance,
      leave,
      projects,
      performance,
      payroll,
      generatedAt: new Date(),
      dateRange
    };
  }
}

module.exports = AnalyticsService;
