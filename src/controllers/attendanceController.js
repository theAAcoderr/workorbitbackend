const {
  User,
  Organization,
  Attendance,
  LocationTracking,
  DailyPlanReport,
  ActivityLog,
  GeofenceViolation,
  Geofence
} = require('../models');
const { Op, Sequelize } = require('sequelize');
const moment = require('moment');
const oneSignalService = require('../services/oneSignalService');
const adminNotificationService = require('../services/adminNotificationService');

// Check In
const checkIn = async (req, res) => {
  try {
    const user = req.user;
    const { 
      location, 
      deviceInfo, 
      batteryLevel, 
      isConnected,
      geofenceOverrideReason,
      notes 
    } = req.body;

    const today = moment().format('YYYY-MM-DD');
    
    // Check if user already checked in today
    let attendance = await Attendance.findOne({
      where: { 
        userId: user.id,
        date: today
      }
    });

    if (attendance && attendance.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Already checked in today'
      });
    }

    // Check geofence compliance
    const geofenceCheck = await checkGeofenceCompliance(user.organizationId, location);
    
    const checkInData = {
      userId: user.id,
      date: today,
      checkInTime: new Date(),
      checkInLocation: location,
      status: 'checked_in',
      isGeofenceCompliant: geofenceCheck.isCompliant,
      geofenceOverrideReason: geofenceCheck.isCompliant ? null : geofenceOverrideReason,
      batteryLevel,
      isConnected,
      deviceInfo,
      notes
    };

    if (attendance) {
      // Update existing attendance record
      await attendance.update(checkInData);
    } else {
      // Create new attendance record
      attendance = await Attendance.create(checkInData);
    }

    // Log the activity
    await ActivityLog.create({
      userId: user.id,
      attendanceId: attendance.id,
      activityType: 'check_in',
      description: 'Employee checked in',
      location,
      metadata: { 
        geofenceCompliant: geofenceCheck.isCompliant,
        batteryLevel,
        deviceInfo
      }
    });

    // Store location tracking
    await LocationTracking.create({
      userId: user.id,
      attendanceId: attendance.id,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      address: location.address,
      activityType: 'stationary',
      batteryLevel,
      timestamp: new Date()
    });

    // Handle geofence violation if not compliant
    if (!geofenceCheck.isCompliant) {
      await GeofenceViolation.create({
        userId: user.id,
        organizationId: user.organizationId,
        attendanceId: attendance.id,
        violationType: 'check_in_outside',
        location,
        distance: geofenceCheck.distance || 0,
        severity: geofenceCheck.distance > 1000 ? 'high' : 'medium',
        overrideReason: geofenceOverrideReason,
        isOverridden: !!geofenceOverrideReason,
        status: geofenceOverrideReason ? 'pending' : 'pending'
      });

      // 🔔 ADMIN NOTIFICATION: Geofence violation
      await adminNotificationService.notifyGeofenceViolation(
        user.organizationId,
        {
          employeeId: user.id,
          employeeName: user.name,
          location: `${location.latitude},${location.longitude}`,
          distance: Math.round(geofenceCheck.distance || 0),
          action: 'check-in'
        }
      ).catch(err => console.error('Admin notification error:', err));
    }

    // 🔔 Send OneSignal notifications to HR and managers
    try {
      const time = moment().format('h:mm A');
      const userName = user.name || user.email;

      // Notification title and message
      let notificationTitle = `${userName} Checked In`;
      let notificationMessage = `Check-in at ${time}`;

      if (location && location.address) {
        notificationMessage += ` - ${location.address}`;
      }

      // Add warning if geofence not compliant
      if (!geofenceCheck.isCompliant) {
        notificationTitle = `⚠️ Outside Location: ${userName}`;
        notificationMessage = `Checked in outside allowed area at ${time}`;
      }

      // Send to HR team
      await oneSignalService.sendToRole(
        user.organizationId,
        'hr',
        {
          title: notificationTitle,
          message: notificationMessage,
          data: {
            type: 'attendance_checkin',
            userId: user.id,
            userName: userName,
            attendanceId: attendance.id,
            location: location,
            time: new Date().toISOString(),
            isGeofenceCompliant: geofenceCheck.isCompliant
          }
        }
      );

      // Send to manager if exists
      if (user.managerId) {
        await oneSignalService.sendToUser(
          user.managerId.toString(),
          {
            title: `Team Member: ${userName}`,
            message: `Checked in at ${time}`,
            data: {
              type: 'team_checkin',
              userId: user.id,
              userName: userName,
              attendanceId: attendance.id
            }
          }
        );
      }

      console.log('✅ Check-in notifications sent to HR and manager');
    } catch (notificationError) {
      console.error('⚠️ Failed to send check-in notifications:', notificationError);
      // Don't fail the check-in if notification fails
    }

    res.json({
      success: true,
      message: 'Successfully checked in',
      data: {
        attendance,
        geofenceCompliant: geofenceCheck.isCompliant
      }
    });

  } catch (error) {
    console.error('Check in error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check in',
      error: error.message
    });
  }
};

