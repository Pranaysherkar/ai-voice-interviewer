const OpenAI = require('openai');
const logger = require('../utils/logger');
const { getEnv } = require('../utils/envValidator');

// Initialize OpenAI client (supports both standard OpenAI and Azure OpenAI)
let openai = null;
const openaiApiKey = getEnv('OPENAI_API_KEY', 'OpenAI API key');
const azureEndpoint = getEnv('AZURE_OPENAI_ENDPOINT', 'Azure OpenAI endpoint', false); // Optional
const azureApiVersion = getEnv('AZURE_OPENAI_API_VERSION', 'Azure OpenAI API version', false) || '2024-02-15-preview';

if (openaiApiKey) {
  // Check if using Azure OpenAI
  if (azureEndpoint) {
    // Azure OpenAI configuration
    logger.info('Initializing Azure OpenAI client', { endpoint: azureEndpoint });
    const baseURL = azureEndpoint.replace(/\/$/, '');
    
    // For Azure OpenAI, the SDK expects: baseURL/openai/deployments/{deployment-name}
    // But we set baseURL to just the endpoint, and the SDK will append the path
    openai = new OpenAI({
      apiKey: openaiApiKey,
      baseURL: `${baseURL}/openai/deployments`,
      defaultQuery: { 'api-version': azureApiVersion },
      defaultHeaders: {
        'api-key': openaiApiKey,
      },
    });
  } else {
    // Standard OpenAI configuration
    logger.info('Initializing standard OpenAI client');
    openai = new OpenAI({
      apiKey: openaiApiKey,
    });
  }
} else {
  logger.warn('OPENAI_API_KEY not configured - OpenAI features will be unavailable');
}

// Get model names from environment (configurable)
function getInterviewModel() {
  const model = getEnv('INTERVIEW_MODEL', 'OpenAI interview model name');
  if (!model) {
    logger.error('INTERVIEW_MODEL is required');
  }
  return model ? model : 'gpt-4o-mini-realtime-preview';
}

function getEmbeddingModel() {
  const model = getEnv('EMBEDDING_MODEL', 'OpenAI embedding model name');
  if (!model) {
    logger.error('EMBEDDING_MODEL is required');
  }
  return model ? model : 'text-embedding-3-small';
}

// Test OpenAI connection
async function testConnection() {
  if (!openai) {
    logger.warn('OpenAI client not initialized - API key missing');
    return false;
  }
  try {
    // For Azure OpenAI, we need to use a deployment-specific endpoint
    // For standard OpenAI, we can list models
    if (azureEndpoint) {
      // Azure OpenAI: Check deployment name
      const deploymentName = getEnv('AZURE_OPENAI_DEPLOYMENT_NAME', 'Azure OpenAI deployment name', false);
      if (deploymentName) {
        // Skip HTTP test for realtime models (they only work via WebSocket)
        if (deploymentName.includes('realtime')) {
          logger.info('Azure OpenAI Realtime model detected - skipping HTTP test (use WebSocket for realtime models)');
          logger.info('Azure OpenAI configuration loaded successfully');
          return true;
        }
        
        // Test with a minimal chat completion for non-realtime models
        const response = await openai.chat.completions.create({
          model: deploymentName,
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1,
        });
        logger.info('Azure OpenAI connection established successfully');
        return true;
      } else {
        logger.warn('AZURE_OPENAI_DEPLOYMENT_NAME not set - skipping connection test');
        return false;
      }
    } else {
      // Standard OpenAI: List models
      const response = await openai.models.list();
      logger.info('OpenAI connection established successfully');
      return true;
    }
  } catch (error) {
    logger.error('OpenAI connection failed:', error.message);
    return false;
  }
}

module.exports = {
  openai,
  getInterviewModel,
  getEmbeddingModel,
  testConnection,
};

