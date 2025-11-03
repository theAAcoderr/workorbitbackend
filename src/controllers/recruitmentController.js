const { Job, Application, User, Organization } = require('../models');
const { Op, Sequelize } = require('sequelize');
const QRCode = require('qrcode');
const crypto = require('crypto');
const emailService = require('../services/emailService');
const oneSignalService = require('../services/oneSignalService');

// Job Management Controllers

// Create new job
exports.createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      description,
      location,
      employmentType,
      experienceLevel,
      salaryMin,
      salaryMax,
      salaryCurrency,
      requirements,
      responsibilities,
      benefits,
      companyInfo,
      deadline,
      department,
      skills
    } = req.body;

    // Generate QR code and public URL
    const jobId = crypto.randomUUID();
    const publicUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/public/jobs/${jobId}`;
    const qrCode = await QRCode.toDataURL(publicUrl);

    const job = await Job.create({
      id: jobId,
      title,
      company: company || req.user.organization?.name || 'Company',
      description,
      location,
      employmentType,
      experienceLevel,
      salaryMin,
      salaryMax,
      salaryCurrency,
      requirements,
      responsibilities,
      benefits,
      companyInfo,
      qrCode,
      publicUrl,
      deadline,
      department,
      skills,
      createdBy: req.user.id,
      organizationId: req.user.organizationId
    });

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job',
      error: error.message
    });
  }
};

// Get all jobs
exports.getJobs = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      organizationId: req.user.organizationId
    };

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } },
        { department: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: jobs } = await Job.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      jobs,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
};

// Get single job
exports.getJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Application,
          as: 'applications',
          attributes: ['id', 'status']
        }
      ]
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    res.json({
      success: true,
      job
    });
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job',
      error: error.message
    });
  }
};

// Update job
exports.updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const job = await Job.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    await job.update(updates);

    res.json({
      success: true,
      message: 'Job updated successfully',
      job
    });
  } catch (error) {
    console.error('Error updating job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job',
      error: error.message
    });
  }
};

// Delete job
exports.deleteJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: [
        {
          model: Application,
          as: 'applications',
          attributes: ['id']
        }
      ]
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if job has applications
    if (job.applications && job.applications.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete job. This job has ${job.applications.length} application(s) associated with it. Please either remove all applications first or change the job status to 'closed' instead.`,
        hasApplications: true,
        applicationCount: job.applications.length
      });
    }

    await job.destroy();

    res.json({
      success: true,
      message: 'Job deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting job:', error);

    // Handle foreign key constraint error specifically
    if (error.name === 'SequelizeForeignKeyConstraintError' ||
        error.message.includes('foreign key constraint')) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete job because it has applications associated with it. Please remove all applications first or change the job status to closed.',
        error: 'Foreign key constraint violation'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message
    });
  }
};

// Toggle job status
exports.toggleJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const job = await Job.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    await job.update({ status });

    res.json({
      success: true,
      message: 'Job status updated successfully',
      job
    });
  } catch (error) {
    console.error('Error updating job status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update job status',
      error: error.message
    });
  }
};

// Application Management Controllers

// Get applications
exports.getApplications = async (req, res) => {
  try {
    const { jobId, status, search, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      organizationId: req.user.organizationId
    };

    if (jobId) {
      where.jobId = jobId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where[Op.or] = [
        { trackingCode: { [Op.iLike]: `%${search}%` } },
        { jobTitle: { [Op.iLike]: `%${search}%` } },
        { 'candidateInfo.name': { [Op.iLike]: `%${search}%` } },
        { 'candidateInfo.email': { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: applications } = await Application.findAndCountAll({
      where,
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'title', 'company', 'location']
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['appliedAt', 'DESC']]
    });

    res.json({
      success: true,
      applications,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: error.message
    });
  }
};

// Get single application
exports.getApplication = async (req, res) => {
  try {
    const { id } = req.params;

    const application = await Application.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      },
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['id', 'title', 'company', 'location', 'employmentType']
        }
      ]
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: error.message
    });
  }
};

