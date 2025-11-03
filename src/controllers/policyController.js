const Policy = require('../models/Policy');
const PolicyAcknowledgment = require('../models/PolicyAcknowledgment');
const { User } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Get all policies for organization
 * @route   GET /api/v1/policies
 * @access  Private
 */
exports.getPolicies = async (req, res) => {
  try {
    const { category, isActive, isMandatory } = req.query;
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    // Build query filters
    const whereClause = {
      organizationId
    };

    if (category && category !== 'All') {
      whereClause.category = category;
    }

    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    if (isMandatory !== undefined) {
      whereClause.isMandatory = isMandatory === 'true';
    }

    const policies = await Policy.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'acknowledgedBy',
          attributes: ['id'],
          through: { attributes: ['acknowledgedAt'] }
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Add acknowledgment status for current user
    const policiesWithStatus = policies.map(policy => {
      const policyData = policy.toJSON();
      const isAcknowledged = policyData.acknowledgedBy?.some(user => user.id === userId) || false;

      return {
        ...policyData,
        acknowledged: isAcknowledged,
        acknowledgedBy: undefined // Remove detailed acknowledgment data from response
      };
    });

    res.status(200).json({
      success: true,
      count: policiesWithStatus.length,
      data: policiesWithStatus
    });
  } catch (error) {
    console.error('Error fetching policies:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching policies',
      error: error.message
    });
  }
};

/**
 * @desc    Get single policy
 * @route   GET /api/v1/policies/:id
 * @access  Private
 */
exports.getPolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const userId = req.user.id;

    const policy = await Policy.findOne({
      where: {
        id,
        organizationId
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'acknowledgedBy',
          attributes: ['id'],
          through: { attributes: ['acknowledgedAt'] }
        }
      ]
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    const policyData = policy.toJSON();
    const isAcknowledged = policyData.acknowledgedBy?.some(user => user.id === userId) || false;

    res.status(200).json({
      success: true,
      data: {
        ...policyData,
        acknowledged: isAcknowledged
      }
    });
  } catch (error) {
    console.error('Error fetching policy:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching policy',
      error: error.message
    });
  }
};

/**
 * @desc    Create new policy
 * @route   POST /api/v1/policies
 * @access  Private (Admin/HR)
 */
exports.createPolicy = async (req, res) => {
  try {
    const { title, category, content, version, effectiveDate, expiryDate, isMandatory, documentUrl } = req.body;
    const organizationId = req.user.organizationId;
    const createdBy = req.user.id;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Please provide title and content'
      });
    }

    // Create policy
    const policy = await Policy.create({
      title,
      category: category || 'Other',
      content,
      version: version || '1.0',
      effectiveDate: effectiveDate || new Date(),
      expiryDate,
      isMandatory: isMandatory || false,
      documentUrl,
      organizationId,
      createdBy
    });

    // Fetch the created policy with associations
    const createdPolicy = await Policy.findByPk(policy.id, {
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
      message: 'Policy created successfully',
      data: createdPolicy
    });
  } catch (error) {
    console.error('Error creating policy:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating policy',
      error: error.message
    });
  }
};

/**
 * @desc    Update policy
 * @route   PUT /api/v1/policies/:id
 * @access  Private (Admin/HR)
 */
exports.updatePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, category, content, version, effectiveDate, expiryDate, isActive, isMandatory, documentUrl } = req.body;
    const organizationId = req.user.organizationId;
    const updatedBy = req.user.id;

    // Find policy
    const policy = await Policy.findOne({
      where: {
        id,
        organizationId
      }
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    // Update policy
    await policy.update({
      title: title || policy.title,
      category: category || policy.category,
      content: content || policy.content,
      version: version || policy.version,
      effectiveDate: effectiveDate || policy.effectiveDate,
      expiryDate: expiryDate !== undefined ? expiryDate : policy.expiryDate,
      isActive: isActive !== undefined ? isActive : policy.isActive,
      isMandatory: isMandatory !== undefined ? isMandatory : policy.isMandatory,
      documentUrl: documentUrl !== undefined ? documentUrl : policy.documentUrl,
      updatedBy
    });

    // Fetch updated policy with associations
    const updatedPolicy = await Policy.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: User,
          as: 'updater',
          attributes: ['id', 'name', 'email']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Policy updated successfully',
      data: updatedPolicy
    });
  } catch (error) {
    console.error('Error updating policy:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating policy',
      error: error.message
    });
  }
};

/**
 * @desc    Delete policy
 * @route   DELETE /api/v1/policies/:id
 * @access  Private (Admin/HR)
 */
exports.deletePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    // Find policy
    const policy = await Policy.findOne({
      where: {
        id,
        organizationId
      }
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    // Soft delete by marking as inactive
    await policy.update({ isActive: false });

    res.status(200).json({
      success: true,
      message: 'Policy deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting policy:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting policy',
      error: error.message
    });
  }
};

/**
 * @desc    Acknowledge policy
 * @route   POST /api/v1/policies/:id/acknowledge
 * @access  Private
 */
exports.acknowledgePolicy = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const organizationId = req.user.organizationId;

    // Check if policy exists
    const policy = await Policy.findOne({
      where: {
        id,
        organizationId,
        isActive: true
      }
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    // Check if already acknowledged
    const existing = await PolicyAcknowledgment.findOne({
      where: {
        policyId: id,
        userId
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Policy already acknowledged'
      });
    }

    // Create acknowledgment
    await PolicyAcknowledgment.create({
      policyId: id,
      userId,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.status(200).json({
      success: true,
      message: 'Policy acknowledged successfully'
    });
  } catch (error) {
    console.error('Error acknowledging policy:', error);
    res.status(500).json({
      success: false,
      message: 'Error acknowledging policy',
      error: error.message
    });
  }
};

/**
 * @desc    Get policy acknowledgments
 * @route   GET /api/v1/policies/:id/acknowledgments
 * @access  Private (Admin/HR)
 */
exports.getPolicyAcknowledgments = async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    // Verify policy belongs to organization
    const policy = await Policy.findOne({
      where: {
        id,
        organizationId
      }
    });

    if (!policy) {
      return res.status(404).json({
        success: false,
        message: 'Policy not found'
      });
    }

    const acknowledgments = await PolicyAcknowledgment.findAll({
      where: { policyId: id },
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'department', 'designation']
        }
      ],
      order: [['acknowledgedAt', 'DESC']]
    });

    res.status(200).json({
      success: true,
      count: acknowledgments.length,
      data: acknowledgments
    });
  } catch (error) {
    console.error('Error fetching acknowledgments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching acknowledgments',
      error: error.message
    });
  }
};
