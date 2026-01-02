const { Pool } = require('pg');
const logger = require('../utils/logger');
const { getEnv, getIntEnv } = require('../utils/envValidator');

// PostgreSQL connection pool configuration
const dbHost = getEnv('DB_HOST', 'PostgreSQL host address');
const dbPort = getIntEnv('DB_PORT', 'PostgreSQL port');
const dbName = getEnv('DB_NAME', 'PostgreSQL database name');
const dbUser = getEnv('DB_USER', 'PostgreSQL username');
const dbPassword = getEnv('DB_PASSWORD', 'PostgreSQL password');
const poolMax = getIntEnv('DB_POOL_MAX', 'PostgreSQL connection pool maximum size');
const poolIdleTimeout = getIntEnv('DB_POOL_IDLE_TIMEOUT', 'PostgreSQL connection pool idle timeout (ms)');
const poolConnectionTimeout = getIntEnv('DB_POOL_CONNECTION_TIMEOUT', 'PostgreSQL connection timeout (ms)');

if (!dbHost || !dbName || !dbUser || !dbPassword) {
  logger.error('PostgreSQL configuration incomplete. Required: DB_HOST, DB_NAME, DB_USER, DB_PASSWORD');
}

const poolConfig = {
  host: dbHost,
  port: dbPort ? dbPort : 5432,
  database: dbName,
  user: dbUser,
  password: dbPassword ? dbPassword : '',
  max: poolMax ? poolMax : 20,
  idleTimeoutMillis: poolIdleTimeout ? poolIdleTimeout : 30000,
  connectionTimeoutMillis: poolConnectionTimeout ? poolConnectionTimeout : 2000,
};

const pool = new Pool(poolConfig);

// Handle pool errors
pool.on('error', (err) => {
  logger.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Test database connection
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    client.release();
    logger.info('PostgreSQL connection established successfully');
    return true;
  } catch (error) {
    logger.error('PostgreSQL connection failed:', error);
    return false;
  }
}

// Execute a query
async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: result.rowCount });
    return result;
  } catch (error) {
    logger.error('Query error:', { text, error: error.message });
    throw error;
  }
}

// Get a client from the pool (for transactions)
async function getClient() {
  return await pool.connect();
}

// Close the pool (for graceful shutdown)
async function closePool() {
  await pool.end();
  logger.info('PostgreSQL connection pool closed');
}

module.exports = {
  pool,
  query,
  getClient,
  testConnection,
  closePool,
};