// Check Out
const checkOut = async (req, res) => {
  try {
    const user = req.user;
    const { 
      location, 
      deviceInfo, 
      batteryLevel, 
      isConnected,
      geofenceOverrideReason,
      notes 
    } = req.body;

    console.log('📥 Check-out request received for user:', user.id);
    console.log('   Location:', location);
    console.log('   Battery Level:', batteryLevel);

    const today = moment().format('YYYY-MM-DD');
    
    // Get today's attendance record
    const attendance = await Attendance.findOne({
      where: { 
        userId: user.id,
        date: today
      }
    });

    if (!attendance || !attendance.checkInTime) {
      return res.status(400).json({
        success: false,
        message: 'Must check in before checking out'
      });
    }

    if (attendance.checkOutTime) {
      return res.status(400).json({
        success: false,
        message: 'Already checked out today'
      });
    }

    // Check geofence compliance
    const geofenceCheck = await checkGeofenceCompliance(user.organizationId, location);
    
    // Calculate total duration
    const checkInTime = moment(attendance.checkInTime);
    const checkOutTime = moment();
    const totalDuration = checkOutTime.diff(checkInTime, 'minutes');

    const checkOutData = {
      checkOutTime: new Date(),
      checkOutLocation: location,
      totalDuration,
      status: 'checked_out',
      isGeofenceCompliant: attendance.isGeofenceCompliant && geofenceCheck.isCompliant,
      batteryLevel,
      isConnected,
      deviceInfo: { ...attendance.deviceInfo, ...deviceInfo },
      notes: attendance.notes ? `${attendance.notes}\n${notes || ''}` : notes
    };

    if (!geofenceCheck.isCompliant && geofenceOverrideReason) {
      checkOutData.geofenceOverrideReason = attendance.geofenceOverrideReason ? 
        `${attendance.geofenceOverrideReason}\nCheckout: ${geofenceOverrideReason}` : 
        `Checkout: ${geofenceOverrideReason}`;
    }

    await attendance.update(checkOutData);
    
    console.log('✅ Check-out data saved to database:', {
      userId: user.id,
      checkOutTime: checkOutData.checkOutTime,
      totalDuration: checkOutData.totalDuration
    });

    // Log the activity
    await ActivityLog.create({
      userId: user.id,
      attendanceId: attendance.id,
      activityType: 'check_out',
      description: 'Employee checked out',
      location,
      duration: totalDuration,
      metadata: { 
        geofenceCompliant: geofenceCheck.isCompliant,
        batteryLevel,
        totalWorkDuration: totalDuration
      }
    });

    // Store location tracking
    await LocationTracking.create({
      userId: user.id,
      attendanceId: attendance.id,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      address: location.address,
      activityType: 'stationary',
      batteryLevel,
      timestamp: new Date()
    });

    // Handle geofence violation if not compliant
    if (!geofenceCheck.isCompliant) {
      await GeofenceViolation.create({
        userId: user.id,
        organizationId: user.organizationId,
        attendanceId: attendance.id,
        violationType: 'check_out_outside',
        location,
        distance: geofenceCheck.distance || 0,
        severity: geofenceCheck.distance > 1000 ? 'high' : 'medium',
        overrideReason: geofenceOverrideReason,
        isOverridden: !!geofenceOverrideReason,
        status: geofenceOverrideReason ? 'pending' : 'pending'
      });
    }

    // 🔔 Send OneSignal notifications to HR and managers
    try {
      const time = moment().format('h:mm A');
      const userName = user.name || user.email;
      const hours = Math.floor(totalDuration / 60);
      const minutes = totalDuration % 60;
      const durationText = `${hours}h ${minutes}m`;

      // Notification title and message
      let notificationTitle = `${userName} Checked Out`;
      let notificationMessage = `Work duration: ${durationText}`;

      if (location && location.address) {
        notificationMessage = `Checked out at ${time} - ${durationText} worked`;
      }

      // Send to HR team
      await oneSignalService.sendToRole(
        user.organizationId,
        'hr',
        {
          title: notificationTitle,
          message: notificationMessage,
          data: {
            type: 'attendance_checkout',
            userId: user.id,
            userName: userName,
            attendanceId: attendance.id,
            location: location,
            time: new Date().toISOString(),
            duration: durationText,
            totalMinutes: totalDuration,
            isGeofenceCompliant: geofenceCheck.isCompliant
          }
        }
      );

      // Send to manager if exists
      if (user.managerId) {
        await oneSignalService.sendToUser(
          user.managerId.toString(),
          {
            title: `Team Member: ${userName}`,
            message: `Checked out - ${durationText} worked`,
            data: {
              type: 'team_checkout',
              userId: user.id,
              userName: userName,
              attendanceId: attendance.id,
              duration: durationText
            }
          }
        );
      }

      console.log('✅ Check-out notifications sent to HR and manager');
    } catch (notificationError) {
      console.error('⚠️ Failed to send check-out notifications:', notificationError);
      // Don't fail the check-out if notification fails
    }

    res.json({
      success: true,
      message: 'Successfully checked out',
      data: {
        attendance,
        totalDuration,
        geofenceCompliant: geofenceCheck.isCompliant
      }
    });

  } catch (error) {
    console.error('Check out error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check out',
      error: error.message
    });
  }
};

