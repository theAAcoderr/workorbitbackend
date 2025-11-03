const {
  User,
  Organization,
  Geofence,
  GeofenceViolation,
  Attendance,
  LocationTracking
} = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

// Get all geofences for organization
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

    // Transform geofences to match frontend GeofenceModel structure
    const transformedGeofences = geofences.map(geofence => ({
      id: geofence.id,
      name: geofence.name,
      organizationId: geofence.organizationId,
      type: geofence.zoneType || 'office',
      center: {
        latitude: parseFloat(geofence.latitude),
        longitude: parseFloat(geofence.longitude)
      },
      radius: geofence.radius,
      address: geofence.address,
      departmentId: geofence.departmentId || null,
      teamId: geofence.teamId || null,
      applicableEmployees: geofence.applicableEmployees || ['all'],
      schedule: {
        alwaysActive: true,
        workingHours: geofence.workingHours || null,
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      rules: {
        requireCheckInWithinGeofence: geofence.allowCheckIn !== false,
        requireCheckOutWithinGeofence: geofence.allowCheckOut !== false,
        allowOverride: true,
        maxOverrideDistance: 1000,
        notificationEnabled: true
      },
      isActive: geofence.isActive,
      createdAt: geofence.createdAt,
      createdBy: geofence.createdBy,
      updatedAt: geofence.updatedAt,
      updatedBy: geofence.updatedBy || null
    }));

    res.json({
      success: true,
      data: transformedGeofences
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

// Get single geofence by ID
const getGeofenceById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const geofence = await Geofence.findOne({
      where: {
        id,
        organizationId: user.organizationId
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    // Transform geofence to match frontend GeofenceModel structure
    const transformedGeofence = {
      id: geofence.id,
      name: geofence.name,
      organizationId: geofence.organizationId,
      type: geofence.zoneType || 'office',
      center: {
        latitude: parseFloat(geofence.latitude),
        longitude: parseFloat(geofence.longitude)
      },
      radius: geofence.radius,
      address: geofence.address,
      departmentId: geofence.departmentId || null,
      teamId: geofence.teamId || null,
      applicableEmployees: geofence.applicableEmployees || ['all'],
      schedule: {
        alwaysActive: true,
        workingHours: geofence.workingHours || null,
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      },
      rules: {
        requireCheckInWithinGeofence: geofence.allowCheckIn !== false,
        requireCheckOutWithinGeofence: geofence.allowCheckOut !== false,
        allowOverride: true,
        maxOverrideDistance: 1000,
        notificationEnabled: true
      },
      isActive: geofence.isActive,
      createdAt: geofence.createdAt,
      createdBy: geofence.createdBy,
      updatedAt: geofence.updatedAt,
      updatedBy: geofence.updatedBy || null
    };

    res.json({
      success: true,
      data: transformedGeofence
    });

  } catch (error) {
    console.error('Get geofence by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get geofence',
      error: error.message
    });
  }
};

// Create new geofence
const createGeofence = async (req, res) => {
  try {
    const user = req.user;
    const {
      name,
      description,
      latitude,
      longitude,
      radius,
      zoneType,
      address,
      allowCheckIn,
      allowCheckOut,
      workingHours
    } = req.body;

    // Validate required fields
    if (!name || !latitude || !longitude || !radius) {
      return res.status(400).json({
        success: false,
        message: 'Name, latitude, longitude, and radius are required'
      });
    }

    // Create geofence
    const geofence = await Geofence.create({
      organizationId: user.organizationId,
      name,
      description,
      latitude,
      longitude,
      radius,
      zoneType: zoneType || 'office',
      address,
      isActive: true,
      allowCheckIn: allowCheckIn !== false,
      allowCheckOut: allowCheckOut !== false,
      workingHours,
      createdBy: user.id,
      metadata: {
        createdAt: new Date(),
        createdByName: user.name,
        createdByEmail: user.email
      }
    });

    // Fetch with associations
    const createdGeofence = await Geofence.findByPk(geofence.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Geofence created successfully',
      data: createdGeofence
    });

  } catch (error) {
    console.error('Create geofence error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create geofence',
      error: error.message
    });
  }
};

// Update geofence
const updateGeofence = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const {
      name,
      description,
      latitude,
      longitude,
      radius,
      zoneType,
      address,
      isActive,
      allowCheckIn,
      allowCheckOut,
      workingHours
    } = req.body;

    // Find geofence
    const geofence = await Geofence.findOne({
      where: {
        id,
        organizationId: user.organizationId
      }
    });

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    // Update geofence
    await geofence.update({
      name: name || geofence.name,
      description: description !== undefined ? description : geofence.description,
      latitude: latitude || geofence.latitude,
      longitude: longitude || geofence.longitude,
      radius: radius || geofence.radius,
      zoneType: zoneType || geofence.zoneType,
      address: address !== undefined ? address : geofence.address,
      isActive: isActive !== undefined ? isActive : geofence.isActive,
      allowCheckIn: allowCheckIn !== undefined ? allowCheckIn : geofence.allowCheckIn,
      allowCheckOut: allowCheckOut !== undefined ? allowCheckOut : geofence.allowCheckOut,
      workingHours: workingHours !== undefined ? workingHours : geofence.workingHours,
      metadata: {
        ...geofence.metadata,
        lastUpdatedAt: new Date(),
        lastUpdatedBy: user.id,
        lastUpdatedByName: user.name,
        lastUpdatedByEmail: user.email
      }
    });

    // Fetch updated with associations
    const updatedGeofence = await Geofence.findByPk(geofence.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Geofence updated successfully',
      data: updatedGeofence
    });

  } catch (error) {
    console.error('Update geofence error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update geofence',
      error: error.message
    });
  }
};

