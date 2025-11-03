const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const { connectDB } = require('./config/database');
const { initializeCache } = require('./config/redis');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { apiLimiter, authLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput } = require('./middleware/sanitizer');
const { requestLogger } = require('./middleware/logger');
const { requestTracing } = require('./middleware/requestTracing');
const { metricsMiddleware } = require('./utils/metrics');
const { setServer, registerShutdownHandlers } = require('./utils/gracefulShutdown');
const { NotificationSocket } = require('./sockets/notificationSocket');
const backupService = require('./utils/backup');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Routes
const authRoutes = require('./routes/authRoutes');
const hierarchyRoutes = require('./routes/hierarchyRoutes');
const attendanceRoutes = require('./routes/attendance');
const geofenceRoutes = require('./routes/geofenceRoutes');
const leaveRoutes = require('./routes/leave');
const projectRoutes = require('./routes/projectRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const progressReportRoutes = require('./routes/progressReportRoutes');
const meetingRoutes = require('./routes/meetingRoutes');
const shiftRoutes = require('./routes/shiftRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const reportsRoutes = require('./routes/reportsRoutes');
const recruitmentRoutes = require('./routes/recruitmentRoutes');
const uploadRoutes = require('../routes/upload.routes');
const taskRoutes = require('./routes/taskRoutes');
const leavePolicyRoutes = require('./routes/leavePolicyRoutes');
const healthRoutes = require('./routes/healthRoutes');
const metricsRoutes = require('./routes/metricsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const teamRoutes = require('./routes/teamRoutes');
const formRoutes = require('./routes/formRoutes');
const activityLogRoutes = require('./routes/activityLogRoutes');
const aiRoutes = require('./routes/aiRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const holidayRoutes = require('./routes/holidayRoutes');
const policyRoutes = require('./routes/policyRoutes');
const complianceRoutes = require('./routes/complianceRoutes');
const announcementRoutes = require('./routes/announcementRoutes');
const onboardingRoutes = require('./routes/onboardingRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const documentRoutes = require('./routes/documentRoutes');
const performanceReviewRoutes = require('./routes/performanceReviewRoutes');
const trainingRoutes = require('./routes/trainingRoutes');
const assetRoutes = require('./routes/assetRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const exitManagementRoutes = require('./routes/exitManagementRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, Postman)
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['http://localhost:3000', 'http://localhost:5000'];

    // SECURITY: Never allow wildcard '*' in production
    if (process.env.NODE_ENV === 'production' && allowedOrigins.includes('*')) {
      console.error('⚠️  SECURITY WARNING: Wildcard CORS origin (*) is not allowed in production!');
      return callback(new Error('Invalid CORS configuration'), false);
    }

    if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'ngrok-skip-browser-warning']
};
app.use(cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser()); // Parse cookies for refresh token

// Compression middleware
app.use(compression());

// Serve static files for uploads
app.use('/uploads', express.static('uploads'));

// Request tracing (must be early in middleware chain)
app.use(requestTracing);

// Metrics collection
app.use(metricsMiddleware);

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}
app.use(requestLogger); // Custom Winston logger

// Input sanitization
app.use(sanitizeInput);

// API routes
// Note: Rate limiting is applied specifically to sensitive routes (login, forgot-password)
const API_PREFIX = process.env.API_PREFIX || '/api';
const API_VERSION = process.env.API_VERSION || 'v1';

// Health check routes (Kubernetes probes)
app.use('/health', healthRoutes);

// Metrics endpoint (Prometheus)
app.use('/metrics', metricsRoutes);

// API Documentation (Swagger)
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'WorkOrbit API Documentation'
}));

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to WorkOrbit API',
    version: API_VERSION,
    documentation: `${API_PREFIX}/${API_VERSION}/docs`,
    endpoints: {
      auth: `${API_PREFIX}/${API_VERSION}/auth`,
      hierarchy: `${API_PREFIX}/${API_VERSION}/hierarchy`,
      attendance: `${API_PREFIX}/${API_VERSION}/attendance`,
      leave: `${API_PREFIX}/${API_VERSION}/leave`,
      projects: `${API_PREFIX}/${API_VERSION}/projects`,
      employees: `${API_PREFIX}/${API_VERSION}/employees`,
      progressReports: `${API_PREFIX}/${API_VERSION}/progress-reports`,
      meetings: `${API_PREFIX}/${API_VERSION}/meetings`,
      shifts: `${API_PREFIX}/${API_VERSION}/shifts`,
      payroll: `${API_PREFIX}/${API_VERSION}/payroll`,
      reports: `${API_PREFIX}/${API_VERSION}/reports`,
      recruitment: `${API_PREFIX}/${API_VERSION}/recruitment`,
      tasks: `${API_PREFIX}/${API_VERSION}/tasks`,
      departments: `${API_PREFIX}/${API_VERSION}/departments`,
      teams: `${API_PREFIX}/${API_VERSION}/teams`,
      forms: `${API_PREFIX}/${API_VERSION}/forms`,
      activityLogs: `${API_PREFIX}/${API_VERSION}/activity-logs`,
      ai: `${API_PREFIX}/${API_VERSION}/ai`,
      settings: `${API_PREFIX}/${API_VERSION}/settings`,
      holidays: `${API_PREFIX}/${API_VERSION}/holidays`,
      policies: `${API_PREFIX}/${API_VERSION}/policies`,
      compliance: `${API_PREFIX}/${API_VERSION}/compliance`,
      announcements: `${API_PREFIX}/${API_VERSION}/announcements`,
      onboarding: `${API_PREFIX}/${API_VERSION}/onboarding`,
      performanceReviews: `${API_PREFIX}/${API_VERSION}/performance-reviews`,
      training: `${API_PREFIX}/${API_VERSION}/training`,
      assets: `${API_PREFIX}/${API_VERSION}/assets`,
      expenses: `${API_PREFIX}/${API_VERSION}/expenses`,
      exitManagement: `${API_PREFIX}/${API_VERSION}/exit-management`
    }
  });
});

