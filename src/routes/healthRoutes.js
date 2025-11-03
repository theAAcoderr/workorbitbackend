const express = require('express');
const router = express.Router();
const {
  livenessProbe,
  readinessProbe,
  fullHealthCheck
} = require('../utils/healthCheck');

/**
 * Health check routes for Kubernetes/Cloud platforms
 */

// Liveness probe - is the app alive?
router.get('/live', async (req, res) => {
  try {
    const result = await livenessProbe();
    res.status(200).json(result);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: new Date()
    });
  }
});

// Readiness probe - can it serve traffic?
router.get('/ready', async (req, res) => {
  try {
    const result = await readinessProbe();
    const statusCode = result.status === 'ready' ? 200 : 503;
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      error: error.message,
      timestamp: new Date()
    });
  }
});

// Full health check - detailed status
router.get('/', async (req, res) => {
  try {
    const result = await fullHealthCheck();
    const statusCode = result.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(result);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    });
  }
});

module.exports = router;
