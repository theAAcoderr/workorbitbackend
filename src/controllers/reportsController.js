const { 
  User, 
  Organization, 
  Attendance, 
  Leave, 
  DailyPlanReport,
  ActivityLog
} = require('../models');
const { Op, Sequelize } = require('sequelize');
const moment = require('moment');
const XLSX = require('xlsx');
const { jsPDF } = require('jspdf');
require('jspdf-autotable');

const reportsController = {
  // Get attendance overview statistics
  async getAttendanceOverview(req, res) {
    try {
      const { startDate, endDate, department, employeeId } = req.query;
      const { organizationId, role, hrCode } = req.user;

      // Build where clause for filtering
      let whereClause = { organizationId };
      
      // Apply HR code filter if user is HR or Manager
      if ((role === 'hr' || role === 'manager') && hrCode) {
        whereClause.hrCode = hrCode;
      }

      // Apply department filter
      if (department) {
        whereClause.department = department;
      }

      // Apply employee filter
      if (employeeId) {
        whereClause.id = employeeId;
      }

      // Get total and active employees
      const totalEmployees = await User.count({
        where: {
          ...whereClause,
          role: { [Op.in]: ['employee', 'manager', 'hr'] },
          status: 'active'
        }
      });

      const activeEmployees = await User.count({
        where: {
          ...whereClause,
          role: { [Op.in]: ['employee', 'manager', 'hr'] },
          status: 'active'
        }
      });

      // Get today's attendance
      const today = moment().format('YYYY-MM-DD');
      const presentToday = await Attendance.count({
        where: {
          date: today,
          status: { [Op.in]: ['checked_in', 'checked_out'] }
        },
        include: [{
          model: User,
          as: 'user',
          where: whereClause,
          attributes: []
        }]
      });

      // Get late arrivals today
      const lateArrivals = await Attendance.count({
        where: {
          date: today,
          checkInTime: {
            [Op.not]: null
          }
        },
        include: [{
          model: User,
          as: 'user',
          where: whereClause,
          attributes: []
        }]
      });

      // Get leave data for today
      const onLeaveToday = await Leave.count({
        where: {
          status: 'approved',
          startDate: { [Op.lte]: today },
          endDate: { [Op.gte]: today }
        },
        include: [{
          model: User,
          as: 'employee',
          where: whereClause,
          attributes: []
        }]
      });

      const pendingLeaves = await Leave.count({
        where: {
          status: 'pending'
        },
        include: [{
          model: User,
          as: 'employee',
          where: whereClause,
          attributes: []
        }]
      });

      // Calculate average attendance
      const avgAttendance = activeEmployees > 0 ? (presentToday / activeEmployees * 100) : 0;

      res.json({
        success: true,
        data: {
          totalEmployees,
          activeEmployees,
          presentToday,
          onLeaveToday,
          avgAttendance: Math.round(avgAttendance * 100) / 100,
          lateArrivals,
          earlyDepartures: 0, // This would need to be calculated based on check-out times
          pendingLeaves
        }
      });

    } catch (error) {
      console.error('Get attendance overview error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get attendance overview',
        error: error.message
      });
    }
  },

  // Get attendance history with filters
  async getAttendanceHistory(req, res) {
    try {
      const { startDate, endDate, department, employeeId, page = 1, limit = 100 } = req.query;
      const { organizationId, role, hrCode } = req.user;

      const offset = (page - 1) * limit;

      // Build where clause for user filtering
      let userWhereClause = { organizationId };
      
      if ((role === 'hr' || role === 'manager') && hrCode) {
        userWhereClause.hrCode = hrCode;
      }

      if (department) {
        userWhereClause.department = department;
      }

      if (employeeId) {
        userWhereClause.id = employeeId;
      }

      // Build attendance where clause
      let attendanceWhereClause = {};
      if (startDate && endDate) {
        attendanceWhereClause.date = {
          [Op.between]: [startDate, endDate]
        };
      }

      const { count, rows: attendances } = await Attendance.findAndCountAll({
        where: attendanceWhereClause,
        include: [
          {
            model: User,
            as: 'user',
            where: userWhereClause,
            attributes: ['id', 'name', 'email', 'department', 'designation']
          },
          {
            model: DailyPlanReport,
            as: 'dailyPlanReport'
          }
        ],
        order: [['date', 'DESC'], ['checkInTime', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      // Transform data for frontend
      const transformedAttendances = attendances.map(attendance => ({
        id: attendance.id,
        userId: attendance.userId,
        userName: attendance.user?.name || 'Unknown',
        department: attendance.user?.department || 'N/A',
        designation: attendance.user?.designation || 'N/A',
        date: attendance.date,
        checkInTime: attendance.checkInTime,
        checkOutTime: attendance.checkOutTime,
        status: attendance.status,
        totalDuration: attendance.totalDuration,
        dailyPlanReport: attendance.dailyPlanReport
      }));

      res.json({
        success: true,
        data: {
          attendances: transformedAttendances,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalRecords: count,
            hasNext: (page * limit) < count,
            hasPrev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Get attendance history error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get attendance history',
        error: error.message
      });
    }
  },

  // Get weekly attendance trend
  async getWeeklyTrend(req, res) {
    try {
      const { startDate, endDate } = req.query;
      const { organizationId, role, hrCode } = req.user;

      // Default to last 7 days if no dates provided
      const end = endDate ? moment(endDate) : moment();
      const start = startDate ? moment(startDate) : moment().subtract(6, 'days');

      // Build where clause for user filtering
      let userWhereClause = { organizationId };
      
      if ((role === 'hr' || role === 'manager') && hrCode) {
        userWhereClause.hrCode = hrCode;
      }

      const weeklyData = [];
      
      // Generate data for each day
      for (let i = 0; i < 7; i++) {
        const date = start.clone().add(i, 'days');
        const dateStr = date.format('YYYY-MM-DD');
        
        // Get attendance count for this day
        const presentCount = await Attendance.count({
          where: {
            date: dateStr,
            status: { [Op.in]: ['checked_in', 'checked_out'] }
          },
          include: [{
            model: User,
            as: 'user',
            where: userWhereClause,
            attributes: []
          }]
        });

        // Get total active employees for this day
        const totalEmployees = await User.count({
          where: {
            ...userWhereClause,
            role: { [Op.in]: ['employee', 'manager', 'hr'] },
            status: 'active'
          }
        });

        const percentage = totalEmployees > 0 ? (presentCount / totalEmployees * 100) : 0;

        weeklyData.push({
          day: date.format('ddd'),
          date: date.toDate(),
          present: presentCount,
          percentage: Math.round(percentage * 100) / 100
        });
      }

      res.json({
        success: true,
        data: weeklyData
      });

    } catch (error) {
      console.error('Get weekly trend error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get weekly trend',
        error: error.message
      });
    }
  },

  // Get recent activities
  async getRecentActivities(req, res) {
    try {
      const { limit = 20 } = req.query;
      const { organizationId, role, hrCode } = req.user;

      // Build where clause for user filtering
      let userWhereClause = { organizationId };
      
      if ((role === 'hr' || role === 'manager') && hrCode) {
        userWhereClause.hrCode = hrCode;
      }

      const activities = await ActivityLog.findAll({
        where: {
          timestamp: {
            [Op.gte]: moment().subtract(7, 'days').toDate()
          }
        },
        include: [{
          model: User,
          as: 'user',
          where: userWhereClause,
          attributes: ['id', 'name', 'email']
        }],
        order: [['timestamp', 'DESC']],
        limit: parseInt(limit)
      });

      // Transform data for frontend
      const transformedActivities = activities.map(activity => ({
        id: activity.id,
        type: activity.activityType,
        employeeName: activity.user?.name || 'Unknown',
        description: activity.description,
        timestamp: activity.timestamp,
        location: activity.location,
        metadata: activity.metadata
      }));

      res.json({
        success: true,
        data: transformedActivities
      });

    } catch (error) {
      console.error('Get recent activities error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recent activities',
        error: error.message
      });
    }
  },

  // Export report
  async exportReport(req, res) {
    try {
      const { format, startDate, endDate, department, employeeId } = req.query;
      const { organizationId, role, hrCode } = req.user;

      // Build where clause for filtering
      let whereClause = { organizationId };
      
      if ((role === 'hr' || role === 'manager') && hrCode) {
        whereClause.hrCode = hrCode;
      }

      if (department) {
        whereClause.department = department;
      }

      if (employeeId) {
        whereClause.id = employeeId;
      }

      // Get attendance data
      const startDateFormatted = startDate || moment().subtract(30, 'days').format('YYYY-MM-DD');
      const endDateFormatted = endDate || moment().format('YYYY-MM-DD');
      
      const attendances = await Attendance.findAll({
        where: {
          date: {
            [Op.between]: [startDateFormatted, endDateFormatted]
          }
        },
        include: [{
          model: User,
          as: 'user',
          where: whereClause,
          attributes: ['id', 'name', 'email', 'department', 'designation']
        }],
        order: [['date', 'DESC']]
      });

      console.log(`Export Debug - Found ${attendances.length} attendance records`);

      // Get leave data
      const leaves = await Leave.findAll({
        where: {
          [Op.or]: [
            {
              startDate: {
                [Op.between]: [startDateFormatted, endDateFormatted]
              }
            },
            {
              endDate: {
                [Op.between]: [startDateFormatted, endDateFormatted]
              }
            }
          ]
        },
        include: [{
          model: User,
          as: 'employee',
          where: whereClause,
          attributes: ['id', 'name', 'email', 'department']
        }],
        order: [['createdAt', 'DESC']]
      });

      console.log(`Export Debug - Found ${leaves.length} leave records`);

      // Generate report based on format
      let reportData;
      let contentType;
      let filename;

      const timestamp = moment().format('YYYY_MM_DD_HHmm');

      if (format === 'csv') {
        // Generate comprehensive CSV with all data
        let csv = 'Report Type,Date,Employee Name,Department,Designation,Check In,Check Out,Status,Total Duration,Leave Type,Leave Start,Leave End,Leave Status,Reason\n';
        
        // Add attendance records
        attendances.forEach(attendance => {
          csv += `Attendance,${attendance.date ? moment(attendance.date).format('YYYY-MM-DD') : ''},${attendance.user?.name || 'Unknown'},${attendance.user?.department || 'N/A'},${attendance.user?.designation || 'N/A'},${attendance.checkInTime ? moment(attendance.checkInTime).format('HH:mm:ss') : ''},${attendance.checkOutTime ? moment(attendance.checkOutTime).format('HH:mm:ss') : ''},${attendance.status},${attendance.totalDuration || ''},,,,,\n`;
        });
        
        // Add leave records
        leaves.forEach(leave => {
          csv += `Leave,,${leave.employee?.name || 'Unknown'},${leave.employee?.department || 'N/A'},,,,,,${leave.type},${leave.startDate ? moment(leave.startDate).format('YYYY-MM-DD') : ''},${leave.endDate ? moment(leave.endDate).format('YYYY-MM-DD') : ''},${leave.status},${leave.reason || ''}\n`;
        });

        reportData = csv;
        contentType = 'text/csv';
        filename = `attendance_report_${timestamp}.csv`;
        console.log(`CSV export: Generated ${reportData.length} characters, Content-Type: ${contentType}`);
      } else if (format === 'pdf') {
        // Generate PDF report
        const doc = new jsPDF();
        
        // Add title
        doc.setFontSize(20);
        doc.text('Attendance & Leave Report', 14, 22);
        
        // Add report info
        doc.setFontSize(10);
        doc.text(`Generated: ${moment().format('YYYY-MM-DD HH:mm:ss')}`, 14, 30);
        doc.text(`Date Range: ${startDate || 'N/A'} to ${endDate || 'N/A'}`, 14, 35);
        doc.text(`Total Records: ${attendances.length} attendance, ${leaves.length} leaves`, 14, 40);
        
        let yPosition = 50;
        
        // Attendance records
        if (attendances.length > 0) {
          doc.setFontSize(14);
          doc.text('Attendance Records', 14, yPosition);
          yPosition += 10;
          
          // Table headers
          doc.setFontSize(8);
          doc.text('Date', 14, yPosition);
          doc.text('Employee', 40, yPosition);
          doc.text('Department', 80, yPosition);
          doc.text('Check In', 120, yPosition);
          doc.text('Check Out', 150, yPosition);
          doc.text('Status', 180, yPosition);
          yPosition += 5;
          
          // Draw line under headers
          doc.line(14, yPosition, 200, yPosition);
          yPosition += 5;
          
          // Table data
          attendances.slice(0, 20).forEach(attendance => { // Limit to 20 records per page
            if (yPosition > 280) {
              doc.addPage();
              yPosition = 20;
            }
            
            doc.text(attendance.date ? moment(attendance.date).format('YYYY-MM-DD') : '', 14, yPosition);
            doc.text(attendance.user?.name || 'Unknown', 40, yPosition);
            doc.text(attendance.user?.department || 'N/A', 80, yPosition);
            doc.text(attendance.checkInTime ? moment(attendance.checkInTime).format('HH:mm:ss') : '', 120, yPosition);
            doc.text(attendance.checkOutTime ? moment(attendance.checkOutTime).format('HH:mm:ss') : '', 150, yPosition);
            doc.text(attendance.status || '', 180, yPosition);
            yPosition += 6;
          });
          
          if (attendances.length > 20) {
            doc.text(`... and ${attendances.length - 20} more records`, 14, yPosition + 5);
          }
        }
        
        // Leave records
        if (leaves.length > 0) {
          if (yPosition > 200) {
            doc.addPage();
            yPosition = 20;
          } else {
            yPosition += 20;
          }
          
          doc.setFontSize(14);
          doc.text('Leave Records', 14, yPosition);
          yPosition += 10;
          
          // Table headers
          doc.setFontSize(8);
          doc.text('Employee', 14, yPosition);
          doc.text('Type', 60, yPosition);
          doc.text('Start Date', 90, yPosition);
          doc.text('End Date', 120, yPosition);
          doc.text('Status', 150, yPosition);
          doc.text('Reason', 180, yPosition);
          yPosition += 5;
          
          // Draw line under headers
          doc.line(14, yPosition, 200, yPosition);
          yPosition += 5;
          
          // Table data
          leaves.slice(0, 15).forEach(leave => { // Limit to 15 records per page
            if (yPosition > 280) {
              doc.addPage();
              yPosition = 20;
            }
            
            doc.text(leave.employee?.name || 'Unknown', 14, yPosition);
            doc.text(leave.type || '', 60, yPosition);
            doc.text(leave.startDate ? moment(leave.startDate).format('YYYY-MM-DD') : '', 90, yPosition);
            doc.text(leave.endDate ? moment(leave.endDate).format('YYYY-MM-DD') : '', 120, yPosition);
            doc.text(leave.status || '', 150, yPosition);
            doc.text((leave.reason || '').substring(0, 20), 180, yPosition);
            yPosition += 6;
          });
          
          if (leaves.length > 15) {
            doc.text(`... and ${leaves.length - 15} more records`, 14, yPosition + 5);
          }
        }
        
        // Add message if no data found
        if (attendances.length === 0 && leaves.length === 0) {
          doc.setFontSize(12);
          doc.text('No data found for the specified date range.', 14, yPosition + 20);
          doc.text('Please check your date range and try again.', 14, yPosition + 30);
          doc.text(`Date range searched: ${startDateFormatted} to ${endDateFormatted}`, 14, yPosition + 40);
          doc.text(`Organization ID: ${organizationId}`, 14, yPosition + 50);
          doc.text(`HR Code: ${hrCode || 'N/A'}`, 14, yPosition + 60);
        }
        
        reportData = doc.output('arraybuffer');
        contentType = 'application/pdf';
        filename = `attendance_report_${timestamp}.pdf`;
        console.log(`PDF export: Generated ${reportData.length} bytes, Content-Type: ${contentType}`);
      } else if (format === 'excel') {
        // Generate Excel file
        const workbook = XLSX.utils.book_new();
        
        // Attendance sheet
        const attendanceData = attendances.map(a => ({
          'Date': a.date ? moment(a.date).format('YYYY-MM-DD') : '',
          'Employee Name': a.user?.name || 'Unknown',
          'Department': a.user?.department || 'N/A',
          'Designation': a.user?.designation || 'N/A',
          'Check In': a.checkInTime ? moment(a.checkInTime).format('HH:mm:ss') : '',
          'Check Out': a.checkOutTime ? moment(a.checkOutTime).format('HH:mm:ss') : '',
          'Status': a.status,
          'Total Duration': a.totalDuration || ''
        }));
        
        const attendanceSheet = XLSX.utils.json_to_sheet(attendanceData);
        XLSX.utils.book_append_sheet(workbook, attendanceSheet, 'Attendance');
        
        // Leave sheet
        const leaveData = leaves.map(l => ({
          'Employee Name': l.employee?.name || 'Unknown',
          'Department': l.employee?.department || 'N/A',
          'Leave Type': l.type,
          'Start Date': l.startDate ? moment(l.startDate).format('YYYY-MM-DD') : '',
          'End Date': l.endDate ? moment(l.endDate).format('YYYY-MM-DD') : '',
          'Status': l.status,
          'Reason': l.reason || '',
          'Duration (Days)': l.numberOfDays || 1
        }));
        
        const leaveSheet = XLSX.utils.json_to_sheet(leaveData);
        XLSX.utils.book_append_sheet(workbook, leaveSheet, 'Leaves');
        
        // Summary sheet
        const summaryData = [
          { 'Metric': 'Total Employees', 'Value': attendances.length > 0 ? new Set(attendances.map(a => a.userId)).size : 0 },
          { 'Metric': 'Total Attendance Records', 'Value': attendances.length },
          { 'Metric': 'Total Leave Records', 'Value': leaves.length },
          { 'Metric': 'Report Generated', 'Value': moment().format('YYYY-MM-DD HH:mm:ss') }
        ];
        
        const summarySheet = XLSX.utils.json_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
        
        // Generate Excel buffer
        reportData = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `attendance_report_${timestamp}.xlsx`;
        
        console.log(`Excel export: Generated ${reportData.length} bytes, Content-Type: ${contentType}`);
      } else {
        // Default to JSON
        reportData = JSON.stringify({
          attendances: attendances,
          leaves: leaves
        });
        contentType = 'application/json';
        filename = `attendance_report_${timestamp}.json`;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(reportData);

    } catch (error) {
      console.error('Export report error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export report',
        error: error.message
      });
    }
  }
};

module.exports = reportsController;
