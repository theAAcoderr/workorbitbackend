const { Compliance, User, Organization } = require('../models');
const { Op } = require('sequelize');

// Get all compliance items for organization
exports.getCompliances = async (req, res) => {
  try {
    const { type, status } = req.query;
    const { organizationId } = req.user;

    const whereClause = {
      organizationId,
      isActive: true,
    };

    if (type) whereClause.type = type;
    if (status) whereClause.status = status;

    const compliances = await Compliance.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['expiryDate', 'ASC']],
    });

    // Update status based on expiry date
    const now = new Date();
    const reminderThreshold = new Date();
    reminderThreshold.setDate(reminderThreshold.getDate() + 30);

    for (const compliance of compliances) {
      if (compliance.expiryDate) {
        const expiryDate = new Date(compliance.expiryDate);
        let newStatus = compliance.status;

        if (expiryDate < now) {
          newStatus = 'Expired';
        } else if (expiryDate < reminderThreshold) {
          newStatus = 'Expiring Soon';
        } else {
          newStatus = 'Active';
        }

        if (newStatus !== compliance.status) {
          await compliance.update({ status: newStatus });
        }
      }
    }

    res.json({
      success: true,
      data: compliances,
    });
  } catch (error) {
    console.error('Get compliances error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch compliance items',
      error: error.message,
    });
  }
};

// Get single compliance item
exports.getCompliance = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;

    const compliance = await Compliance.findOne({
      where: {
        id,
        organizationId,
        isActive: true,
      },
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    if (!compliance) {
      return res.status(404).json({
        success: false,
        message: 'Compliance item not found',
      });
    }

    res.json({
      success: true,
      data: compliance,
    });
  } catch (error) {
    console.error('Get compliance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch compliance item',
      error: error.message,
    });
  }
};

// Create compliance item
exports.createCompliance = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      category,
      issueDate,
      expiryDate,
      reminderDays,
      issuingAuthority,
      certificateNumber,
      documentUrl,
      assignedTo,
      notes,
    } = req.body;

    const { organizationId, id: userId } = req.user;

    // Determine status based on expiry date
    let status = 'Active';
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      const now = new Date();
      const reminderThreshold = new Date();
      reminderThreshold.setDate(reminderThreshold.getDate() + (reminderDays || 30));

      if (expiry < now) {
        status = 'Expired';
      } else if (expiry < reminderThreshold) {
        status = 'Expiring Soon';
      }
    }

    const compliance = await Compliance.create({
      organizationId,
      title,
      description,
      type,
      category,
      status,
      issueDate,
      expiryDate,
      reminderDays: reminderDays || 30,
      issuingAuthority,
      certificateNumber,
      documentUrl,
      assignedTo,
      notes,
      createdBy: userId,
    });

    const complianceWithDetails = await Compliance.findByPk(compliance.id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: 'Compliance item created successfully',
      data: complianceWithDetails,
    });
  } catch (error) {
    console.error('Create compliance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create compliance item',
      error: error.message,
    });
  }
};

// Update compliance item
exports.updateCompliance = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;

    const compliance = await Compliance.findOne({
      where: {
        id,
        organizationId,
        isActive: true,
      },
    });

    if (!compliance) {
      return res.status(404).json({
        success: false,
        message: 'Compliance item not found',
      });
    }

    const {
      title,
      description,
      type,
      category,
      status,
      issueDate,
      expiryDate,
      reminderDays,
      issuingAuthority,
      certificateNumber,
      documentUrl,
      assignedTo,
      notes,
    } = req.body;

    // Auto-update status if expiry date changed
    let newStatus = status;
    if (expiryDate && !status) {
      const expiry = new Date(expiryDate);
      const now = new Date();
      const reminderThreshold = new Date();
      reminderThreshold.setDate(reminderThreshold.getDate() + (reminderDays || compliance.reminderDays || 30));

      if (expiry < now) {
        newStatus = 'Expired';
      } else if (expiry < reminderThreshold) {
        newStatus = 'Expiring Soon';
      } else {
        newStatus = 'Active';
      }
    }

    await compliance.update({
      title: title || compliance.title,
      description,
      type: type || compliance.type,
      category,
      status: newStatus,
      issueDate,
      expiryDate,
      reminderDays,
      issuingAuthority,
      certificateNumber,
      documentUrl,
      assignedTo,
      notes,
    });

    const updatedCompliance = await Compliance.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    res.json({
      success: true,
      message: 'Compliance item updated successfully',
      data: updatedCompliance,
    });
  } catch (error) {
    console.error('Update compliance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update compliance item',
      error: error.message,
    });
  }
};

// Delete compliance item (soft delete)
exports.deleteCompliance = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;

    const compliance = await Compliance.findOne({
      where: {
        id,
        organizationId,
        isActive: true,
      },
    });

    if (!compliance) {
      return res.status(404).json({
        success: false,
        message: 'Compliance item not found',
      });
    }

    await compliance.update({ isActive: false });

    res.json({
      success: true,
      message: 'Compliance item deleted successfully',
    });
  } catch (error) {
    console.error('Delete compliance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete compliance item',
      error: error.message,
    });
  }
};

// Get expiring compliance items
exports.getExpiringCompliances = async (req, res) => {
  try {
    const { organizationId } = req.user;
    const { days = 30 } = req.query;

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + parseInt(days));

    const compliances = await Compliance.findAll({
      where: {
        organizationId,
        isActive: true,
        expiryDate: {
          [Op.between]: [new Date(), futureDate],
        },
      },
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['expiryDate', 'ASC']],
    });

    res.json({
      success: true,
      data: compliances,
    });
  } catch (error) {
    console.error('Get expiring compliances error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expiring compliance items',
      error: error.message,
    });
  }
};

// Get expired compliance items
exports.getExpiredCompliances = async (req, res) => {
  try {
    const { organizationId } = req.user;

    const compliances = await Compliance.findAll({
      where: {
        organizationId,
        isActive: true,
        expiryDate: {
          [Op.lt]: new Date(),
        },
      },
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email'],
        },
      ],
      order: [['expiryDate', 'DESC']],
    });

    res.json({
      success: true,
      data: compliances,
    });
  } catch (error) {
    console.error('Get expired compliances error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch expired compliance items',
      error: error.message,
    });
  }
};

// Renew compliance item
exports.renewCompliance = async (req, res) => {
  try {
    const { id } = req.params;
    const { organizationId } = req.user;
    const { newExpiryDate, newIssueDate, newCertificateNumber, notes } = req.body;

    const compliance = await Compliance.findOne({
      where: {
        id,
        organizationId,
        isActive: true,
      },
    });

    if (!compliance) {
      return res.status(404).json({
        success: false,
        message: 'Compliance item not found',
      });
    }

    await compliance.update({
      issueDate: newIssueDate || new Date(),
      expiryDate: newExpiryDate,
      certificateNumber: newCertificateNumber || compliance.certificateNumber,
      status: 'Renewed',
      notes: notes || compliance.notes,
    });

    const renewedCompliance = await Compliance.findByPk(id, {
      include: [
        {
          model: User,
          as: 'assignee',
          attributes: ['id', 'name', 'email'],
        },
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });

    res.json({
      success: true,
      message: 'Compliance item renewed successfully',
      data: renewedCompliance,
    });
  } catch (error) {
    console.error('Renew compliance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to renew compliance item',
      error: error.message,
    });
  }
};
