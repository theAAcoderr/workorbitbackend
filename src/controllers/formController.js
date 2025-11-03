const { Form, FormResponse, User, Department, Team, Organization } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database');

/**
 * @route   POST /api/v1/forms
 * @desc    Create a new form
 * @access  Private (Admin, HR, Manager)
 */
exports.createForm = async (req, res, next) => {
  try {
    const {
      title,
      description,
      formType,
      fields,
      settings,
      targetDepartmentId,
      targetTeamId,
      isAnonymous,
      allowMultipleResponses,
      expiresAt,
      metadata
    } = req.body;

    const organizationId = req.user.organizationId;
    const createdBy = req.user.id;

    // Validate fields structure
    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Form must have at least one field'
      });
    }

    // Validate field structure
    try {
      Form.validateFields(fields);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Create form
    const form = await Form.create({
      title,
      description,
      organizationId,
      createdBy,
      formType: formType || 'custom',
      fields,
      settings: settings || {},
      status: 'draft',
      targetDepartmentId: targetDepartmentId || null,
      targetTeamId: targetTeamId || null,
      isAnonymous: isAnonymous || false,
      allowMultipleResponses: allowMultipleResponses || false,
      expiresAt: expiresAt || null,
      metadata: metadata || {},
      isActive: true
    });

    // Fetch complete form with associations
    const completeForm = await Form.findByPk(form.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: Department,
          as: 'targetDepartment',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Team,
          as: 'targetTeam',
          attributes: ['id', 'name']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Form created successfully',
      data: completeForm
    });
  } catch (error) {
    console.error('Create form error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/v1/forms
 * @desc    Get all forms for organization
 * @access  Private
 */
exports.getForms = async (req, res, next) => {
  try {
    const organizationId = req.user.organizationId;
    const {
      status,
      formType,
      search,
      includeInactive = 'false',
      createdBy
    } = req.query;

    const whereClause = { organizationId };

    if (includeInactive !== 'true') {
      whereClause.isActive = true;
    }

    if (status) {
      whereClause.status = status;
    }

    if (formType) {
      whereClause.formType = formType;
    }

    if (createdBy) {
      whereClause.createdBy = createdBy;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const forms = await Form.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: Department,
          as: 'targetDepartment',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Team,
          as: 'targetTeam',
          attributes: ['id', 'name']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: forms.length,
      data: forms
    });
  } catch (error) {
    console.error('Get forms error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/v1/forms/:id
 * @desc    Get form by ID
 * @access  Private
 */
exports.getFormById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const form = await Form.findOne({
      where: { id, organizationId },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'role']
        },
        {
          model: Department,
          as: 'targetDepartment',
          attributes: ['id', 'name', 'code']
        },
        {
          model: Team,
          as: 'targetTeam',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    res.json({
      success: true,
      data: form
    });
  } catch (error) {
    console.error('Get form by ID error:', error);
    next(error);
  }
};

/**
 * @route   PUT /api/v1/forms/:id
 * @desc    Update form
 * @access  Private (Creator, Admin, HR)
 */
exports.updateForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const {
      title,
      description,
      formType,
      fields,
      settings,
      targetDepartmentId,
      targetTeamId,
      isAnonymous,
      allowMultipleResponses,
      expiresAt,
      isActive,
      metadata
    } = req.body;

    const form = await Form.findOne({
      where: { id, organizationId }
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Check if user is creator or has admin/hr role
    if (form.createdBy !== req.user.id && !['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this form'
      });
    }

    // Cannot edit published forms unless admin
    if (form.status === 'published' && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot edit published forms. Please create a new version or contact admin.'
      });
    }

    // Validate fields if provided
    if (fields) {
      try {
        Form.validateFields(fields);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }

    // Update form
    await form.update({
      title: title || form.title,
      description: description !== undefined ? description : form.description,
      formType: formType || form.formType,
      fields: fields || form.fields,
      settings: settings !== undefined ? { ...form.settings, ...settings } : form.settings,
      targetDepartmentId: targetDepartmentId !== undefined ? targetDepartmentId : form.targetDepartmentId,
      targetTeamId: targetTeamId !== undefined ? targetTeamId : form.targetTeamId,
      isAnonymous: isAnonymous !== undefined ? isAnonymous : form.isAnonymous,
      allowMultipleResponses: allowMultipleResponses !== undefined ? allowMultipleResponses : form.allowMultipleResponses,
      expiresAt: expiresAt !== undefined ? expiresAt : form.expiresAt,
      isActive: isActive !== undefined ? isActive : form.isActive,
      metadata: metadata !== undefined ? { ...form.metadata, ...metadata } : form.metadata
    });

    // Fetch updated form
    const updatedForm = await Form.findByPk(id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'role']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Form updated successfully',
      data: updatedForm
    });
  } catch (error) {
    console.error('Update form error:', error);
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/forms/:id
 * @desc    Delete form
 * @access  Private (Creator, Admin)
 */
exports.deleteForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const form = await Form.findOne({
      where: { id, organizationId }
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Check permissions
    if (form.createdBy !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this form'
      });
    }

    // Check if form has responses
    if (form.responseCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete form with existing responses. Please archive it instead.'
      });
    }

    await form.destroy();

    res.json({
      success: true,
      message: 'Form deleted successfully'
    });
  } catch (error) {
    console.error('Delete form error:', error);
    next(error);
  }
};

/**
 * @route   POST /api/v1/forms/:id/publish
 * @desc    Publish form
 * @access  Private (Creator, Admin, HR)
 */