// Mount routes
app.use(`${API_PREFIX}/${API_VERSION}/auth`, authRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/hierarchy`, hierarchyRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/attendance`, attendanceRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/geofences`, geofenceRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/leave`, leaveRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/employees`, employeeRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/progress-reports`, progressReportRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/meetings`, meetingRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/shifts`, shiftRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/payroll`, payrollRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/reports`, reportsRoutes);
app.use(`${API_PREFIX}/${API_VERSION}`, recruitmentRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/media`, uploadRoutes);
app.use(`${API_PREFIX}/${API_VERSION}`, projectRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/tasks`, taskRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/leave-policies`, leavePolicyRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/notifications`, notificationRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/analytics`, analyticsRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/departments`, departmentRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/teams`, teamRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/forms`, formRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/activity-logs`, activityLogRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/ai`, aiRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/settings`, settingsRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/holidays`, holidayRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/policies`, policyRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/compliance`, complianceRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/announcements`, announcementRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/onboarding`, onboardingRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/feedback`, feedbackRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/documents`, documentRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/performance-reviews`, performanceReviewRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/training`, trainingRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/assets`, assetRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/expenses`, expenseRoutes);
app.use(`${API_PREFIX}/${API_VERSION}/exit-management`, exitManagementRoutes);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Connect to database
    await connectDB();

    // Initialize Redis cache
    const { cache } = await initializeCache();
    if (cache) {
      console.log('✅ Redis cache initialized');
    } else {
      console.warn('⚠️  Redis cache unavailable - running without cache');
    }

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize Socket.IO with same CORS policy
    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
      : ['http://localhost:3000', 'http://localhost:5000'];

    const io = new Server(server, {
      cors: {
        origin: (origin, callback) => {
          if (!origin) return callback(null, true);
          if (process.env.NODE_ENV === 'production' && allowedOrigins.includes('*')) {
            return callback(new Error('Wildcard CORS not allowed in production'), false);
          }
          if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            callback(null, true);
          } else {
            callback(new Error(`Origin ${origin} not allowed`), false);
          }
        },
        credentials: true,
        methods: ['GET', 'POST']
      }
    });

    // Initialize notification socket
    const notificationSocket = new NotificationSocket(io);
    app.set('notificationSocket', notificationSocket);
    app.set('io', io);

    console.log('✅ WebSocket notifications initialized');

    // Schedule automatic backups (daily at 2 AM)
    if (process.env.ENABLE_AUTO_BACKUP === 'true') {
      backupService.scheduleBackups(process.env.BACKUP_CRON || '0 2 * * *');
      console.log('✅ Automatic backups scheduled');
    }

    // Start listening on all network interfaces
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`
========================================
🚀 WorkOrbit API Server (Enterprise+)
========================================
📍 Environment: ${process.env.NODE_ENV || 'development'}
🌐 Server: http://localhost:${PORT}
🌐 Network: http://192.168.1.3:${PORT}
📚 API Base: ${API_PREFIX}/${API_VERSION}
📖 API Docs: http://localhost:${PORT}/docs
🏥 Health: http://localhost:${PORT}/health
📊 Metrics: http://localhost:${PORT}/metrics
🔔 WebSocket: ws://localhost:${PORT}
💾 Cache: ${cache ? 'Redis (Active)' : 'Disabled'}
🔒 CORS: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}

🎯 New Features:
   - Real-time notifications via WebSocket
   - Redis caching for improved performance
   - Advanced analytics & dashboard
   - Data export (Excel, PDF, CSV, JSON)
   - Database backup & restore
   - Per-user rate limiting
   - Advanced search & filtering
========================================
      `);
    });

    // Register server for graceful shutdown
    setServer(server);

    // Register shutdown handlers
    registerShutdownHandlers();
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Note: Shutdown handlers are now registered in gracefulShutdown.js
// This provides proper cleanup of database connections, Redis, queues, etc.

// Start the server
startServer();

module.exports = app;