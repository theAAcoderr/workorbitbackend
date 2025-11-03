/**
 * EXAMPLE: Authenticated WebSocket Implementation
 * Shows how to secure Socket.IO with JWT authentication
 */

const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { logger } = require('../middleware/logger');

class AuthenticatedNotificationSocket {
  constructor(io) {
    this.io = io;
    this.activeUsers = new Map(); // Track online users
    
    // Authentication middleware
    io.use(async (socket, next) => {
      try {
        // Get token from handshake
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          logger.warn('Socket connection attempt without token', {
            socketId: socket.id,
            ip: socket.handshake.address
          });
          return next(new Error('Authentication token required'));
        }
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get user from database
        const user = await User.findByPk(decoded.id, {
          attributes: ['id', 'email', 'name', 'role', 'organizationId', 'status']
        });
        
        if (!user) {
          return next(new Error('User not found'));
        }
        
        if (user.status !== 'active' && user.status !== 'approved') {
          return next(new Error('User account is not active'));
        }
        
        // Attach user to socket
        socket.userId = user.id;
        socket.userEmail = user.email;
        socket.userRole = user.role;
        socket.organizationId = user.organizationId;
        socket.userData = user;
        
        logger.info('Socket authenticated', {
          socketId: socket.id,
          userId: user.id,
          email: user.email
        });
        
        next();
      } catch (error) {
        logger.error('Socket authentication failed', {
          socketId: socket.id,
          error: error.message
        });
        
        if (error.name === 'TokenExpiredError') {
          return next(new Error('Token expired'));
        }
        
        return next(new Error('Authentication failed'));
      }
    });
    
    // Connection handler
    io.on('connection', (socket) => {
      this.handleConnection(socket);
    });
  }
  
  /**
   * Handle new connection
   */
  handleConnection(socket) {
    const { userId, userEmail, userRole, organizationId } = socket;
    
    console.log(`✅ User connected: ${userEmail} (${socket.id})`);
    
    // Track active user
    this.activeUsers.set(userId, {
      socketId: socket.id,
      connectedAt: new Date(),
      email: userEmail,
      role: userRole
    });
    
    // Join user-specific room
    socket.join(`user:${userId}`);
    
    // Join organization room
    socket.join(`org:${organizationId}`);
    
    // Join role-based room
    socket.join(`role:${userRole}`);
    
    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to WorkOrbit notifications',
      userId,
      timestamp: new Date().toISOString()
    });
    
    // Notify organization that user is online
    socket.to(`org:${organizationId}`).emit('user:online', {
      userId,
      email: userEmail,
      timestamp: new Date().toISOString()
    });
    
    // Handle custom events
    this.registerEventHandlers(socket);
    
    // Handle disconnection
    socket.on('disconnect', () => {
      this.handleDisconnection(socket);
    });
  }
  
  /**
   * Register event handlers
   */
  registerEventHandlers(socket) {
    // Typing indicator
    socket.on('typing', (data) => {
      socket.to(`org:${socket.organizationId}`).emit('user:typing', {
        userId: socket.userId,
        ...data
      });
    });
    
    // Custom notification acknowledge
    socket.on('notification:read', async (notificationId) => {
      try {
        // Mark notification as read in database
        // await Notification.update({ isRead: true }, { where: { id: notificationId } });
        
        socket.emit('notification:read:success', { notificationId });
      } catch (error) {
        socket.emit('notification:read:error', {
          notificationId,
          error: error.message
        });
      }
    });
    
    // Presence updates
    socket.on('presence:update', (status) => {
      socket.to(`org:${socket.organizationId}`).emit('user:presence', {
        userId: socket.userId,
        status, // online, away, busy, offline
        timestamp: new Date().toISOString()
      });
    });
    
    // Room join/leave (for specific features)
    socket.on('room:join', (roomId) => {
      socket.join(`room:${roomId}`);
      logger.info('User joined room', {
        userId: socket.userId,
        roomId
      });
    });
    
    socket.on('room:leave', (roomId) => {
      socket.leave(`room:${roomId}`);
      logger.info('User left room', {
        userId: socket.userId,
        roomId
      });
    });
  }
  
  /**
   * Handle disconnection
   */
  handleDisconnection(socket) {
    const { userId, userEmail, organizationId } = socket;
    
    console.log(`❌ User disconnected: ${userEmail} (${socket.id})`);
    
    // Remove from active users
    this.activeUsers.delete(userId);
    
    // Notify organization
    socket.to(`org:${organizationId}`).emit('user:offline', {
      userId,
      email: userEmail,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Socket disconnected', {
      socketId: socket.id,
      userId,
      email: userEmail
    });
  }
  
  /**
   * Send notification to specific user
   */
  sendToUser(userId, event, data) {
    this.io.to(`user:${userId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Notification sent to user', {
      userId,
      event,
      data
    });
  }
  
  /**
   * Send notification to organization
   */
  sendToOrganization(organizationId, event, data) {
    this.io.to(`org:${organizationId}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
    
    logger.info('Notification sent to organization', {
      organizationId,
      event
    });
  }
  
  /**
   * Send notification to role
   */
  sendToRole(role, event, data) {
    this.io.to(`role:${role}`).emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Broadcast to all connected users
   */
  broadcast(event, data) {
    this.io.emit(event, {
      ...data,
      timestamp: new Date().toISOString()
    });
  }
  
  /**
   * Get active users
   */
  getActiveUsers() {
    return Array.from(this.activeUsers.entries()).map(([userId, data]) => ({
      userId,
      ...data
    }));
  }
  
  /**
   * Get active users count
   */
  getActiveUsersCount() {
    return this.activeUsers.size;
  }
  
  /**
   * Check if user is online
   */
  isUserOnline(userId) {
    return this.activeUsers.has(userId);
  }
}

module.exports = {
  AuthenticatedNotificationSocket,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError
};

/**
 * USAGE IN server.js:
 * 
 * const { Server } = require('socket.io');
 * const { AuthenticatedNotificationSocket } = require('./sockets/EXAMPLE_authenticated_socket');
 * 
 * const io = new Server(server, { cors: corsOptions });
 * const notificationSocket = new AuthenticatedNotificationSocket(io);
 * app.set('notificationSocket', notificationSocket);
 * 
 * 
 * USAGE IN CONTROLLERS:
 * 
 * const sendNotification = async (req, res) => {
 *   const notificationSocket = req.app.get('notificationSocket');
 *   
 *   // Send to specific user
 *   notificationSocket.sendToUser(userId, 'notification:new', {
 *     title: 'New Message',
 *     body: 'You have a new message',
 *     type: 'info'
 *   });
 *   
 *   res.json({ success: true });
 * };
 * 
 * 
 * CLIENT-SIDE (Flutter):
 * 
 * import 'package:socket_io_client/socket_io_client.dart' as IO;
 * 
 * final socket = IO.io('http://localhost:5000', <String, dynamic>{
 *   'transports': ['websocket'],
 *   'auth': {'token': yourJWTToken}
 * });
 * 
 * socket.on('connected', (data) => print('Connected: $data'));
 * socket.on('notification:new', (data) => showNotification(data));
 * 
 * 
 * CLIENT-SIDE (JavaScript/Web):
 * 
 * import io from 'socket.io-client';
 * 
 * const socket = io('http://localhost:5000', {
 *   auth: { token: yourJWTToken }
 * });
 * 
 * socket.on('connected', (data) => console.log('Connected:', data));
 * socket.on('notification:new', (data) => showNotification(data));
 */

