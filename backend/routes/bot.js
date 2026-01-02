const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const { adapter } = require('../config/bot');
const InterviewBot = require('../services/interviewBot');

// Create bot instance (InterviewBot with voice capabilities)
const bot = new InterviewBot();

// Bot webhook endpoint - receives all bot activities
router.post('/messages', async (req, res) => {
  // Add detailed logging at the very start
  console.log('\n=== BOT WEBHOOK REQUEST RECEIVED ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('Request method:', req.method);
  console.log('Request path:', req.path);
  console.log('Request body type:', req.body?.type);
  console.log('Request channelId:', req.body?.channelId);
  console.log('Request from:', req.body?.from?.id);
  console.log('Request text:', req.body?.text);
  console.log('Request serviceUrl:', req.body?.serviceUrl);
  console.log('=====================================\n');

  try {
    logger.info('Bot webhook received', {
      type: req.body.type,
      channelId: req.body.channelId,
      from: req.body.from?.id,
      text: req.body.text,
      serviceUrl: req.body.serviceUrl,
    });

    // Log authentication details
    console.log('Authorization header present:', !!req.headers.authorization);
    console.log('Authorization header starts with Bearer:', req.headers.authorization?.startsWith('Bearer'));
    if (req.headers.authorization) {
      const token = req.headers.authorization.replace('Bearer ', '');
      // Log first and last few chars of token for debugging (not full token for security)
      console.log('Token preview:', token.substring(0, 10) + '...' + token.substring(token.length - 10));
    }
    console.log('Request serviceUrl:', req.body?.serviceUrl);
    console.log('Request channelId:', req.body?.channelId);
    console.log('Request recipient.id:', req.body?.recipient?.id);

    // CRITICAL: Set serviceUrl if missing (required for ConnectorClient creation)
    // JWT validation uses Authorization header, not body content
    // So we can safely add missing serviceUrl without breaking authentication
    if (req.body && req.body.channelId && !req.body.serviceUrl) {
      const defaultServiceUrls = {
        'webchat': 'https://india.webchat.botframework.com/',
        'msteams': 'https://smba.trafficmanager.net/',
        'directline': 'https://directline.botframework.com/',
      };
      
      if (defaultServiceUrls[req.body.channelId]) {
        req.body.serviceUrl = defaultServiceUrls[req.body.channelId];
        console.log('Set missing serviceUrl to:', req.body.serviceUrl);
      } else {
        console.warn('⚠️  WARNING: serviceUrl is missing and no default for channel:', req.body.channelId);
      }
    }

    // Process activity through Bot Framework adapter
    // CloudAdapter.process handles authentication and creates the context
    // The adapter automatically handles the HTTP response
    try {
      await adapter.process(req, res, async (context) => {
        console.log('=== ADAPTER PROCESSING ACTIVITY ===');
        console.log('Activity type:', context.activity.type);
        console.log('Channel ID:', context.activity.channelId);
        console.log('Service URL:', context.activity.serviceUrl);
        console.log('From:', context.activity.from?.name);
        console.log('Text:', context.activity.text);
        console.log('Conversation ID:', context.activity.conversation?.id);
        console.log('===================================\n');
        
        // Only process message activities (skip typing indicators, etc.)
        if (context.activity.type === 'message') {
          try {
            // Route activity to bot
            await bot.run(context);
          } catch (botError) {
            console.error('Error in bot.run():', botError);
            logger.error('Bot execution error:', botError);
            // Try to send error message to user
            try {
              await context.sendActivity('Sorry, I encountered an error processing your message.');
            } catch (sendError) {
              console.error('Could not send error message:', sendError);
            }
          }
        } else {
          console.log('Skipping non-message activity:', context.activity.type);
          // For typing indicators and other non-message activities, just acknowledge
          if (context.activity.type === 'typing') {
            // Typing indicators don't need a response
            return;
          }
        }
      });
    } catch (adapterError) {
      // This catches errors from adapter.process itself (authentication failures)
      console.error('\n=== ADAPTER PROCESS ERROR ===');
      console.error('Error type:', adapterError.constructor.name);
      console.error('Error message:', adapterError.message);
      
      // Check if it's an authentication/ConnectorClient error
      if (adapterError.message && adapterError.message.includes('ConnectorClient')) {
        console.error('\n⚠️  AUTHENTICATION ERROR: Unable to extract ConnectorClient');
        console.error('\n🔍 TROUBLESHOOTING STEPS:\n');
        console.error('1. Verify Bot Credentials in Azure Portal:');
        console.error('   - Go to Azure Portal → Your Bot → Configuration');
        console.error('   - Check "Microsoft App ID" matches MicrosoftAppId in .env');
        console.error('   - Click "Manage Password" → Verify it matches MicrosoftAppPassword\n');
        console.error('2. Verify Messaging Endpoint matches ngrok URL:');
        console.error('   - In Azure Portal → Your Bot → Configuration');
        console.error('   - "Messaging endpoint" should be: https://YOUR-NGROK-URL.ngrok-free.dev/api/messages');
        console.error('   - Current ngrok URL: Check ngrok terminal or http://localhost:4040\n');
        console.error('3. If endpoint doesn\'t match:');
        console.error('   - Update "Messaging endpoint" in Azure Portal');
        console.error('   - Wait 1-2 minutes for changes to propagate');
        console.error('   - Try sending a message again\n');
        console.error('4. If credentials don\'t match:');
        console.error('   - Update .env file with correct values');
        console.error('   - Restart backend server\n');
      }
      
      console.error('Full error stack:', adapterError.stack);
      console.error('==========================================\n');
      
      // Re-throw to be caught by outer catch block
      throw adapterError;
    }
    
    console.log('=== BOT WEBHOOK PROCESSED SUCCESSFULLY ===\n');
  } catch (error) {
    console.error('\n=== BOT WEBHOOK ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error statusCode:', error.statusCode);
    console.error('Full error:', error);
    console.error('==========================\n');
    
    logger.error('Error processing bot activity:', {
      message: error.message,
      stack: error.stack,
      statusCode: error.statusCode,
      error: error,
    });
    
    // Make sure to send response if not already sent
    if (!res.headersSent) {
      res.status(error.statusCode || 500).json({
        success: false,
        error: {
          message: error.message,
          statusCode: error.statusCode || 500,
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
      });
    }
  }
});

// Calling webhook endpoint (for voice calls)
router.post('/calling', async (req, res) => {
  try {
    logger.info('Calling webhook received', req.body);
    
    // TODO: Implement calling webhook handler
    // This will handle voice call events from Teams
    
    res.status(200).json({
      success: true,
      message: 'Calling webhook received',
    });
  } catch (error) {
    logger.error('Error processing calling webhook:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Test endpoint (no authentication required) - for local testing
router.post('/messages/test', async (req, res) => {
  try {
    logger.info('Test bot webhook received', {
      type: req.body.type,
      channelId: req.body.channelId,
      text: req.body.text,
    });

    res.status(200).json({
      success: true,
      message: 'Test endpoint received message successfully',
      received: {
        type: req.body.type,
        text: req.body.text,
        from: req.body.from,
      },
      note: 'This is a test endpoint. Use /api/messages for actual bot integration.',
    });
  } catch (error) {
    logger.error('Error in test endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;

