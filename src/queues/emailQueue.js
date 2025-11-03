const Bull = require('bull');
const { sendEmail } = require('../services/emailService');
const { logger } = require('../middleware/logger');

// Create email queue
const emailQueue = new Bull('email', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

// Process email jobs
emailQueue.process(async (job) => {
  const { to, subject, text, html } = job.data;

  try {
    logger.info('Processing email job', {
      jobId: job.id,
      to,
      subject
    });

    await sendEmail(to, subject, text, html);

    logger.info('Email sent successfully', {
      jobId: job.id,
      to
    });

    return { success: true, to, subject };
  } catch (error) {
    logger.error('Email sending failed', {
      jobId: job.id,
      to,
      error: error.message
    });
    throw error;
  }
});

// Event listeners
emailQueue.on('completed', (job, result) => {
  logger.info('Email job completed', {
    jobId: job.id,
    result
  });
});

emailQueue.on('failed', (job, err) => {
  logger.error('Email job failed', {
    jobId: job.id,
    error: err.message,
    attempts: job.attemptsMade,
    maxAttempts: job.opts.attempts
  });
});

emailQueue.on('stalled', (job) => {
  logger.warn('Email job stalled', {
    jobId: job.id
  });
});

// Helper function to add email to queue
async function queueEmail(to, subject, text, html = null) {
  const job = await emailQueue.add({
    to,
    subject,
    text,
    html
  }, {
    priority: 1,
    delay: 0
  });

  logger.info('Email queued', {
    jobId: job.id,
    to,
    subject
  });

  return job;
}

module.exports = {
  emailQueue,
  queueEmail
};
