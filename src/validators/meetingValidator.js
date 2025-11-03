const { body, param, query } = require('express-validator');

const meetingTypes = [
  'teamMeeting',
  'oneOnOne',
  'allHands',
  'clientMeeting',
  'training',
  'interview',
  'boardMeeting',
  'other'
];

const meetingStatuses = [
  'scheduled',
  'inProgress',
  'completed',
  'cancelled',
  'postponed'
];

const priorities = ['low', 'medium', 'high', 'urgent'];
const attendeeStatuses = ['pending', 'accepted', 'declined', 'tentative', 'attended', 'absent'];

// Validate meeting creation
const validateCreateMeeting = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('type')
    .optional()
    .isIn(meetingTypes)
    .withMessage(`Type must be one of: ${meetingTypes.join(', ')}`),

  body('priority')
    .optional()
    .isIn(priorities)
    .withMessage(`Priority must be one of: ${priorities.join(', ')}`),

  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date')
    .custom((value) => {
      const startTime = new Date(value);
      const now = new Date();
      if (startTime <= now) {
        throw new Error('Start time must be in the future');
      }
      return true;
    }),

  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.body.startTime) {
        const startTime = new Date(req.body.startTime);
        const endTime = new Date(value);
        if (endTime <= startTime) {
          throw new Error('End time must be after start time');
        }
        // Check if meeting is not too long (max 8 hours)
        const durationHours = (endTime - startTime) / (1000 * 60 * 60);
        if (durationHours > 8) {
          throw new Error('Meeting duration cannot exceed 8 hours');
        }
      }
      return true;
    }),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location cannot exceed 255 characters'),

  body('meetingLink')
    .optional()
    .trim()
    .isURL()
    .withMessage('Meeting link must be a valid URL'),

  body('organizationId')
    .notEmpty()
    .withMessage('Organization ID is required')
    .trim(),

  body('hrCode')
    .optional()
    .trim(),

  body('agendaItems')
    .optional()
    .isArray()
    .withMessage('Agenda items must be an array')
    .custom((items) => {
      if (items && items.length > 20) {
        throw new Error('Cannot have more than 20 agenda items');
      }
      if (items) {
        for (const item of items) {
          if (typeof item !== 'string' || item.trim().length === 0) {
            throw new Error('Each agenda item must be a non-empty string');
          }
          if (item.length > 255) {
            throw new Error('Each agenda item cannot exceed 255 characters');
          }
        }
      }
      return true;
    }),

  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),

  body('recurringPattern')
    .optional()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Recurring pattern must be daily, weekly, or monthly'),

  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean'),

  body('allowGuestJoin')
    .optional()
    .isBoolean()
    .withMessage('allowGuestJoin must be a boolean'),

  body('attendees')
    .optional()
    .isArray()
    .withMessage('Attendees must be an array')
    .custom((attendees) => {
      if (attendees && attendees.length > 100) {
        throw new Error('Cannot have more than 100 attendees');
      }
      if (attendees) {
        for (const attendee of attendees) {
          if (!attendee.userId || !attendee.userName || !attendee.userEmail) {
            throw new Error('Each attendee must have userId, userName, and userEmail');
          }
          if (attendee.status && !attendeeStatuses.includes(attendee.status)) {
            throw new Error(`Attendee status must be one of: ${attendeeStatuses.join(', ')}`);
          }
        }
      }
      return true;
    }),

  body('actionItems')
    .optional()
    .isArray()
    .withMessage('Action items must be an array')
    .custom((actions) => {
      if (actions && actions.length > 50) {
        throw new Error('Cannot have more than 50 action items');
      }
      if (actions) {
        for (const action of actions) {
          if (!action.title || action.title.trim().length === 0) {
            throw new Error('Each action item must have a title');
          }
          if (action.title.length > 255) {
            throw new Error('Action item title cannot exceed 255 characters');
          }
        }
      }
      return true;
    })
];

// Validate meeting update
const validateUpdateMeeting = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),

  body('type')
    .optional()
    .isIn(meetingTypes)
    .withMessage(`Type must be one of: ${meetingTypes.join(', ')}`),

  body('status')
    .optional()
    .isIn(meetingStatuses)
    .withMessage(`Status must be one of: ${meetingStatuses.join(', ')}`),

  body('priority')
    .optional()
    .isIn(priorities)
    .withMessage(`Priority must be one of: ${priorities.join(', ')}`),

  body('startTime')
    .optional()
    .isISO8601()
    .withMessage('Start time must be a valid ISO 8601 date'),

  body('endTime')
    .optional()
    .isISO8601()
    .withMessage('End time must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.body.startTime && value) {
        const startTime = new Date(req.body.startTime);
        const endTime = new Date(value);
        if (endTime <= startTime) {
          throw new Error('End time must be after start time');
        }
      }
      return true;
    }),

  body('location')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Location cannot exceed 255 characters'),

  body('meetingLink')
    .optional()
    .trim()
    .isURL()
    .withMessage('Meeting link must be a valid URL'),

  body('notes')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Notes cannot exceed 5000 characters')
];

// Validate meeting ID parameter
const validateMeetingId = [
  param('id')
    .isUUID()
    .withMessage('Meeting ID must be a valid UUID')
];

// Validate attendee response
const validateAttendeeResponse = [
  body('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['accepted', 'declined', 'tentative'])
    .withMessage('Status must be accepted, declined, or tentative'),

  body('response')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Response cannot exceed 500 characters')
];

// Validate complete meeting
const validateCompleteMeeting = [
  body('notes')
    .notEmpty()
    .withMessage('Meeting notes are required')
    .trim()
    .isLength({ min: 10, max: 5000 })
    .withMessage('Notes must be between 10 and 5000 characters'),

  body('actionItems')
    .optional()
    .isArray()
    .withMessage('Action items must be an array')
    .custom((actions) => {
      if (actions && actions.length > 50) {
        throw new Error('Cannot have more than 50 action items');
      }
      if (actions) {
        for (const action of actions) {
          if (!action.title || action.title.trim().length === 0) {
            throw new Error('Each action item must have a title');
          }
          if (action.title.length > 255) {
            throw new Error('Action item title cannot exceed 255 characters');
          }
          if (action.assignedToName && action.assignedToName.length > 100) {
            throw new Error('Assigned to name cannot exceed 100 characters');
          }
        }
      }
      return true;
    })
];

// Validate query parameters for getting meetings
const validateGetMeetings = [
  query('type')
    .optional()
    .isIn(meetingTypes)
    .withMessage(`Type must be one of: ${meetingTypes.join(', ')}`),

  query('status')
    .optional()
    .isIn(meetingStatuses)
    .withMessage(`Status must be one of: ${meetingStatuses.join(', ')}`),

  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),

  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid ISO 8601 date'),

  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),

  query('showOnlyMyMeetings')
    .optional()
    .isBoolean()
    .withMessage('showOnlyMyMeetings must be a boolean'),

  query('showPastMeetings')
    .optional()
    .isBoolean()
    .withMessage('showPastMeetings must be a boolean'),

  query('days')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Days must be between 1 and 365')
];

module.exports = {
  validateCreateMeeting,
  validateUpdateMeeting,
  validateMeetingId,
  validateAttendeeResponse,
  validateCompleteMeeting,
  validateGetMeetings
};