// Create application (public endpoint for job applicants)
exports.createApplication = async (req, res) => {
  try {
    const {
      jobId,
      candidateInfo,
      resume,
      coverLetter,
      additionalInfo,
      documents
    } = req.body;

    // Get job details
    const job = await Job.findByPk(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    if (job.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting applications'
      });
    }

    // Generate tracking code and security PIN
    const trackingCode = 'WO' + Date.now().toString().slice(-6) + Math.random().toString(36).substr(2, 3).toUpperCase();
    const securityPin = Math.floor(1000 + Math.random() * 9000).toString();

    // Create application
    const application = await Application.create({
      jobId,
      jobTitle: job.title,
      company: job.company,
      candidateInfo,
      resume,
      coverLetter,
      additionalInfo,
      documents,
      organizationId: job.organizationId,
      trackingCode,
      securityPin,
      statusHistory: [{
        status: 'Applied',
        changedAt: new Date(),
        remarks: 'Application submitted'
      }]
    });

    // Update job applications count
    await job.increment('applicationsCount');

    // Send notification to HR team about new application
    try {
      await oneSignalService.sendToRole(
        job.organizationId,
        'hr',
        {
          title: '👔 New Job Application Received',
          message: `${candidateInfo.name} applied for ${job.title}`,
          data: {
            type: 'job_application_received',
            applicationId: application.id,
            jobId: job.id,
            jobTitle: job.title,
            candidateName: candidateInfo.name,
            candidateEmail: candidateInfo.email,
            trackingCode: application.trackingCode,
            timestamp: new Date().toISOString()
          }
        }
      );
      console.log('✅ New application notification sent to HR team');
    } catch (notificationError) {
      console.error('⚠️ Failed to send application notification:', notificationError);
      // Don't fail the application submission if notification fails
    }

    // Send confirmation email to the applicant
    try {
      const emailData = {
        candidateInfo,
        jobTitle: job.title,
        company: job.company,
        trackingCode: application.trackingCode,
        securityPin: application.securityPin,
        appliedAt: application.createdAt
      };

      const emailResult = await emailService.sendApplicationConfirmation(emailData);
      if (emailResult.success) {
        console.log('Application confirmation email sent successfully');
      } else {
        console.error('Failed to send confirmation email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't fail the application submission if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        trackingCode: application.trackingCode,
        securityPin: application.securityPin
      }
    });
  } catch (error) {
    console.error('Error creating application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message
    });
  }
};

// Update application status
exports.updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const application = await Application.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Update status history
    const statusHistory = application.statusHistory || [];
    statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user.id,
      remarks
    });

    await application.update({
      status,
      statusHistory
    });

    // Send notification to HR team for interview scheduling
    if (status.toLowerCase() === 'interview' || status.toLowerCase() === 'shortlisted') {
      try {
        await oneSignalService.sendToRole(
          application.organizationId,
          'hr',
          {
            title: '📅 Interview Scheduled',
            message: `Interview scheduled for ${application.candidateInfo.name} - ${application.jobTitle}`,
            data: {
              type: 'interview_scheduled',
              applicationId: application.id,
              jobTitle: application.jobTitle,
              candidateName: application.candidateInfo.name,
              candidateEmail: application.candidateInfo.email,
              trackingCode: application.trackingCode,
              status: status,
              remarks: remarks || '',
              timestamp: new Date().toISOString()
            }
          }
        );
        console.log('✅ Interview notification sent to HR team');
      } catch (notificationError) {
        console.error('⚠️ Failed to send interview notification:', notificationError);
        // Don't fail the status update if notification fails
      }
    }

    // Send status update email to the applicant
    try {
      const emailData = {
        candidateInfo: application.candidateInfo,
        jobTitle: application.jobTitle,
        company: application.company,
        trackingCode: application.trackingCode
      };

      const emailResult = await emailService.sendStatusUpdate(emailData, status, remarks);
      if (emailResult.success) {
        console.log('Status update email sent successfully');
      } else {
        console.error('Failed to send status update email:', emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending status update email:', emailError);
      // Don't fail the status update if email fails
    }

    res.json({
      success: true,
      message: 'Application status updated successfully',
      application
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message
    });
  }
};

// Add notes to application
exports.addApplicationNote = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const application = await Application.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const currentNotes = application.notes || '';
    const timestamp = new Date().toISOString();
    const newNote = `[${timestamp}] ${req.user.name}: ${note}`;
    const updatedNotes = currentNotes ? `${currentNotes}\n\n${newNote}` : newNote;

    await application.update({ notes: updatedNotes });

    res.json({
      success: true,
      message: 'Note added successfully',
      application
    });
  } catch (error) {
    console.error('Error adding note:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add note',
      error: error.message
    });
  }
};

