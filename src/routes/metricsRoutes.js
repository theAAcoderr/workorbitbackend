const express = require('express');
const router = express.Router();
const { getMetrics, getMetricsJSON } = require('../utils/metrics');

/**
 * Metrics endpoints for Prometheus
 */

// Prometheus format (for scraping)
router.get('/', async (req, res) => {
  try {
    res.set('Content-Type', 'text/plain');
    const metrics = await getMetrics();
    res.send(metrics);
  } catch (error) {
    res.status(500).send('Error collecting metrics');
  }
});

// JSON format (for dashboards)
router.get('/json', async (req, res) => {
  try {
    const metrics = await getMetricsJSON();
    res.json({
      success: true,
      metrics,
      timestamp: new Date()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error collecting metrics',
      error: error.message
    });
  }
});

module.exports = router;
