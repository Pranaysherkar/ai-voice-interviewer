const { Client } = require('@microsoft/microsoft-graph-client');
const { ClientSecretCredential } = require('@azure/identity');
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');
const logger = require('../utils/logger');
const { getEnv } = require('../utils/envValidator');

// Get Graph API credentials from environment
const clientId = getEnv('MICROSOFT_CLIENT_ID', 'Microsoft Graph Client ID');
const clientSecret = getEnv('MICROSOFT_CLIENT_SECRET', 'Microsoft Graph Client Secret');
const tenantId = getEnv('MICROSOFT_TENANT_ID', 'Microsoft Graph Tenant ID');

if (!clientId || !clientSecret || !tenantId) {
  logger.error('Microsoft Graph API credentials incomplete. Required: MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_TENANT_ID');
}

// Create credential for authentication
let graphClient = null;

try {
  if (clientId && clientSecret && tenantId) {
    const credential = new ClientSecretCredential(tenantId, clientId, clientSecret);
    
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default'],
    });
    
    // Create Graph client
    graphClient = Client.initWithMiddleware({ authProvider });
    
    logger.info('Microsoft Graph API client initialized successfully');
  }
} catch (error) {
  logger.error('Failed to initialize Microsoft Graph API client:', error);
}

// Test Graph API connection
async function testConnection() {
  if (!graphClient) {
    logger.warn('Microsoft Graph client not initialized');
    return false;
  }
  
  try {
    // Test with organization endpoint (works with app-only auth)
    const org = await graphClient.api('/organization').get();
    logger.info('Microsoft Graph API connection established successfully');
    return true;
  } catch (error) {
    logger.error('Microsoft Graph API connection failed:', error.message);
    return false;
  }
}

module.exports = {
  graphClient,
  testConnection,
};

