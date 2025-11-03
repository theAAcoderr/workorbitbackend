const { User, Organization, HRManager, Attendance, LocationTracking, ActivityLog } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const adminNotificationService = require('../services/adminNotificationService');

const employeeController = {
  // Get all employees for organization with hrCode filtering
  async getEmployees(req, res) {
    try {
      console.log('🔍 Employee API called - getEmployees');
      console.log('📝 User info:', {
        userId: req.user?.id,
        role: req.user?.role,
        hrCode: req.user?.hrCode,
        organizationId: req.user?.organizationId
      });

      const { organizationId, role, hrCode } = req.user;

      if (!organizationId) {
        return res.status(400).json({
          success: false,
          message: 'User not assigned to any organization'
        });
      }

      let whereClause = {
        organizationId,
        status: 'active',
        isAssigned: true,
        role: {
          [Op.in]: ['employee', 'manager', 'hr']
        }
      };

      // Filter by hrCode for HR managers and managers
      if ((role === 'hr' || role === 'manager') && hrCode) {
        whereClause.hrCode = hrCode;
        console.log(`🔍 Filtering by hrCode: ${hrCode} for role: ${role}`);
      }

      console.log('🔎 Database query where clause:', whereClause);

      const employees = await User.findAll({
        where: whereClause,
        attributes: [
          'id', 'name', 'email', 'phone', 'role', 'department', 'designation',
          'status', 'hrCode', 'orgCode', 'organizationId', 'employeeId',
          'dateOfJoining', 'managerId', 'profilePicture',
          'createdAt', 'updatedAt'
        ],
        include: [
          {
            model: Organization,
            as: 'organization',
            attributes: ['id', 'name', 'orgCode'],
            required: false
          }
        ],
        order: [['name', 'ASC']]
      });

      console.log(`📊 Found ${employees.length} employees in database`);
      if (employees.length > 0) {
        console.log('👥 Sample employee data:', {
          id: employees[0].id,
          name: employees[0].name,
          role: employees[0].role,
          hrCode: employees[0].hrCode,
          organizationId: employees[0].organizationId
        });
      }

      // Transform to match Flutter Employee model format
      const transformedEmployees = employees.map(user => ({
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone,
        role: user.role || 'employee',
        departmentId: user.department || '',
        position: user.designation || '',
        managerId: user.managerId,
        profileImageUrl: user.profilePicture,
        hrCode: user.hrCode,
        status: user.status || 'active',
        joinDate: user.dateOfJoining || user.createdAt,
        lastActive: user.updatedAt,
        lastUpdated: user.updatedAt,
        organizationId: user.organizationId,
        organizationName: user.organization?.name || user.orgCode || 'Unknown', // Add organization name
        orgCode: user.orgCode,
        employeeCode: user.employeeId || user.id,
        workLocation: 'Office', // Default value
        workType: 'onsite', // Default value
        shift: 'morning', // Default value
        baseSalary: 0, // Default value
        currency: 'INR', // Default value
        productivity: 0, // Default value
        attendance: 0, // Default value
        performanceScore: 0, // Default value
        completedTasks: 0, // Default value
        pendingTasks: 0, // Default value
        skills: [], // Default value
        certifications: [], // Default value
        languages: [], // Default value
        emergencyContactName: null,
        emergencyContactPhone: null,
        emergencyContactRelation: null,
        customFields: null,
        isActive: user.status === 'active',
        isVerified: true, // Default value
        hasAccessCard: false, // Default value
        accessCardNumber: null,
        emailNotifications: true, // Default value
        pushNotifications: true, // Default value
        fcmToken: null
      }));

      console.log(`✅ Sending ${transformedEmployees.length} employees to Flutter app`);

      res.json({
        success: true,
        employees: transformedEmployees,
        count: transformedEmployees.length
      });
    } catch (error) {
      console.error('Error fetching employees:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch employees',
        error: error.message
      });
    }
  },

  // Get employee by ID
  async getEmployeeById(req, res) {
    try {
      const { id } = req.params;
      const { organizationId } = req.user;

      const user = await User.findOne({
        where: {
          id,
          organizationId,
          status: 'active'
        },
        attributes: [
          'id', 'name', 'email', 'phone', 'role', 'department', 'designation',
          'status', 'hrCode', 'orgCode', 'organizationId', 'employeeId',
          'dateOfJoining', 'managerId', 'profilePicture',           'createdAt', 'updatedAt'
        ]
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // Transform to match Flutter Employee model format
      const employee = {
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone,
        role: user.role || 'employee',
        departmentId: user.department || '',
        position: user.designation || '',
        managerId: user.managerId,
        profileImageUrl: user.profilePicture,
        hrCode: user.hrCode,
        status: user.status || 'active',
        joinDate: user.dateOfJoining || user.createdAt,
        lastActive: user.updatedAt,
        lastUpdated: user.updatedAt,
        organizationId: user.organizationId,
        orgCode: user.orgCode,
        employeeCode: user.employeeId || user.id,
        workLocation: 'Office',
        workType: 'onsite',
        shift: 'morning',
        baseSalary: 0,
        currency: 'INR',
        productivity: 0,
        attendance: 0,
        performanceScore: 0,
        completedTasks: 0,
        pendingTasks: 0,
        skills: [],
        certifications: [],
        languages: [],
        emergencyContactName: null,
        emergencyContactPhone: null,
        emergencyContactRelation: null,
        customFields: null,
        isActive: user.status === 'active',
        isVerified: true,
        hasAccessCard: false,
        accessCardNumber: null,
        emailNotifications: true,
        pushNotifications: true,
        fcmToken: null
      };

      res.json({
        success: true,
        employee
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch employee',
        error: error.message
      });
    }
  },

  // Get employees by hrCode (for HR managers)
  async getEmployeesByHrCode(req, res) {
    try {
      const { hrCode: userHrCode, organizationId, role } = req.user;

      if (role !== 'hr' && role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only HR and Admin can access this endpoint.'
        });
      }

      const { hrCode } = req.params;
      const targetHrCode = hrCode || userHrCode;

      if (!targetHrCode) {
        return res.status(400).json({
          success: false,
          message: 'HR code is required'
        });
      }

      const employees = await User.findAll({
        where: {
          organizationId,
          hrCode: targetHrCode,
          status: 'active',
          isAssigned: true,
          role: {
            [Op.in]: ['employee', 'manager']
          }
        },
        attributes: [
          'id', 'name', 'email', 'phone', 'role', 'department', 'designation',
          'status', 'hrCode', 'orgCode', 'organizationId', 'employeeId',
          'dateOfJoining', 'managerId', 'profilePicture',           'createdAt', 'updatedAt'
        ],
        order: [['name', 'ASC']]
      });

      // Transform to match Flutter Employee model format
      const transformedEmployees = employees.map(user => ({
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone,
        role: user.role || 'employee',
        departmentId: user.department || '',
        position: user.designation || '',
        managerId: user.managerId,
        profileImageUrl: user.profilePicture,
        hrCode: user.hrCode,
        status: user.status || 'active',
        joinDate: user.dateOfJoining || user.createdAt,
        lastActive: user.updatedAt,
        lastUpdated: user.updatedAt,
        organizationId: user.organizationId,
        organizationName: user.organization?.name || user.orgCode || 'Unknown', // Add organization name
        orgCode: user.orgCode,
        employeeCode: user.employeeId || user.id,
        workLocation: 'Office',
        workType: 'onsite',
        shift: 'morning',
        baseSalary: 0,
        currency: 'INR',
        productivity: 0,
        attendance: 0,
        performanceScore: 0,
        completedTasks: 0,
        pendingTasks: 0,
        skills: [],
        certifications: [],
        languages: [],
        emergencyContactName: null,
        emergencyContactPhone: null,
        emergencyContactRelation: null,
        customFields: null,
        isActive: user.status === 'active',
        isVerified: true,
        hasAccessCard: false,
        accessCardNumber: null,
        emailNotifications: true,
        pushNotifications: true,
        fcmToken: null
      }));

      res.json({
        success: true,
        employees: transformedEmployees,
        count: transformedEmployees.length,
        hrCode: targetHrCode
      });
    } catch (error) {
      console.error('Error fetching employees by HR code:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch employees by HR code',
        error: error.message
      });
    }
  },

  // Get multiple employees by their IDs (for project team members)
  async getEmployeesByIds(req, res) {
    try {
      const { organizationId } = req.user;
      const { ids } = req.body; // Expecting array of user IDs

      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'User IDs array is required'
        });
      }

      // Remove duplicates
      const uniqueIds = [...new Set(ids)];

      console.log(`Fetching ${uniqueIds.length} employees by IDs`);

      const users = await User.findAll({
        where: {
          id: {
            [Op.in]: uniqueIds
          },
          organizationId
        },
        attributes: [
          'id', 'name', 'email', 'phone', 'role', 'department', 'designation',
          'status', 'hrCode', 'orgCode', 'organizationId', 'employeeId',
          'dateOfJoining', 'managerId', 'profilePicture',
          'createdAt', 'updatedAt'
        ]
      });

      // Transform to match Flutter Employee model format
      const employees = users.map(user => ({
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone,
        role: user.role || 'employee',
        departmentId: user.department || '',
        position: user.designation || '',
        managerId: user.managerId,
        profileImageUrl: user.profilePicture,
        hrCode: user.hrCode,
        status: user.status || 'active',
        joinDate: user.dateOfJoining || user.createdAt,
        lastActive: user.updatedAt,
        lastUpdated: user.updatedAt,
        organizationId: user.organizationId,
        orgCode: user.orgCode,
        employeeCode: user.employeeId || user.id,
        workLocation: 'Office',
        isActive: user.status === 'active'
      }));

      res.json({
        success: true,
        employees,
        foundCount: employees.length,
        requestedCount: uniqueIds.length
      });
    } catch (error) {
      console.error('Error fetching employees by IDs:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch employees',
        error: error.message
      });
    }
  },

  // Get dashboard data for employee
  async getDashboardData(req, res) {
    try {
      console.log('🔍 Dashboard API called');
      console.log('📝 Request user:', req.user);
      
      const { id: userId, organizationId } = req.user;
      
      if (!userId || !organizationId) {
        return res.status(400).json({
          success: false,
          message: 'User ID or Organization ID missing'
        });
      }
      
      // Get user profile
      const user = await User.findOne({
        where: { id: userId, organizationId },
        attributes: [
          'id', 'name', 'email', 'phone', 'role', 'department', 'designation',
          'status', 'hrCode', 'orgCode', 'organizationId', 'employeeId',
          'dateOfJoining', 'managerId', 'profilePicture',           'createdAt', 'updatedAt'
        ]
      });

      console.log('👤 User found:', user ? { id: user.id, name: user.name, email: user.email } : 'No user found');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Get today's attendance
      const today = moment().format('YYYY-MM-DD');
      const todayAttendance = await Attendance.findOne({
        where: { userId, date: today }
      });

      // Get monthly attendance stats
      const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
      const endOfMonth = moment().endOf('month').format('YYYY-MM-DD');
      const monthlyAttendance = await Attendance.findAll({
        where: {
          userId,
          date: {
            [Op.between]: [startOfMonth, endOfMonth]
          }
        },
        order: [['date', 'ASC']]
      });

      // Calculate monthly stats
      let present = 0, late = 0, leave = 0;

      // Create a map of attendance records by date
      const attendanceMap = {};
      monthlyAttendance.forEach(record => {
        attendanceMap[record.date] = record.status || 'absent';
      });

      // Count stats for each record
      monthlyAttendance.forEach(record => {
        const status = record.status || 'absent';
        switch (status) {
          case 'checked_in':
          case 'checked_out':
          case 'present':
            present++;
            break;
          case 'late':
            late++;
            break;
          case 'on_leave':
            leave++;
            break;
        }
      });

      // Calculate total working days (excluding only Sunday) and absent days
      const daysInMonth = moment().daysInMonth();
      const startDay = moment().startOf('month');
      const currentDate = moment();
      let totalWorkingDays = 0;
      let absent = 0;

      for (let i = 0; i < daysInMonth; i++) {
        const day = startDay.clone().add(i, 'days');
        const dayOfWeek = day.day(); // 0 = Sunday, 6 = Saturday

        // Skip only Sunday (6-day work week: Monday-Saturday)
        if (dayOfWeek !== 0) {
          totalWorkingDays++;

          // Only count absent for working days that have already passed
          if (day.isSameOrBefore(currentDate, 'day')) {
            const dateStr = day.format('YYYY-MM-DD');
            const status = attendanceMap[dateStr];

            // If no attendance record exists or status is 'absent', count as absent
            if (!status || status === 'absent') {
              absent++;
            }
          }
        }
      }

      const attendedDays = present + late;
      const attendancePercentage = totalWorkingDays > 0 ? attendedDays / totalWorkingDays : 0;

      // Get weekly hours (last 7 days) - fetch separately to ensure we get data across month boundaries
      const weekStart = moment().subtract(6, 'days').format('YYYY-MM-DD');
      const weekEnd = moment().format('YYYY-MM-DD');
      const weeklyAttendance = await Attendance.findAll({
        where: {
          userId,
          date: {
            [Op.between]: [weekStart, weekEnd]
          }
        },
        order: [['date', 'ASC']]
      });

      const weeklyHours = [];
      for (let i = 6; i >= 0; i--) {
        const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
        const dayAttendance = weeklyAttendance.find(a => a.date === date);

        if (dayAttendance && dayAttendance.checkInTime && dayAttendance.checkOutTime) {
          const checkIn = moment(dayAttendance.checkInTime);
          const checkOut = moment(dayAttendance.checkOutTime);
          const hours = checkOut.diff(checkIn, 'hours', true);
          weeklyHours.push(Math.max(0, hours));
        } else {
          weeklyHours.push(0);
        }
      }

      // Get recent location data
      const recentLocations = await LocationTracking.findAll({
        where: { userId },
        order: [['timestamp', 'DESC']],
        limit: 10
      });

      // Get recent activities
      const recentActivities = await ActivityLog.findAll({
        where: { userId },
        order: [['createdAt', 'DESC']],
        limit: 5
      });

      // Transform user data
      const employeeData = {
        id: user.id,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone,
        role: user.role || 'employee',
        departmentId: user.department || '',
        position: user.designation || '',
        managerId: user.managerId,
        profileImageUrl: user.profilePicture,
        hrCode: user.hrCode,
        status: user.status || 'active',
        joinDate: user.dateOfJoining || user.createdAt,
        lastActive: user.updatedAt,
        lastUpdated: user.updatedAt,
        organizationId: user.organizationId,
        orgCode: user.orgCode,
        employeeCode: user.employeeId || user.id,
        workLocation: 'Office',
        workType: 'onsite',
        shift: 'morning',
        baseSalary: 0,
        currency: 'INR',
        productivity: 0,
        attendance: attendancePercentage,
        performanceScore: 0,
        completedTasks: 0,
        pendingTasks: 0,
        skills: [],
        certifications: [],
        languages: [],
        emergencyContactName: null,
        emergencyContactPhone: null,
        emergencyContactRelation: null,
        customFields: null,
        isActive: user.status === 'active',
        isVerified: true,
        hasAccessCard: false,
        accessCardNumber: null,
        emailNotifications: true,
        pushNotifications: true,
        fcmToken: null
      };

      res.json({
        success: true,
        data: {
          employee: employeeData,
          todayAttendance: todayAttendance ? {
            checkIn: todayAttendance.checkInTime ? moment(todayAttendance.checkInTime).format('HH:mm') : null,
            checkOut: todayAttendance.checkOutTime ? moment(todayAttendance.checkOutTime).format('HH:mm') : null,
            status: todayAttendance.status || 'Not Checked In',
            location: todayAttendance.checkInLocation?.address || 'Unknown',
            isCheckedIn: todayAttendance.checkInTime && !todayAttendance.checkOutTime,
            sessionDuration: todayAttendance.checkInTime && todayAttendance.checkOutTime 
              ? moment(todayAttendance.checkOutTime).diff(moment(todayAttendance.checkInTime), 'hours', true)
              : todayAttendance.checkInTime 
                ? moment().diff(moment(todayAttendance.checkInTime), 'hours', true)
                : 0
          } : null,
          monthlyStats: {
            present,
            absent,
            late,
            leave,
            totalWorkingDays,
            attendedDays,
            attendancePercentage
          },
          weeklyHours,
          recentLocations: recentLocations.map(loc => ({
            id: loc.id,
            latitude: loc.latitude,
            longitude: loc.longitude,
            address: loc.address,
            timestamp: loc.timestamp,
            activityType: loc.activityType,
            batteryLevel: loc.batteryLevel
          })),
          recentActivities: recentActivities.map(activity => {
            // Format location for display
            let locationDisplay = 'Unknown location';
            if (activity.location) {
              if (typeof activity.location === 'object') {
                // Check for address first
                if (activity.location.address && activity.location.address.trim()) {
                  locationDisplay = activity.location.address;
                } else if (activity.location.latitude && activity.location.longitude) {
                  // Format coordinates
                  locationDisplay = `${Number(activity.location.latitude).toFixed(4)}, ${Number(activity.location.longitude).toFixed(4)}`;
                }
              } else if (typeof activity.location === 'string' && activity.location.trim()) {
                locationDisplay = activity.location;
              }
            }

            return {
              id: activity.id,
              type: activity.activityType,
              description: activity.description,
              location: locationDisplay,
              timestamp: activity.createdAt,
              metadata: activity.metadata
            };
          })
        }
      });
    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      console.error('❌ Error stack:', error.stack);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard data',
        error: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Get dashboard statistics
  async getDashboardStats(req, res) {
    try {
      const { id: userId, organizationId } = req.user;
      
      // Get basic stats
      const today = moment().format('YYYY-MM-DD');
      const currentMonth = moment().format('YYYY-MM');
      
      // Today's working hours
      const todayAttendance = await Attendance.findOne({
        where: { userId, date: today }
      });
      
      let todayHours = 0;
      if (todayAttendance && todayAttendance.checkInTime) {
        if (todayAttendance.checkOutTime) {
          todayHours = moment(todayAttendance.checkOutTime).diff(moment(todayAttendance.checkInTime), 'hours', true);
        } else {
          todayHours = moment().diff(moment(todayAttendance.checkInTime), 'hours', true);
        }
      }

      // Monthly days completed
      const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
      const endOfMonth = moment().endOf('month').format('YYYY-MM-DD');
      const monthlyAttendance = await Attendance.findAll({
        where: {
          userId,
          date: {
            [Op.between]: [startOfMonth, endOfMonth]
          }
        }
      });

      const presentDays = monthlyAttendance.filter(a => 
        a.status === 'checked_in' || a.status === 'checked_out' || a.status === 'present'
      ).length;

      const totalWorkingDays = moment().daysInMonth();
      const completionPercentage = totalWorkingDays > 0 ? presentDays / totalWorkingDays : 0;

      res.json({
        success: true,
        data: {
          todayWorkingHours: Math.max(0, todayHours),
          monthlyDaysCompleted: {
            presentDays,
            totalWorkingDays,
            completionPercentage,
            daysCompleted: `${presentDays}/${totalWorkingDays}`,
            daysColor: completionPercentage >= 0.9 ? 'green' : 
                      completionPercentage >= 0.7 ? 'orange' : 'red'
          }
        }
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch dashboard stats',
        error: error.message
      });
    }
  },

  // Delete employee by ID
  async deleteEmployee(req, res) {
    try {
      const { id } = req.params;
      const { role, organizationId } = req.user;

      console.log('🗑️ Delete employee request:', {
        employeeId: id,
        requestedBy: req.user.id,
        userRole: role,
        userOrg: organizationId
      });

      // Check if user has permission to delete employees
      if (role !== 'admin' && role !== 'hr') {
        return res.status(403).json({
          success: false,
          message: 'Only Admin and HR can delete employees'
        });
      }

      // Find the employee to delete
      const employee = await User.findOne({
        where: {
          id,
          organizationId
        }
      });

      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // Prevent deletion of admin accounts
      if (employee.role === 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete admin accounts'
        });
      }

      // For HR role, ensure they can only delete employees with same hrCode
      if (role === 'hr' && req.user.hrCode !== employee.hrCode) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete employees from your department'
        });
      }

      // Store employee info before deletion for logging
      const deletedEmployeeInfo = {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role
      };

      // Soft delete - update status to 'inactive' and mark as unassigned
      // This preserves data integrity for historical records
      await employee.update({
        status: 'inactive',
        isAssigned: false,
        updatedAt: new Date()
      });

      // Activity logging commented out - uncomment if you have valid activity types
      // try {
      //   if (ActivityLog) {
      //     await ActivityLog.create({
      //       userId: req.user.id,
      //       activityType: 'status_change',
      //       description: `Deactivated employee: ${deletedEmployeeInfo.name} (${deletedEmployeeInfo.email})`,
      //       metadata: {
      //         action: 'employee_deactivation',
      //         deletedEmployee: deletedEmployeeInfo,
      //         deletedBy: {
      //           id: req.user.id,
      //           name: req.user.name,
      //           role: req.user.role
      //         }
      //       }
      //     });
      //   }
      // } catch (logError) {
      //   console.log('⚠️ Warning: Failed to log activity:', logError.message);
      // }

      console.log('✅ Employee deleted successfully:', deletedEmployeeInfo);

      res.json({
        success: true,
        message: 'Employee deleted successfully',
        deletedEmployee: deletedEmployeeInfo
      });

    } catch (error) {
      console.error('❌ Error deleting employee:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete employee',
        error: error.message
      });
    }
  }
};

module.exports = employeeController;