// Get Today's Attendance Status
const getTodayAttendance = async (req, res) => {
  try {
    const user = req.user;
    const today = moment().format('YYYY-MM-DD');
    
    const attendance = await Attendance.findOne({
      where: { 
        userId: user.id,
        date: today
      },
      include: [
        {
          model: DailyPlanReport,
          as: 'dailyPlanReport'
        },
        {
          model: ActivityLog,
          as: 'activityLogs',
          order: [['timestamp', 'DESC']],
          limit: 10
        },
        {
          model: GeofenceViolation,
          as: 'geofenceViolations'
        }
      ]
    });

    // Get latest location if checked in
    let currentLocation = null;
    if (attendance && attendance.checkInTime && !attendance.checkOutTime) {
      currentLocation = await LocationTracking.findOne({
        where: { 
          userId: user.id,
          attendanceId: attendance.id
        },
        order: [['timestamp', 'DESC']]
      });
    }

    res.json({
      success: true,
      data: {
        attendance,
        currentLocation,
        isCheckedIn: !!(attendance && attendance.checkInTime && !attendance.checkOutTime)
      }
    });

  } catch (error) {
    console.error('Get today attendance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get today\'s attendance',
      error: error.message
    });
  }
};

// Update Location
const updateLocation = async (req, res) => {
  try {
    const user = req.user;
    const { 
      location, 
      activityType = 'location_update', 
      batteryLevel,
      isBackground = false,
      isWithinGeofence = false,
      currentZone = null,
      distanceFromOffice = null
    } = req.body;

    console.log('📍 Location update received:', {
      userId: user.id,
      isBackground,
      activityType,
      batteryLevel,
      location: `${location.latitude}, ${location.longitude}`,
      accuracy: location.accuracy
    });

    const today = moment().format('YYYY-MM-DD');
    
    // Check for recent duplicate locations to avoid storing the same location repeatedly
    const recentLocation = await LocationTracking.findOne({
      where: { 
        userId: user.id,
        createdAt: {
          [Op.gte]: moment().subtract(2, 'minutes').toDate() // Within last 2 minutes (more aggressive)
        }
      },
      order: [['createdAt', 'DESC']]
    });
    
    // Skip if location hasn't changed significantly (within 10 meters)
    if (recentLocation) {
      const distance = calculateDistance(
        parseFloat(recentLocation.latitude),
        parseFloat(recentLocation.longitude),
        location.latitude,
        location.longitude
      );
      
      if (distance < 5) { // Less than 5 meters difference (more precise)
        console.log('📍 Skipping duplicate location update (distance: ' + distance.toFixed(1) + 'm)');
        return res.json({
          success: true,
          message: 'Location unchanged - skipped duplicate',
          data: { skipped: true, distance: distance.toFixed(1) }
        });
      }
    }
    
    // Get today's attendance record
    const attendance = await Attendance.findOne({
      where: { 
        userId: user.id,
        date: today,
        checkInTime: { [Op.not]: null },
        checkOutTime: null
      }
    });

    // Store location tracking with or without active attendance session
    const locationTrack = await LocationTracking.create({
      userId: user.id,
      attendanceId: attendance ? attendance.id : null,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      altitude: location.altitude,
      speed: location.speed,
      heading: location.heading,
      address: location.address,
      activityType,
      batteryLevel,
      isBackground,
      isWithinGeofence,
      currentZone,
      distanceFromOffice,
      timestamp: new Date()
    });

    console.log('✅ Location tracking record created:', locationTrack.id);

    // Log activity if significant movement or background update and attendance session exists
    if (attendance && ((location.speed && location.speed > 5) || isBackground)) { // 5 km/h threshold or background update
      await ActivityLog.create({
        userId: user.id,
        attendanceId: attendance.id,
        activityType: activityType === 'driving' ? 'travel' : 'work',
        description: `Location updated - ${activityType}${isBackground ? ' (background)' : ''}`,
        location,
        metadata: { 
          speed: location.speed,
          batteryLevel,
          isBackground,
          accuracy: location.accuracy
        }
      });
    }

    // AGGRESSIVE cleanup: Remove location data older than 15 minutes (runs every time)  
    try {
      const fifteenMinutesAgo = moment().subtract(15, 'minutes').toDate();
      const deletedCount = await LocationTracking.destroy({
        where: {
          createdAt: { [Op.lt]: fifteenMinutesAgo }
        }
      });
      if (deletedCount > 0) {
        console.log(`🧹 Auto-cleaned ${deletedCount} old location records (older than 15 minutes)`);
      }
    } catch (cleanupError) {
      console.error('Auto-cleanup error:', cleanupError);
    }

    res.json({
      success: true,
      message: attendance ? 'Location updated successfully' : 'Location updated successfully (no active session)',
      data: {
        ...locationTrack.toJSON(),
        hasActiveAttendance: !!attendance
      }
    });

  } catch (error) {
    console.error('❌ Update location error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update location',
      error: error.message
    });
  }
};