// Delete geofence
const deleteGeofence = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Find geofence
    const geofence = await Geofence.findOne({
      where: {
        id,
        organizationId: user.organizationId
      }
    });

    if (!geofence) {
      return res.status(404).json({
        success: false,
        message: 'Geofence not found'
      });
    }

    // Note: In the current schema, we don't store geofence ID directly in attendance records
    // The location is stored in checkInLocation/checkOutLocation JSON fields
    // So we can safely delete geofences without checking attendance records

    // Soft delete by setting isActive to false
    await geofence.update({
      isActive: false,
      metadata: {
        ...geofence.metadata,
        deletedAt: new Date(),
        deletedBy: user.id,
        deletedByName: user.name,
        deletedByEmail: user.email
      }
    });

    console.log(`✅ Geofence ${geofence.name} (ID: ${geofence.id}) deleted successfully by ${user.email}`);

    res.json({
      success: true,
      message: 'Geofence deleted successfully',
      data: {
        id: geofence.id,
        name: geofence.name
      }
    });

  } catch (error) {
    console.error('Delete geofence error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete geofence',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get geofence violations
const getGeofenceViolations = async (req, res) => {
  try {
    const user = req.user;
    const { startDate, endDate, userId, geofenceId } = req.query;

    const whereClause = {
      organizationId: user.organizationId
    };

    // Add date filters
    if (startDate || endDate) {
      whereClause.violationTime = {};
      if (startDate) {
        whereClause.violationTime[Op.gte] = moment(startDate).startOf('day').toDate();
      }
      if (endDate) {
        whereClause.violationTime[Op.lte] = moment(endDate).endOf('day').toDate();
      }
    }

    // Add user filter
    if (userId) {
      whereClause.userId = userId;
    }

    // Add geofence filter
    if (geofenceId) {
      whereClause.geofenceId = geofenceId;
    }

    const violations = await GeofenceViolation.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'department', 'designation']
        },
        {
          model: Geofence,
          as: 'geofence',
          attributes: ['id', 'name', 'zoneType', 'radius']
        }
      ],
      order: [['violationTime', 'DESC']],
      limit: 100
    });

    res.json({
      success: true,
      data: violations
    });

  } catch (error) {
    console.error('Get geofence violations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get geofence violations',
      error: error.message
    });
  }
};

// Create geofence violation (for mobile app reporting)
const createGeofenceViolation = async (req, res) => {
  try {
    const user = req.user;
    const {
      violationType,
      location,
      distance,
      overrideReason,
      geofenceName,
      deviceInfo,
      batteryLevel,
      isConnected
    } = req.body;

    // Validate required fields
    if (!violationType || !location) {
      return res.status(400).json({
        success: false,
        message: 'Violation type and location are required'
      });
    }

    // Determine severity based on distance
    let severity = 'medium';
    if (distance) {
      if (distance > 1000) severity = 'high';
      else if (distance > 500) severity = 'medium';
      else severity = 'low';
    }

    // Create the violation record
    const violation = await GeofenceViolation.create({
      userId: user.id,
      organizationId: user.organizationId,
      violationType,
      violationTime: new Date(),
      location: {
        latitude: location.latitude,
        longitude: location.longitude,
        address: location.address || '',
        accuracy: location.accuracy,
        altitude: location.altitude,
        speed: location.speed,
        heading: location.heading
      },
      distance: distance || 0,
      severity,
      overrideReason,
      isOverridden: !!overrideReason,
      status: overrideReason ? 'approved' : 'pending',
      metadata: {
        geofenceName: geofenceName || 'Unknown',
        deviceInfo: deviceInfo || {},
        batteryLevel: batteryLevel || null,
        isConnected: isConnected !== undefined ? isConnected : true,
        reportedAt: new Date().toISOString(),
        source: 'mobile_app'
      }
    });

    // If it's an override, auto-approve it
    if (overrideReason) {
      violation.overriddenBy = user.id;
      violation.overriddenAt = new Date();
      violation.resolvedBy = user.id;
      violation.resolvedAt = new Date();
      violation.resolutionNotes = `Self-override: ${overrideReason}`;
      await violation.save();
    }

    res.json({
      success: true,
      message: 'Geofence violation recorded successfully',
      data: violation
    });

  } catch (error) {
    console.error('Error creating geofence violation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create geofence violation',
      error: error.message
    });
  }
};

