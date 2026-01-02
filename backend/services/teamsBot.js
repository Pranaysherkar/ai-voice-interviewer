const { ActivityHandler, MessageFactory } = require('botbuilder');
const logger = require('../utils/logger');

/**
 * Teams Bot Service
 * Handles bot activities and Teams-specific events
 */
class TeamsBot extends ActivityHandler {
  constructor() {
    super();

    // Handle message activities
    this.onMessage(async (context, next) => {
      logger.info('Message received from Teams', {
        from: context.activity.from.name,
        text: context.activity.text,
      });

      // Echo message for testing (replace with interview logic later)
      const replyText = `Echo: ${context.activity.text}`;
      await context.sendActivity(MessageFactory.text(replyText, replyText));

      await next();
    });

    // Handle members added (when bot joins meeting)
    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      
      for (const member of membersAdded) {
        if (member.id !== context.activity.recipient.id) {
          logger.info('New member added to conversation', {
            memberId: member.id,
            memberName: member.name,
          });
          
          // Bot joined - start interview logic here
          await context.sendActivity(
            MessageFactory.text('Hello! I am your AI interview bot. Let\'s begin the interview.')
          );
        }
      }

      await next();
    });

    // Handle meeting start events
    this.onEvent(async (context, next) => {
      if (context.activity.name === 'application/vnd.microsoft.meetingStart') {
        logger.info('Meeting started', {
          meetingId: context.activity.channelData?.meeting?.id,
        });
        
        // Meeting started - initialize interview
        await this.handleMeetingStart(context);
      }

      await next();
    });
  }

  /**
   * Handle meeting start event
   * @param {Object} context - Turn context
   */
  async handleMeetingStart(context) {
    try {
      logger.info('Handling meeting start event');
      
      // TODO: Load interview context (JD, Resume, Questions)
      // TODO: Initialize OpenAI Realtime API connection
      // TODO: Start audio processing
      
      await context.sendActivity(
        MessageFactory.text('Interview session started. I am ready to begin.')
      );
    } catch (error) {
      logger.error('Error handling meeting start:', error);
    }
  }
}

module.exports = TeamsBot;

