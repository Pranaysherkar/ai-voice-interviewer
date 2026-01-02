require('dotenv').config();
const app = require('./app');
const logger = require('./utils/logger');
const { getIntEnv, getEnv } = require('./utils/envValidator');
const { testConnection: testDbConnection, closePool } = require('./config/database');
const { testConnection: testQdrantConnection } = require('./config/qdrant');
const { testConnection: testOpenAIConnection } = require('./config/openai');

const portValue = getIntEnv('PORT', 'Server port');
const PORT = portValue ? portValue : 3000;

// Graceful shutdown handler
async function gracefulShutdown(signal) {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  // Close server
  server.close(() => {
    logger.info('HTTP server closed');
  });

  // Close database connections
  try {
    await closePool();
    logger.info('Database connections closed');
  } catch (error) {
    logger.error('Error closing database connections:', error);
  }

  // Exit process
  process.exit(0);
}

// Test all connections on startup
async function initializeConnections() {
  logger.info('Initializing connections...');

  const results = {
    database: false,
    qdrant: false,
    openai: false,
  };

  // Test PostgreSQL
  results.database = await testDbConnection();

  // Test Qdrant
  results.qdrant = await testQdrantConnection();

  // Test OpenAI (optional - won't fail if API key not set)
  if (process.env.OPENAI_API_KEY) {
    results.openai = await testOpenAIConnection();
  } else {
    logger.warn('OpenAI API key not configured - skipping connection test');
  }

  return results;
}

// Start server
async function startServer() {
  try {
    // Initialize connections
    const connections = await initializeConnections();

    // Log connection status
    logger.info('Connection status:', connections);

    // Start HTTP server
    const nodeEnvValue = getEnv('NODE_ENV', 'Node environment');
    const nodeEnv = nodeEnvValue ? nodeEnvValue : 'development';
    const server = app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);
      logger.info(`Environment: ${nodeEnv}`);
    });

    // Handle graceful shutdown
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      logger.error('Unhandled Promise Rejection:', err);
      gracefulShutdown('unhandledRejection');
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception:', err);
      gracefulShutdown('uncaughtException');
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
let server;
startServer().then((s) => {
  server = s;
});

module.exports = server;