// Bulk update application status
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { applicationIds, status } = req.body;

    await Application.update(
      {
        status,
        updatedAt: new Date()
      },
      {
        where: {
          id: applicationIds,
          organizationId: req.user.organizationId
        }
      }
    );

    res.json({
      success: true,
      message: `${applicationIds.length} applications updated successfully`
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update applications',
      error: error.message
    });
  }
};

// Delete an application
exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the application first
    const application = await Application.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Delete the application
    await application.destroy();

    res.json({
      success: true,
      message: 'Application deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete application',
      error: error.message
    });
  }
};

// Get recruitment statistics
exports.getStatistics = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    // Get job statistics
    const totalJobs = await Job.count({
      where: { organizationId }
    });

    const activeJobs = await Job.count({
      where: {
        organizationId,
        status: 'active'
      }
    });

    // Get application statistics
    const totalApplications = await Application.count({
      where: { organizationId }
    });

    const applicationsByStatus = await Application.findAll({
      where: { organizationId },
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('status')), 'count']
      ],
      group: ['status']
    });

    // Get recent applications
    const recentApplications = await Application.findAll({
      where: { organizationId },
      limit: 5,
      order: [['appliedAt', 'DESC']],
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['title']
        }
      ]
    });

    res.json({
      success: true,
      statistics: {
        jobs: {
          total: totalJobs,
          active: activeJobs,
          closed: totalJobs - activeJobs
        },
        applications: {
          total: totalApplications,
          byStatus: applicationsByStatus.reduce((acc, item) => {
            acc[item.status] = parseInt(item.get('count'));
            return acc;
          }, {})
        },
        recentApplications
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// Get job analytics
exports.getJobAnalytics = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Get applications by status
    const applicationsByStatus = await Application.findAll({
      where: { jobId: id },
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('status')), 'count']
      ],
      group: ['status']
    });

    // Get applications over time
    const applicationsOverTime = await Application.findAll({
      where: { jobId: id },
      attributes: [
        [Sequelize.fn('DATE', Sequelize.col('appliedAt')), 'date'],
        [Sequelize.fn('COUNT', '*'), 'count']
      ],
      group: [Sequelize.fn('DATE', Sequelize.col('appliedAt'))],
      order: [[Sequelize.fn('DATE', Sequelize.col('appliedAt')), 'ASC']]
    });

    res.json({
      success: true,
      analytics: {
        job: {
          title: job.title,
          status: job.status,
          createdAt: job.createdAt,
          deadline: job.deadline,
          applicationsCount: job.applicationsCount
        },
        applications: {
          byStatus: applicationsByStatus.reduce((acc, item) => {
            acc[item.status] = parseInt(item.get('count'));
            return acc;
          }, {}),
          overTime: applicationsOverTime
        }
      }
    });
  } catch (error) {
    console.error('Error fetching job analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job analytics',
      error: error.message
    });
  }
};

// Send notification to candidate
exports.sendNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { type, message } = req.body;

    const application = await Application.findOne({
      where: {
        id,
        organizationId: req.user.organizationId
      }
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Send email notification
    try {
      const subject = `WorkOrbit Recruitment - ${type.charAt(0).toUpperCase() + type.slice(1)} Notification`;
      const emailResult = await emailService.sendCustomNotification(
        application.candidateInfo.email,
        subject,
        message,
        {
          jobTitle: application.jobTitle,
          company: application.company,
          trackingCode: application.trackingCode
        }
      );

      if (emailResult.success) {
        console.log(`${type} notification sent successfully to ${application.candidateInfo.email}`);
      } else {
        console.error('Failed to send notification email:', emailResult.error);
        return res.status(500).json({
          success: false,
          message: 'Failed to send notification email',
          error: emailResult.error
        });
      }
    } catch (emailError) {
      console.error('Error sending notification email:', emailError);
      return res.status(500).json({
        success: false,
        message: 'Failed to send notification email',
        error: emailError.message
      });
    }

    res.json({
      success: true,
      message: 'Notification sent successfully'
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error: error.message
    });
  }
};

