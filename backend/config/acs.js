const { CommunicationIdentityClient } = require('@azure/communication-identity');
const logger = require('../utils/logger');
const { getEnv } = require('../utils/envValidator');

// Get ACS configuration from environment
const acsConnectionString = getEnv('ACS_CONNECTION_STRING', 'Azure Communication Services connection string');
const acsPhoneNumber = process.env.ACS_PHONE_NUMBER || ''; // Optional

// Audio configuration (OpenAI Realtime API requirements)
const AUDIO_CONFIG = {
  sampleRate: parseInt(process.env.AUDIO_SAMPLE_RATE || '24000', 10), // OpenAI requires 24kHz
  channels: parseInt(process.env.AUDIO_CHANNELS || '1', 10), // Mono
  bitDepth: parseInt(process.env.AUDIO_BIT_DEPTH || '16', 10), // 16-bit PCM
  frameSize: 480, // 20ms at 24kHz (24000 * 0.02 = 480 samples)
};

// Initialize ACS client
let identityClient = null;

if (acsConnectionString) {
  try {
    identityClient = new CommunicationIdentityClient(acsConnectionString);
    logger.info('Azure Communication Services client initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize ACS client:', error);
  }
} else {
  logger.warn('ACS_CONNECTION_STRING not configured - ACS features will be unavailable');
}

/**
 * Create a new ACS user identity
 * @returns {Promise<string>} User ID
 */
async function createUserIdentity() {
  if (!identityClient) {
    throw new Error('ACS client not initialized');
  }

  try {
    const user = await identityClient.createUser();
    logger.info('Created ACS user identity', { userId: user.communicationUserId });
    return user.communicationUserId;
  } catch (error) {
    logger.error('Failed to create ACS user identity:', error);
    throw error;
  }
}

/**
 * Generate access token for ACS user
 * @param {string} userId - ACS user ID
 * @param {Array<string>} scopes - Token scopes (default: ['voip', 'chat'])
 * @returns {Promise<string>} Access token
 */
async function getAccessToken(userId, scopes = ['voip', 'chat']) {
  if (!identityClient) {
    throw new Error('ACS client not initialized');
  }

  try {
    const tokenResponse = await identityClient.getToken(userId, scopes);
    logger.debug('Generated ACS access token', { 
      userId, 
      expiresOn: tokenResponse.expiresOn,
      scopes: scopes.join(',')
    });
    return tokenResponse.token;
  } catch (error) {
    logger.error('Failed to generate ACS access token:', error);
    throw error;
  }
}

/**
 * Test ACS connection
 * @returns {Promise<boolean>} Connection status
 */
async function testConnection() {
  if (!identityClient) {
    logger.warn('ACS client not initialized');
    return false;
  }

  try {
    // Test by creating a user identity
    const user = await createUserIdentity();
    logger.info('ACS connection test successful', { userId: user });
    return true;
  } catch (error) {
    logger.error('ACS connection test failed:', error.message);
    return false;
  }
}

module.exports = {
  identityClient,
  acsConnectionString,
  acsPhoneNumber,
  AUDIO_CONFIG,
  createUserIdentity,
  getAccessToken,
  testConnection,
};