// Submit Daily Plan
const submitDailyPlan = async (req, res) => {
  try {
    const user = req.user;
    const { dailyPlan } = req.body;
    const today = moment().format('YYYY-MM-DD');

    // Get or create attendance record
    let attendance = await Attendance.findOne({
      where: { 
        userId: user.id,
        date: today
      }
    });

    if (!attendance) {
      attendance = await Attendance.create({
        userId: user.id,
        date: today,
        status: 'absent'
      });
    }

    // Get or create daily plan report
    let planReport = await DailyPlanReport.findOne({
      where: {
        userId: user.id,
        date: today
      }
    });

    if (planReport) {
      await planReport.update({
        dailyPlan,
        isPlanSubmitted: true,
        planSubmittedAt: new Date(),
        status: planReport.isReportSubmitted ? 'completed' : 'plan_submitted'
      });
    } else {
      planReport = await DailyPlanReport.create({
        userId: user.id,
        attendanceId: attendance.id,
        date: today,
        dailyPlan,
        isPlanSubmitted: true,
        planSubmittedAt: new Date(),
        status: 'plan_submitted'
      });
    }

    // Log activity
    await ActivityLog.create({
      userId: user.id,
      attendanceId: attendance.id,
      activityType: 'work',
      description: 'Daily plan submitted',
      metadata: { planLength: dailyPlan.length }
    });

    res.json({
      success: true,
      message: 'Daily plan submitted successfully',
      data: planReport
    });

  } catch (error) {
    console.error('Submit daily plan error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit daily plan',
      error: error.message
    });
  }
};

