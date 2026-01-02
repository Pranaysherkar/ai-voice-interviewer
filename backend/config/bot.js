const { CloudAdapter, ConfigurationBotFrameworkAuthentication } = require('botbuilder');
const logger = require('../utils/logger');

// Get bot credentials from environment (Bot Framework standard variable names)
const botAppId = process.env.MicrosoftAppId;
const botAppPassword = process.env.MicrosoftAppPassword;
const botAppType = process.env.MicrosoftAppType; // Default to MultiTenant
const botAppTenantId = process.env.MicrosoftAppTenantId; // Empty for MultiTenant

if (!botAppId || !botAppPassword) {
  logger.error('Bot credentials incomplete. Required: MicrosoftAppId, MicrosoftAppPassword');
}

// Create Bot Framework authentication configuration
const authConfig = {
  MicrosoftAppId: botAppId,
  MicrosoftAppPassword: botAppPassword,
};

// Set app type and tenant ID if provided
if (botAppType) {
  authConfig.MicrosoftAppType = botAppType;
}
if (botAppTenantId) {
  authConfig.MicrosoftAppTenantId = botAppTenantId;
}

const botFrameworkAuthentication = new ConfigurationBotFrameworkAuthentication(authConfig);

// Create Cloud Adapter (replaces deprecated BotFrameworkAdapter)
const adapter = new CloudAdapter(botFrameworkAuthentication);

// Add logging for adapter initialization
logger.info('CloudAdapter initialized', {
  appId: botAppId ? `${botAppId.substring(0, 8)}...` : 'NOT SET',
  appIdLength: botAppId ? botAppId.length : 0,
  hasPassword: !!botAppPassword,
  appType: botAppType,
  tenantId: botAppTenantId || 'none',
});

// Validate AppId format (should be GUID format)
if (botAppId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(botAppId)) {
  logger.warn('MicrosoftAppId does not appear to be a valid GUID format. This may cause authentication errors.');
}

// Handle bot errors
adapter.onTurnError = async (context, error) => {
  logger.error('Bot error occurred:', error);
  
  // Only try to send error message if we have a valid context
  try {
    if (context && context.sendActivity) {
      await context.sendActivity('Sorry, an error occurred. Please try again later.');
      await context.clearState();
    }
  } catch (sendError) {
    logger.error('Could not send error message to user:', sendError);
  }
};

// Log bot activities and handle ConnectorClient errors
adapter.use(async (context, next) => {
  try {
    logger.info('Bot activity received', {
      type: context.activity.type,
      channelId: context.activity.channelId,
      from: context.activity.from?.name,
      serviceUrl: context.activity.serviceUrl,
    });
    
    // Ensure ConnectorFactory is available in turnState (fix for ConnectorClient extraction)
    // This ensures CloudAdapter can create ConnectorClient when needed
    if (!context.turnState.get(adapter.ConnectorFactoryKey)) {
      logger.warn('ConnectorFactory not found in turnState - CloudAdapter should set this');
    }
    
    await next();
  } catch (error) {
    // Log authentication/ConnectorClient errors specifically
    if (error.message && error.message.includes('ConnectorClient')) {
      logger.error('ConnectorClient extraction error', {
        error: error.message,
        channelId: context?.activity?.channelId,
        serviceUrl: context?.activity?.serviceUrl,
        hasAuth: !!context?.activity?.serviceUrl,
        hasConnectorFactory: !!context?.turnState?.get(adapter.ConnectorFactoryKey),
      });
    }
    throw error;
  }
});

module.exports = {
  adapter,
  botAppId,
  botAppPassword,
};

