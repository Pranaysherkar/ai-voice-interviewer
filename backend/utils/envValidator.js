const logger = require('./logger');

/**
 * Get environment variable, log if missing
 * @param {string} key - Environment variable key
 * @param {string} description - Description for logging
 * @returns {string|undefined} - Environment variable value or undefined
 */
function getEnv(key, description) {
  const value = process.env[key];
  if (!value) {
    logger.warn(`Environment variable ${key} not set: ${description}`);
  }
  return value;
}

/**
 * Get integer environment variable
 * @param {string} key - Environment variable key
 * @param {string} description - Description for logging
 * @returns {number|undefined} - Parsed integer value or undefined
 */
function getIntEnv(key, description) {
  const value = process.env[key];
  if (!value) {
    logger.warn(`Environment variable ${key} not set: ${description}`);
    return undefined;
  }
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    logger.warn(`Invalid integer value for ${key}: ${value}`);
    return undefined;
  }
  return parsed;
}

module.exports = {
  getEnv,
  getIntEnv,
};

