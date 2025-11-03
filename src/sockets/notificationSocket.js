const jwt = require('jsonwebtoken');
const { logger } = require('../middleware/logger');

class NotificationSocket {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map(); // userId -> Set of socket IDs
    this.socketUsers = new Map(); // socketId -> userId
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    // Authentication middleware for socket connections
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.userRole = decoded.role;
        socket.organizationId = decoded.organizationId;

        logger.info('Socket authenticated', {
          socketId: socket.id,
          userId: socket.userId,
          role: socket.userRole
        });

        next();
      } catch (error) {
        logger.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.userId;

      // Track user socket connections
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId).add(socket.id);
      this.socketUsers.set(socket.id, userId);

      logger.info('Client connected', {
        socketId: socket.id,
        userId,
        totalConnections: this.userSockets.get(userId).size
      });

      // Join user-specific room
      socket.join(`user:${userId}`);

      // Join organization room
      if (socket.organizationId) {
        socket.join(`org:${socket.organizationId}`);
      }

      // Join role-specific room
      if (socket.userRole) {
        socket.join(`role:${socket.userRole}`);
      }

      // Handle typing indicators
      socket.on('typing:start', (data) => {
        socket.to(data.roomId).emit('user:typing', {
          userId,
          roomId: data.roomId
        });
      });

      socket.on('typing:stop', (data) => {
        socket.to(data.roomId).emit('user:stopped-typing', {
          userId,
          roomId: data.roomId
        });
      });

      // Handle presence
      socket.on('presence:update', (status) => {
        this.updateUserPresence(userId, status);
      });

      // Handle read receipts
      socket.on('message:read', (messageId) => {
        this.markMessageAsRead(userId, messageId);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Send initial connection success
      socket.emit('connected', {
        socketId: socket.id,
        userId,
        timestamp: new Date()
      });
    });
  }

  handleDisconnect(socket) {
    const userId = this.socketUsers.get(socket.id);

    if (userId && this.userSockets.has(userId)) {
      this.userSockets.get(userId).delete(socket.id);

      if (this.userSockets.get(userId).size === 0) {
        this.userSockets.delete(userId);
        this.updateUserPresence(userId, 'offline');
      }
    }

    this.socketUsers.delete(socket.id);

    logger.info('Client disconnected', {
      socketId: socket.id,
      userId
    });
  }

  // Send notification to specific user
  sendToUser(userId, event, data) {
    const room = `user:${userId}`;
    this.io.to(room).emit(event, {
      ...data,
      timestamp: new Date()
    });

    logger.info('Notification sent to user', { userId, event });
  }

  // Send notification to multiple users
  sendToUsers(userIds, event, data) {
    userIds.forEach(userId => {
      this.sendToUser(userId, event, data);
    });
  }

  // Send to entire organization
  sendToOrganization(organizationId, event, data) {
    const room = `org:${organizationId}`;
    this.io.to(room).emit(event, {
      ...data,
      timestamp: new Date()
    });

    logger.info('Notification sent to organization', { organizationId, event });
  }

  // Send to specific role
  sendToRole(role, event, data) {
    const room = `role:${role}`;
    this.io.to(room).emit(event, {
      ...data,
      timestamp: new Date()
    });

    logger.info('Notification sent to role', { role, event });
  }

  // Broadcast to all connected clients
  broadcast(event, data) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date()
    });

    logger.info('Broadcast notification sent', { event });
  }

  // Update user presence status
  updateUserPresence(userId, status) {
    this.sendToOrganization(null, 'user:presence', {
      userId,
      status, // 'online', 'away', 'busy', 'offline'
      lastSeen: new Date()
    });
  }

  // Mark message as read
  markMessageAsRead(userId, messageId) {
    this.io.emit('message:read-receipt', {
      userId,
      messageId,
      readAt: new Date()
    });
  }

  // Get online users count
  getOnlineUsersCount() {
    return this.userSockets.size;
  }

  // Check if user is online
  isUserOnline(userId) {
    return this.userSockets.has(userId);
  }

  // Get all online users in organization
  getOnlineUsers(organizationId) {
    const onlineUsers = [];
    this.io.in(`org:${organizationId}`).fetchSockets().then(sockets => {
      sockets.forEach(socket => {
        if (socket.userId && !onlineUsers.includes(socket.userId)) {
          onlineUsers.push(socket.userId);
        }
      });
    });
    return onlineUsers;
  }
}

// Notification event types
const NotificationEvents = {
  // Attendance notifications
  ATTENDANCE_CHECKED_IN: 'attendance:checked-in',
  ATTENDANCE_CHECKED_OUT: 'attendance:checked-out',
  ATTENDANCE_LATE: 'attendance:late',
  ATTENDANCE_EARLY_CHECKOUT: 'attendance:early-checkout',

  // Leave notifications
  LEAVE_REQUESTED: 'leave:requested',
  LEAVE_APPROVED: 'leave:approved',
  LEAVE_REJECTED: 'leave:rejected',
  LEAVE_CANCELLED: 'leave:cancelled',

  // Task notifications
  TASK_ASSIGNED: 'task:assigned',
  TASK_UPDATED: 'task:updated',
  TASK_COMPLETED: 'task:completed',
  TASK_OVERDUE: 'task:overdue',
  TASK_COMMENT: 'task:comment',

  // Meeting notifications
  MEETING_SCHEDULED: 'meeting:scheduled',
  MEETING_UPDATED: 'meeting:updated',
  MEETING_CANCELLED: 'meeting:cancelled',
  MEETING_REMINDER: 'meeting:reminder',
  MEETING_STARTED: 'meeting:started',

  // Payroll notifications
  PAYROLL_GENERATED: 'payroll:generated',
  PAYSLIP_AVAILABLE: 'payslip:available',

  // System notifications
  SYSTEM_ANNOUNCEMENT: 'system:announcement',
  SYSTEM_MAINTENANCE: 'system:maintenance',

  // HR notifications
  HR_JOIN_REQUEST: 'hr:join-request',
  HR_REQUEST_APPROVED: 'hr:request-approved',
  HR_REQUEST_REJECTED: 'hr:request-rejected',

  // Project notifications
  PROJECT_CREATED: 'project:created',
  PROJECT_UPDATED: 'project:updated',
  MILESTONE_COMPLETED: 'milestone:completed'
};

module.exports = {
  NotificationSocket,
  NotificationEvents
};