// Submit Daily Report
const submitDailyReport = async (req, res) => {
  try {
    const user = req.user;
    const { dailyReport } = req.body;
    const today = moment().format('YYYY-MM-DD');

    // Get attendance record
    const attendance = await Attendance.findOne({
      where: { 
        userId: user.id,
        date: today
      }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'No attendance record found for today'
      });
    }

    // Get or create daily plan report
    let planReport = await DailyPlanReport.findOne({
      where: {
        userId: user.id,
        date: today
      }
    });

    if (planReport) {
      await planReport.update({
        dailyReport,
        isReportSubmitted: true,
        reportSubmittedAt: new Date(),
        status: 'completed'
      });
    } else {
      planReport = await DailyPlanReport.create({
        userId: user.id,
        attendanceId: attendance.id,
        date: today,
        dailyReport,
        isReportSubmitted: true,
        reportSubmittedAt: new Date(),
        status: 'report_submitted'
      });
    }

    // Log activity
    await ActivityLog.create({
      userId: user.id,
      attendanceId: attendance.id,
      activityType: 'work',
      description: 'Daily report submitted',
      metadata: { reportLength: dailyReport.length }
    });

    res.json({
      success: true,
      message: 'Daily report submitted successfully',
      data: planReport
    });

  } catch (error) {
    console.error('Submit daily report error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit daily report',
      error: error.message
    });
  }
};

