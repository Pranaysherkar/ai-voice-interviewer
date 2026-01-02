const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { asyncHandler } = require('../utils/errorHandler');
const { testConnection: testDbConnection } = require('../config/database');
const { testConnection: testQdrantConnection } = require('../config/qdrant');
const { testConnection: testOpenAIConnection } = require('../config/openai');

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Status endpoint - check all connections
router.get(
  '/status',
  asyncHandler(async (req, res) => {
    const status = {
      success: true,
      timestamp: new Date().toISOString(),
      services: {
        database: false,
        qdrant: false,
        openai: false,
      },
    };

    // Test PostgreSQL
    try {
      status.services.database = await testDbConnection();
    } catch (error) {
      logger.error('Database status check failed:', error);
    }

    // Test Qdrant
    try {
      status.services.qdrant = await testQdrantConnection();
    } catch (error) {
      logger.error('Qdrant status check failed:', error);
    }

    // Test OpenAI (if API key is set)
    if (process.env.OPENAI_API_KEY) {
      try {
        status.services.openai = await testOpenAIConnection();
      } catch (error) {
        logger.error('OpenAI status check failed:', error);
      }
    } else {
      status.services.openai = null; // Not configured
    }

    // Determine overall status
    const allServicesHealthy =
      status.services.database &&
      status.services.qdrant &&
      (status.services.openai !== false);

    status.success = allServicesHealthy;

    const httpStatus = allServicesHealthy ? 200 : 503;
    res.status(httpStatus).json(status);
  })
);

// Interview scheduling endpoint (placeholder)
router.post(
  '/interviews/schedule',
  asyncHandler(async (req, res) => {
    logger.info('Interview scheduling request received', req.body);
    // TODO: Implement interview scheduling logic
    res.status(501).json({
      success: false,
      message: 'Interview scheduling not yet implemented',
    });
  })
);

// n8n webhook receiver (placeholder)
router.post(
  '/webhooks/n8n',
  asyncHandler(async (req, res) => {
    logger.info('n8n webhook received', req.body);
    // TODO: Implement n8n webhook handler
    res.status(501).json({
      success: false,
      message: 'n8n webhook handler not yet implemented',
    });
  })
);

module.exports = router;

