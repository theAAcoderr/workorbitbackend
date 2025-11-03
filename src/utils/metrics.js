const client = require('prom-client');

/**
 * Prometheus metrics collection
 */

// Create a Registry
const register = new client.Registry();

// Add default metrics (CPU, memory, etc.)
client.collectDefaultMetrics({ register });

// Custom metrics

// HTTP request duration histogram
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5, 10]
});

// HTTP request counter
const httpRequestTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

// Active requests gauge
const httpRequestsActive = new client.Gauge({
  name: 'http_requests_active',
  help: 'Number of active HTTP requests',
  labelNames: ['method']
});

// Database query duration
const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2]
});

// Database connections gauge
const dbConnectionsActive = new client.Gauge({
  name: 'db_connections_active',
  help: 'Number of active database connections'
});

// Authentication metrics
const authAttemptsTotal = new client.Counter({
  name: 'auth_attempts_total',
  help: 'Total authentication attempts',
  labelNames: ['type', 'result']
});

// Job queue metrics
const jobQueueSize = new client.Gauge({
  name: 'job_queue_size',
  help: 'Number of jobs in queue',
  labelNames: ['queue_name', 'status']
});

// Register all custom metrics
register.registerMetric(httpRequestDuration);
register.registerMetric(httpRequestTotal);
register.registerMetric(httpRequestsActive);
register.registerMetric(dbQueryDuration);
register.registerMetric(dbConnectionsActive);
register.registerMetric(authAttemptsTotal);
register.registerMetric(jobQueueSize);

// Middleware to track HTTP metrics
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  const route = req.route?.path || req.path || 'unknown';

  // Increment active requests
  httpRequestsActive.inc({ method: req.method });

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    // Decrement active requests
    httpRequestsActive.dec({ method: req.method });

    // Record duration
    httpRequestDuration.observe(
      { method: req.method, route, status_code: res.statusCode },
      duration
    );

    // Increment counter
    httpRequestTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode
    });
  });

  next();
};

// Get metrics in Prometheus format
const getMetrics = async () => {
  return register.metrics();
};

// Get metrics as JSON
const getMetricsJSON = async () => {
  const metrics = await register.getMetricsAsJSON();
  return metrics;
};

module.exports = {
  register,
  metricsMiddleware,
  getMetrics,
  getMetricsJSON,
  metrics: {
    httpRequestDuration,
    httpRequestTotal,
    httpRequestsActive,
    dbQueryDuration,
    dbConnectionsActive,
    authAttemptsTotal,
    jobQueueSize
  }
};