// Get Attendance History
const getAttendanceHistory = async (req, res) => {
  try {
    const user = req.user;
    const { 
      startDate, 
      endDate, 
      page = 1, 
      limit = 30 
    } = req.query;

    const offset = (page - 1) * limit;
    const whereClause = { userId: user.id };

    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    } else if (startDate) {
      whereClause.date = {
        [Op.gte]: startDate
      };
    } else if (endDate) {
      whereClause.date = {
        [Op.lte]: endDate
      };
    }

    const { count, rows: attendances } = await Attendance.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: DailyPlanReport,
          as: 'dailyPlanReport'
        },
        {
          model: ActivityLog,
          as: 'activityLogs',
          limit: 5,
          order: [['timestamp', 'DESC']]
        }
      ],
      order: [['date', 'DESC']],
      limit: parseInt(limit),
      offset
    });

    // Calculate summary statistics
    const totalDays = count;
    const presentDays = attendances.filter(a => a.status !== 'absent').length;
    const totalWorkHours = attendances.reduce((sum, a) => sum + (a.totalDuration || 0), 0) / 60;
    const avgWorkHours = totalWorkHours / (presentDays || 1);

    res.json({
      success: true,
      data: {
        attendances,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalRecords: count,
          hasNext: (page * limit) < count,
          hasPrev: page > 1
        },
        summary: {
          totalDays,
          presentDays,
          absentDays: totalDays - presentDays,
          totalWorkHours: Math.round(totalWorkHours * 100) / 100,
          avgWorkHours: Math.round(avgWorkHours * 100) / 100
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
};

// Geofence Management
const getGeofences = async (req, res) => {
  try {
    const user = req.user;
    
    const geofences = await Geofence.findAll({
      where: { 
        organizationId: user.organizationId,
        isActive: true
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: geofences
    });

  } catch (error) {
    console.error('Get geofences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get geofences',
      error: error.message
    });
  }
};

// Helper function to check geofence compliance
const checkGeofenceCompliance = async (organizationId, location) => {
  try {
    const geofences = await Geofence.findAll({
      where: { 
        organizationId,
        isActive: true
      }
    });

    if (geofences.length === 0) {
      return { isCompliant: true, distance: 0 };
    }

    let minDistance = Infinity;
    let isWithinAnyGeofence = false;

    for (const geofence of geofences) {
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        parseFloat(geofence.latitude),
        parseFloat(geofence.longitude)
      );

      minDistance = Math.min(minDistance, distance);

      if (distance <= geofence.radius) {
        isWithinAnyGeofence = true;
        break;
      }
    }

    return {
      isCompliant: isWithinAnyGeofence,
      distance: minDistance
    };

  } catch (error) {
    console.error('Geofence check error:', error);
    return { isCompliant: true, distance: 0 }; // Default to compliant on error
  }
};

// Helper function to calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Get Daily Plans
const getDailyPlans = async (req, res) => {
  try {
    const { date, page = 1, limit = 100 } = req.query;
    const { organizationId, role, hrCode, id: userId } = req.user;
    
    const offset = (page - 1) * limit;
    
    // Build where clause for filtering
    let whereClause = { organizationId };
    
    // Apply HR code filter if user is HR
    if (role === 'hr' && hrCode) {
      whereClause.hrCode = hrCode;
    }
    
    // For employees, only show their own data
    if (role === 'employee') {
      whereClause.id = userId;
    }
    
    // Build date filter
    let dateFilter = {};
    if (date) {
      dateFilter.date = date;
    }
    
    // Get users first
    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'department', 'designation', 'organizationId', 'hrCode']
    });
    
    const userIds = users.map(user => user.id);
    
    if (userIds.length === 0) {
      return res.json({
        success: true,
        data: {
          dailyPlans: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalRecords: 0,
            hasNext: false,
            hasPrev: false
          }
        }
      });
    }
    
    // Get daily plans
    const { count, rows: dailyPlans } = await DailyPlanReport.findAndCountAll({
      where: {
        userId: { [Op.in]: userIds },
        ...dateFilter,
        dailyPlan: { [Op.ne]: null }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'department', 'designation', 'organizationId', 'hrCode']
      }],
      order: [['date', 'DESC'], ['planSubmittedAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    // Transform data for frontend
    const transformedPlans = dailyPlans.map(plan => ({
      id: plan.id,
      userId: plan.userId,
      userName: plan.user?.name || 'Unknown',
      userEmail: plan.user?.email || '',
      department: plan.user?.department || 'N/A',
      designation: plan.user?.designation || 'N/A',
      organizationId: plan.user?.organizationId || organizationId,
      hrCode: plan.user?.hrCode || hrCode,
      date: plan.date,
      dailyPlan: plan.dailyPlan,
      planSubmittedAt: plan.planSubmittedAt,
      status: plan.status
    }));
    
    res.json({
      success: true,
      data: {
        dailyPlans: transformedPlans,
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
    console.error('Get daily plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily plans',
      error: error.message
    });
  }
};

// Get Daily Reports
const getDailyReports = async (req, res) => {
  try {
    const { date, page = 1, limit = 100 } = req.query;
    const { organizationId, role, hrCode, id: userId } = req.user;
    
    const offset = (page - 1) * limit;
    
    // Build where clause for filtering
    let whereClause = { organizationId };
    
    // Apply HR code filter if user is HR
    if (role === 'hr' && hrCode) {
      whereClause.hrCode = hrCode;
    }
    
    // For employees, only show their own data
    if (role === 'employee') {
      whereClause.id = userId;
    }
    
    // Build date filter
    let dateFilter = {};
    if (date) {
      dateFilter.date = date;
    }
    
    // Get users first
    const users = await User.findAll({
      where: whereClause,
      attributes: ['id', 'name', 'email', 'department', 'designation', 'organizationId', 'hrCode']
    });
    
    const userIds = users.map(user => user.id);
    
    if (userIds.length === 0) {
      return res.json({
        success: true,
        data: {
          dailyReports: [],
          pagination: {
            currentPage: parseInt(page),
            totalPages: 0,
            totalRecords: 0,
            hasNext: false,
            hasPrev: false
          }
        }
      });
    }
    
    // Get daily reports with attendance data
    const { count, rows: dailyReports } = await DailyPlanReport.findAndCountAll({
      where: {
        userId: { [Op.in]: userIds },
        ...dateFilter,
        dailyReport: { [Op.ne]: null }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'name', 'email', 'department', 'designation', 'organizationId', 'hrCode']
      }, {
        model: Attendance,
        as: 'attendance',
        attributes: ['checkInTime', 'checkOutTime', 'totalDuration']
      }],
      order: [['date', 'DESC'], ['reportSubmittedAt', 'DESC']],
      limit: parseInt(limit),
      offset
    });
    
    // Transform data for frontend
    const transformedReports = dailyReports.map(report => ({
      id: report.id,
      userId: report.userId,
      userName: report.user?.name || 'Unknown',
      userEmail: report.user?.email || '',
      department: report.user?.department || 'N/A',
      designation: report.user?.designation || 'N/A',
      organizationId: report.user?.organizationId || organizationId,
      hrCode: report.user?.hrCode || hrCode,
      date: report.date,
      dailyReport: report.dailyReport,
      reportSubmittedAt: report.reportSubmittedAt,
      checkInTime: report.attendance?.checkInTime,
      checkOutTime: report.attendance?.checkOutTime,
      sessionDuration: report.attendance?.totalDuration,
      status: report.status
    }));
    
    res.json({
      success: true,
      data: {
        dailyReports: transformedReports,
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
    console.error('Get daily reports error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily reports',
      error: error.message
    });
  }
};

// Get monthly attendance statistics
const getMonthlyStats = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { year, month } = req.query;
    
    const targetYear = year ? parseInt(year) : moment().year();
    const targetMonth = month ? parseInt(month) : moment().month() + 1;
    
    const startDate = moment([targetYear, targetMonth - 1, 1]).format('YYYY-MM-DD');
    const endDate = moment([targetYear, targetMonth - 1]).endOf('month').format('YYYY-MM-DD');
    
    const attendanceRecords = await Attendance.findAll({
      where: {
        userId,
        date: {
          [Op.between]: [startDate, endDate]
        }
      },
      order: [['date', 'ASC']]
    });
    
    let present = 0, absent = 0, late = 0, leave = 0;
    
    attendanceRecords.forEach(record => {
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
        default:
          absent++;
      }
    });
    
    const totalWorkingDays = moment([targetYear, targetMonth - 1]).daysInMonth();
    const attendedDays = present + late;
    const attendancePercentage = totalWorkingDays > 0 ? attendedDays / totalWorkingDays : 0;
    
    res.json({
      success: true,
      data: {
        present,
        absent,
        late,
        leave,
        totalWorkingDays,
        attendedDays,
        attendancePercentage,
        month: targetMonth,
        year: targetYear
      }
    });
  } catch (error) {
    console.error('Get monthly stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get monthly stats',
      error: error.message
    });
  }
};