// Clear geofence violation
const clearGeofenceViolation = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { reason } = req.body;

    const violation = await GeofenceViolation.findOne({
      where: {
        id,
        organizationId: user.organizationId
      }
    });

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: 'Violation not found'
      });
    }

    // Update violation status
    await violation.update({
      status: 'resolved',
      resolvedBy: user.id,
      resolvedAt: new Date(),
      resolutionNotes: reason || 'Cleared by admin',
      metadata: {
        ...violation.metadata,
        clearedByName: user.name,
        clearedByEmail: user.email,
        clearedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Violation cleared successfully',
      data: violation
    });

  } catch (error) {
    console.error('Clear geofence violation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear violation',
      error: error.message
    });
  }
};

// Delete geofence violation
const deleteGeofenceViolation = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    console.log(`🗑️ Delete violation request for ID: ${id} by user: ${user.email}`);

    const violation = await GeofenceViolation.findOne({
      where: {
        id,
        organizationId: user.organizationId
      }
    });

    if (!violation) {
      return res.status(404).json({
        success: false,
        message: 'Violation not found or you do not have permission to delete it'
      });
    }

    // Hard delete the violation record
    await violation.destroy();

    console.log(`✅ Violation ${violation.id} deleted successfully by ${user.email}`);

    res.json({
      success: true,
      message: 'Violation deleted successfully',
      data: {
        id: violation.id,
        employeeName: violation.employeeName
      }
    });

  } catch (error) {
    console.error('Delete violation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete violation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Clear all violations for a user
const clearAllViolations = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = req.user;
    const { reason } = req.body;

    const result = await GeofenceViolation.update(
      {
        status: 'resolved',
        resolvedBy: user.id,
        resolvedAt: new Date(),
        resolutionNotes: reason || 'Bulk clear by admin'
      },
      {
        where: {
          userId,
          organizationId: user.organizationId,
          status: 'pending'
        }
      }
    );

    res.json({
      success: true,
      message: `Cleared ${result[0]} violations`,
      clearedCount: result[0]
    });

  } catch (error) {
    console.error('Clear all violations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clear violations',
      error: error.message
    });
  }
};

// Get employee locations
const getEmployeeLocations = async (req, res) => {
  try {
    const user = req.user;
    const today = moment().format('YYYY-MM-DD');

    // Get all active employees in the organization
    const employees = await User.findAll({
      where: {
        organizationId: user.organizationId,
        status: 'active',
        role: { [Op.in]: ['employee', 'manager'] }
      },
      attributes: ['id', 'name', 'email', 'department', 'designation']
    });

    // Get today's attendance and latest location for each employee
    const employeeLocations = await Promise.all(employees.map(async (employee) => {
      // Get today's attendance
      const attendance = await Attendance.findOne({
        where: {
          userId: employee.id,
          date: today
        }
      });

      // Get latest location
      const latestLocation = await LocationTracking.findOne({
        where: {
          userId: employee.id
        },
        order: [['timestamp', 'DESC']]
      });

      return {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        designation: employee.designation,
        isCheckedIn: !!attendance?.checkInTime && !attendance?.checkOutTime,
        checkInTime: attendance?.checkInTime,
        checkOutTime: attendance?.checkOutTime,
        location: latestLocation ? {
          latitude: latestLocation.latitude,
          longitude: latestLocation.longitude,
          accuracy: latestLocation.accuracy,
          timestamp: latestLocation.timestamp
        } : null
      };
    }));

    res.json({
      success: true,
      data: employeeLocations
    });

  } catch (error) {
    console.error('Get employee locations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get employee locations',
      error: error.message
    });
  }
};

// Helper function to calculate distance between two points
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

// Check geofence compliance
const checkGeofenceCompliance = async (req, res) => {
  try {
    const user = req.user;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const geofences = await Geofence.findAll({
      where: {
        organizationId: user.organizationId,
        isActive: true
      }
    });

    const compliance = geofences.map(geofence => {
      const distance = calculateDistance(
        latitude,
        longitude,
        parseFloat(geofence.latitude),
        parseFloat(geofence.longitude)
      );

      return {
        geofenceId: geofence.id,
        geofenceName: geofence.name,
        zoneType: geofence.zoneType,
        radius: geofence.radius,
        distance: Math.round(distance),
        isWithinGeofence: distance <= geofence.radius,
        allowCheckIn: geofence.allowCheckIn,
        allowCheckOut: geofence.allowCheckOut
      };
    });

    const withinAnyGeofence = compliance.some(c => c.isWithinGeofence);

    res.json({
      success: true,
      data: {
        withinAnyGeofence,
        geofences: compliance
      }
    });

  } catch (error) {
    console.error('Check geofence compliance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check geofence compliance',
      error: error.message
    });
  }
};

module.exports = {
  getGeofences,
  getGeofenceById,
  createGeofence,
  updateGeofence,
  deleteGeofence,
  getGeofenceViolations,
  createGeofenceViolation,
  clearGeofenceViolation,
  deleteGeofenceViolation,
  clearAllViolations,
  getEmployeeLocations,
  checkGeofenceCompliance
};