exports.publishForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const form = await Form.findOne({
      where: { id, organizationId }
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Check permissions
    if (form.createdBy !== req.user.id && !['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to publish this form'
      });
    }

    if (form.status === 'published') {
      return res.status(400).json({
        success: false,
        message: 'Form is already published'
      });
    }

    await form.update({
      status: 'published',
      publishedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Form published successfully',
      data: form
    });
  } catch (error) {
    console.error('Publish form error:', error);
    next(error);
  }
};

/**
 * @route   POST /api/v1/forms/:id/submit
 * @desc    Submit form response
 * @access  Private (or Public for anonymous)
 */
exports.submitFormResponse = async (req, res, next) => {
  const transaction = await sequelize.transaction();

  try {
    const { id } = req.params;
    const { responses, completionTime } = req.body;
    const organizationId = req.user?.organizationId;
    const respondentId = req.user?.id;

    const form = await Form.findOne({
      where: { id, ...(organizationId && { organizationId }) },
      transaction
    });

    if (!form) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Check if form is published
    if (form.status !== 'published') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Form is not published'
      });
    }

    // Check if form has expired
    if (form.expiresAt && new Date(form.expiresAt) < new Date()) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Form has expired'
      });
    }

    // Check if multiple responses are allowed
    if (!form.allowMultipleResponses && respondentId) {
      const existingResponse = await FormResponse.findOne({
        where: {
          formId: id,
          respondentId
        },
        transaction
      });

      if (existingResponse) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'You have already submitted a response to this form'
        });
      }
    }

    // Validate responses against form fields
    const fieldIds = form.fields.map(f => f.id || f.name);
    const responseKeys = Object.keys(responses);

    // Create form response
    const formResponse = await FormResponse.create({
      formId: id,
      organizationId: form.organizationId,
      respondentId: form.isAnonymous ? null : respondentId,
      responses,
      submittedAt: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      completionTime: completionTime || null,
      status: 'submitted'
    }, { transaction });

    // Increment response count
    await form.increment('responseCount', { transaction });

    await transaction.commit();

    res.status(201).json({
      success: true,
      message: 'Form response submitted successfully',
      data: {
        id: formResponse.id,
        submittedAt: formResponse.submittedAt
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Submit form response error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/v1/forms/:id/responses
 * @desc    Get form responses
 * @access  Private (Creator, Admin, HR)
 */
exports.getFormResponses = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;
    const { status, respondentId } = req.query;

    const form = await Form.findOne({
      where: { id, organizationId }
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Check permissions
    if (form.createdBy !== req.user.id && !['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view form responses'
      });
    }

    const whereClause = { formId: id };

    if (status) {
      whereClause.status = status;
    }

    if (respondentId) {
      whereClause.respondentId = respondentId;
    }

    const responses = await FormResponse.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'respondent',
          attributes: ['id', 'name', 'email'],
          required: false // Include anonymous responses
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'name', 'email'],
          required: false
        }
      ],
      order: [['submittedAt', 'DESC']]
    });

    res.json({
      success: true,
      count: responses.length,
      data: responses
    });
  } catch (error) {
    console.error('Get form responses error:', error);
    next(error);
  }
};

/**
 * @route   GET /api/v1/forms/:id/analytics
 * @desc    Get form analytics
 * @access  Private (Creator, Admin, HR)
 */
exports.getFormAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId;

    const form = await Form.findOne({
      where: { id, organizationId }
    });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // Check permissions
    if (form.createdBy !== req.user.id && !['admin', 'hr'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view form analytics'
      });
    }

    const responses = await FormResponse.findAll({
      where: { formId: id },
      attributes: ['responses', 'completionTime', 'submittedAt']
    });

    // Calculate analytics
    const totalResponses = responses.length;
    const avgCompletionTime = responses.reduce((sum, r) => sum + (r.completionTime || 0), 0) / (totalResponses || 1);

    // Field-wise analytics
    const fieldAnalytics = {};
    form.fields.forEach(field => {
      const fieldId = field.id || field.name;
      const values = responses.map(r => r.responses[fieldId]).filter(v => v !== undefined && v !== null);

      fieldAnalytics[fieldId] = {
        label: field.label,
        type: field.type,
        totalResponses: values.length,
        responseRate: ((values.length / totalResponses) * 100).toFixed(2) + '%'
      };

      // Type-specific analytics
      if (['select', 'radio', 'checkbox'].includes(field.type)) {
        const valueCounts = {};
        values.forEach(v => {
          const key = Array.isArray(v) ? v.join(',') : v;
          valueCounts[key] = (valueCounts[key] || 0) + 1;
        });
        fieldAnalytics[fieldId].valueCounts = valueCounts;
      } else if (field.type === 'number' || field.type === 'rating') {
        const numericValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
        if (numericValues.length > 0) {
          fieldAnalytics[fieldId].average = (numericValues.reduce((a, b) => a + b, 0) / numericValues.length).toFixed(2);
          fieldAnalytics[fieldId].min = Math.min(...numericValues);
          fieldAnalytics[fieldId].max = Math.max(...numericValues);
        }
      }
    });

    res.json({
      success: true,
      data: {
        formId: id,
        formTitle: form.title,
        totalResponses,
        averageCompletionTime: avgCompletionTime.toFixed(2) + ' seconds',
        fieldAnalytics
      }
    });
  } catch (error) {
    console.error('Get form analytics error:', error);
    next(error);
  }
};