// Get weekly hours data
const getWeeklyHours = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { year, week } = req.query;
    
    const targetYear = year ? parseInt(year) : moment().year();
    const targetWeek = week ? parseInt(week) : moment().week();
    
    const startOfWeek = moment().year(targetYear).week(targetWeek).startOf('week');
    const endOfWeek = moment().year(targetYear).week(targetWeek).endOf('week');
    
    const weeklyHours = [];
    
    for (let i = 0; i < 7; i++) {
      const date = startOfWeek.clone().add(i, 'days').format('YYYY-MM-DD');
      const attendance = await Attendance.findOne({
        where: {
          userId,
          date
        }
      });
      
      if (attendance && attendance.checkInTime && attendance.checkOutTime) {
        const checkIn = moment(attendance.checkInTime);
        const checkOut = moment(attendance.checkOutTime);
        const hours = checkOut.diff(checkIn, 'hours', true);
        weeklyHours.push(Math.max(0, hours));
      } else {
        weeklyHours.push(0);
      }
    }
    
    res.json({
      success: true,
      data: {
        weeklyHours,
        week: targetWeek,
        year: targetYear,
        startDate: startOfWeek.format('YYYY-MM-DD'),
        endDate: endOfWeek.format('YYYY-MM-DD')
      }
    });
  } catch (error) {
    console.error('Get weekly hours error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get weekly hours',
      error: error.message
    });
  }
};

// Get location tracking data
const getLocationData = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { limit = 10, offset = 0, startDate, endDate } = req.query;
    
    let whereClause = { userId };
    
    if (startDate && endDate) {
      whereClause.timestamp = {
        [Op.between]: [
          moment(startDate).startOf('day').toDate(),
          moment(endDate).endOf('day').toDate()
        ]
      };
    }
    
    const locations = await LocationTracking.findAll({
      where: whereClause,
      order: [['timestamp', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
    
    res.json({
      success: true,
      data: {
        locations: locations.map(loc => ({
          id: loc.id,
          latitude: loc.latitude,
          longitude: loc.longitude,
          address: loc.address,
          timestamp: loc.timestamp,
          activityType: loc.activityType,
          batteryLevel: loc.batteryLevel,
          accuracy: loc.accuracy
        })),
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: locations.length
        }
      }
    });
  } catch (error) {
    console.error('Get location data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get location data',
      error: error.message
    });
  }
};

// Get recent activities
const getActivities = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { limit = 5, activityType } = req.query;
    
    let whereClause = { userId };
    
    if (activityType) {
      whereClause.activityType = activityType;
    }
    
    const activities = await ActivityLog.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: {
        activities: activities.map(activity => ({
          id: activity.id,
          type: activity.activityType,
          description: activity.description,
          location: activity.location,
          timestamp: activity.createdAt,
          metadata: activity.metadata
        }))
      }
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get activities',
      error: error.message
    });
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayAttendance,
  updateLocation,
  submitDailyPlan,
  submitDailyReport,
  getAttendanceHistory,
  getGeofences,
  getDailyPlans,
  getDailyReports,
  getMonthlyStats,
  getWeeklyHours,
  getLocationData,
  getActivities
};