const Holiday = require('../models/Holiday');
const { User, Organization } = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');

/**
 * @desc    Get all holidays for organization
 * @route   GET /api/v1/holidays
 * @access  Private
 */
exports.getHolidays = async (req, res) => {
  try {
    const { year, month, type, startDate, endDate } = req.query;
    const organizationId = req.user.organizationId;

    // Build query filters
    const whereClause = {
      organizationId,
      isActive: true
    };

    // Filter by year
    if (year) {
      whereClause.date = {
        [Op.between]: [
          `${year}-01-01`,
          `${year}-12-31`
        ]
      };
    }

    // Filter by month and year
    if (month && year) {
      const startOfMonth = moment(`${year}-${month}`, 'YYYY-MM').startOf('month').format('YYYY-MM-DD');
      const endOfMonth = moment(`${year}-${month}`, 'YYYY-MM').endOf('month').format('YYYY-MM-DD');
      whereClause.date = {
        [Op.between]: [startOfMonth, endOfMonth]
      };
    }

    // Filter by custom date range
    if (startDate && endDate) {
      whereClause.date = {
        [Op.between]: [startDate, endDate]
      };
    }

    // Filter by type
    if (type) {
      whereClause.type = type;
    }

    const holidays = await Holiday.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['date', 'ASC']]
    });

    res.status(200).json({
      success: true,
      count: holidays.length,
      data: holidays
    });
  } catch (error) {
    console.error('Error fetching holidays:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching holidays',
      error: error.message
    });
  }
};

/**
 * @desc    Get single holiday
 * @route   GET /api/v1/holidays/:id
 * @access  Private
 */
exports.getHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const holiday = await Holiday.findOne({
      where: {
        id,
        organizationId
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found'
      });
    }

    res.status(200).json({
      success: true,
      data: holiday
    });
  } catch (error) {
    console.error('Error fetching holiday:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching holiday',
      error: error.message
    });
  }
};

/**
 * @desc    Create new holiday
 * @route   POST /api/v1/holidays
 * @access  Private (Admin/HR)
 */
exports.createHoliday = async (req, res) => {
  try {
    const { name, description, date, type } = req.body;
    const organizationId = req.user.organizationId;
    const createdBy = req.user.id;

    // Validate required fields
    if (!name || !date) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name and date'
      });
    }

    // Check if holiday already exists on this date
    const existingHoliday = await Holiday.findOne({
      where: {
        organizationId,
        date,
        isActive: true
      }
    });

    if (existingHoliday) {
      return res.status(400).json({
        success: false,
        message: 'A holiday already exists on this date'
      });
    }

    // Create holiday
    const holiday = await Holiday.create({
      name,
      description,
      date,
      type: type || 'company',
      organizationId,
      createdBy
    });

    // Fetch the created holiday with associations
    const createdHoliday = await Holiday.findByPk(holiday.id, {
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
      message: 'Holiday created successfully',
      data: createdHoliday
    });
  } catch (error) {
    console.error('Error creating holiday:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating holiday',
      error: error.message
    });
  }
};

/**
 * @desc    Update holiday
 * @route   PUT /api/v1/holidays/:id
 * @access  Private (Admin/HR)
 */
exports.updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, date, type, isActive } = req.body;
    const organizationId = req.user.organizationId;

    // Find holiday
    const holiday = await Holiday.findOne({
      where: {
        id,
        organizationId
      }
    });

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found'
      });
    }

    // Check if date is being changed and if another holiday exists on new date
    if (date && date !== holiday.date) {
      const existingHoliday = await Holiday.findOne({
        where: {
          organizationId,
          date,
          isActive: true,
          id: { [Op.ne]: id }
        }
      });

      if (existingHoliday) {
        return res.status(400).json({
          success: false,
          message: 'A holiday already exists on this date'
        });
      }
    }

    // Update holiday
    await holiday.update({
      name: name || holiday.name,
      description: description !== undefined ? description : holiday.description,
      date: date || holiday.date,
      type: type || holiday.type,
      isActive: isActive !== undefined ? isActive : holiday.isActive
    });

    // Fetch updated holiday with associations
    const updatedHoliday = await Holiday.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Holiday updated successfully',
      data: updatedHoliday
    });
  } catch (error) {
    console.error('Error updating holiday:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating holiday',
      error: error.message
    });
  }
};

/**
 * @desc    Delete holiday
 * @route   DELETE /api/v1/holidays/:id
 * @access  Private (Admin/HR)
 */
exports.deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    // Find holiday
    const holiday = await Holiday.findOne({
      where: {
        id,
        organizationId
      }
    });

    if (!holiday) {
      return res.status(404).json({
        success: false,
        message: 'Holiday not found'
      });
    }

    // Soft delete by marking as inactive
    await holiday.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: 'Holiday deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting holiday:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting holiday',
      error: error.message
    });
  }
};

/**
 * @desc    Get upcoming holidays
 * @route   GET /api/v1/holidays/upcoming
 * @access  Private
 */
exports.getUpcomingHolidays = async (req, res) => {
  try {
    const { limit = 5 } = req.query;
    const organizationId = req.user.organizationId;
    const today = moment().format('YYYY-MM-DD');

    const holidays = await Holiday.findAll({
      where: {
        organizationId,
        isActive: true,
        date: {
          [Op.gte]: today
        }
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['date', 'ASC']],
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      count: holidays.length,
      data: holidays
    });
  } catch (error) {
    console.error('Error fetching upcoming holidays:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching upcoming holidays',
      error: error.message
    });
  }
};

/**
 * @desc    Check if a date is a holiday
 * @route   GET /api/v1/holidays/check/:date
 * @access  Private
 */
exports.checkHoliday = async (req, res) => {
  try {
    const { date } = req.params;
    const organizationId = req.user.organizationId;

    const holiday = await Holiday.findOne({
      where: {
        organizationId,
        date,
        isActive: true
      }
    });

    res.status(200).json({
      success: true,
      isHoliday: !!holiday,
      data: holiday
    });
  } catch (error) {
    console.error('Error checking holiday:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking holiday',
      error: error.message
    });
  }
};