// Track application (public endpoint for applicants)
exports.trackApplication = async (req, res) => {
  try {
    const { trackingCode, securityPin } = req.body;

    const application = await Application.findOne({
      where: {
        trackingCode,
        securityPin
      },
      include: [
        {
          model: Job,
          as: 'job',
          attributes: ['title', 'company', 'location']
        }
      ]
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Invalid tracking code or security PIN'
      });
    }

    res.json({
      success: true,
      application: {
        status: application.status,
        appliedAt: application.appliedAt,
        jobTitle: application.jobTitle,
        company: application.company,
        statusHistory: application.statusHistory
      }
    });
  } catch (error) {
    console.error('Error tracking application:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track application',
      error: error.message
    });
  }
};

// Get public jobs (for job seekers to browse)
exports.getPublicJobs = async (req, res) => {
  try {
    const { status = 'active', search, page, limit } = req.query;

    const where = {
      status: 'active' // Only show active jobs to public
    };

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
        { location: { [Op.iLike]: `%${search}%` } },
        { department: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Build query options
    const queryOptions = {
      where,
      attributes: [
        'id', 'title', 'company', 'description', 'location', 'employmentType',
        'experienceLevel', 'salaryMin', 'salaryMax', 'salaryCurrency',
        'requirements', 'responsibilities', 'benefits', 'skills', 'department',
        'status', 'createdAt', 'deadline', 'applicationsCount', 'qrCode', 'publicUrl'
      ],
      order: [['createdAt', 'DESC']]
    };

    // Only add limit and offset if they are provided
    if (limit) {
      queryOptions.limit = parseInt(limit);
      if (page) {
        const offset = (parseInt(page) - 1) * parseInt(limit);
        queryOptions.offset = offset;
      }
    }

    const { count, rows: jobs } = await Job.findAndCountAll(queryOptions);

    const responseData = {
      success: true,
      jobs
    };

    // Only add pagination info if limit was provided
    if (limit) {
      responseData.pagination = {
        total: count,
        page: parseInt(page) || 1,
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      };
    } else {
      responseData.totalCount = count;
    }

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching public jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message
    });
  }
};

// Get single public job (for job seekers to view details)
exports.getPublicJob = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findOne({
      where: {
        id,
        status: 'active' // Only show active jobs to public
      },
      attributes: [
        'id', 'title', 'company', 'description', 'location', 'employmentType',
        'experienceLevel', 'salaryMin', 'salaryMax', 'salaryCurrency',
        'requirements', 'responsibilities', 'benefits', 'skills', 'department',
        'status', 'createdAt', 'deadline', 'applicationsCount', 'qrCode', 'publicUrl'
      ]
    });

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or not available'
      });
    }

    res.json({
      success: true,
      job
    });
  } catch (error) {
    console.error('Error fetching public job:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch job',
      error: error.message
    });
  }
};

// Test email functionality
exports.testEmail = async (req, res) => {
  try {
    const { email, type = 'confirmation' } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Test connection first
    const connectionTest = await emailService.testConnection();
    if (!connectionTest) {
      return res.status(500).json({
        success: false,
        message: 'Email service connection failed'
      });
    }

    let result;

    if (type === 'confirmation') {
      // Test application confirmation email
      const testApplicationData = {
        candidateInfo: {
          name: 'Test Candidate',
          email: email,
          phone: '+1234567890'
        },
        jobTitle: 'Test Position',
        company: 'Test Company',
        trackingCode: 'WO123456TEST',
        securityPin: '1234',
        appliedAt: new Date()
      };

      result = await emailService.sendApplicationConfirmation(testApplicationData);
    } else if (type === 'status') {
      // Test status update email
      const testApplicationData = {
        candidateInfo: {
          name: 'Test Candidate',
          email: email
        },
        jobTitle: 'Test Position',
        company: 'Test Company',
        trackingCode: 'WO123456TEST'
      };

      result = await emailService.sendStatusUpdate(testApplicationData, 'Interview', 'You have been selected for the next round.');
    } else if (type === 'custom') {
      // Test custom notification
      result = await emailService.sendCustomNotification(
        email,
        'Test Notification from WorkOrbit',
        '<h2>This is a test email</h2><p>If you received this email, the email service is working correctly!</p>'
      );
    }

    if (result.success) {
      res.json({
        success: true,
        message: `Test ${type} email sent successfully to ${email}`,
        messageId: result.messageId
      });
    } else {
      res.status(500).json({
        success: false,
        message: `Failed to send test ${type} email`,
        error: result.error
      });
    }

  } catch (error) {
    console.error('Error in test email:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
};