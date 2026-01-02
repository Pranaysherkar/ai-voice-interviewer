const { ActivityHandler, MessageFactory } = require('botbuilder');
const logger = require('../utils/logger');
const RealtimeService = require('./realtimeService');
const graphService = require('./graphService');

// ACS Calling SDK is browser-only, so we need to conditionally load it
// It will only work if we have a browser environment or use a different approach
let ACSCallingService = null;
let AudioBridge = null;

// Try to load ACS modules only if ACS_CONNECTION_STRING is set
// Note: These modules require browser APIs and won't work in Node.js
if (process.env.ACS_CONNECTION_STRING) {
  try {
    // Check if we're in a browser-like environment (we're not, but try anyway)
    // In production, you'd need a different solution for server-side audio
    ACSCallingService = require('./acsCallingService');
    AudioBridge = require('./audioBridge');
    logger.info('ACS modules loaded (note: may not work in Node.js - browser-only SDK)');
  } catch (error) {
    logger.warn('ACS modules not available - this is expected in Node.js', {
      error: error.message,
      note: 'ACS Calling SDK requires browser APIs (MediaStream, WebRTC)',
    });
  }
} else {
  logger.info('ACS_CONNECTION_STRING not set - bot will work in text-only mode');
}

/**
 * Interview Bot - Handles Teams meeting join and voice interviews
 */
class InterviewBot extends ActivityHandler {
  constructor() {
    super();
    this.realtimeSessions = new Map(); // meetingId -> RealtimeService
    this.acsCallingServices = new Map(); // meetingId -> ACSCallingService
    this.audioBridges = new Map(); // meetingId -> AudioBridge
    this.meetingStates = new Map(); // meetingId -> state

    // Handle message activities
    this.onMessage(async (context, next) => {
      try {
        logger.info('Message received from Teams', {
          from: context.activity.from?.name || context.activity.from?.id,
          text: context.activity.text,
        });

        const meetingId = this.getMeetingId(context);
        
        // Echo for testing
        const replyText = `Echo: ${context.activity.text}`;
        
        try {
          await context.sendActivity(MessageFactory.text(replyText, replyText));
          logger.info('Response sent successfully');
        } catch (sendError) {
          logger.error('Error sending response:', {
            message: sendError.message,
            stack: sendError.stack,
          });
          // Don't throw - just log the error
          console.error('Could not send response:', sendError.message);
        }

        await next();
      } catch (error) {
        logger.error('Error in onMessage handler:', error);
        // Try to send error message
        try {
          await context.sendActivity('Sorry, I encountered an error. Please try again.');
        } catch (sendError) {
          console.error('Could not send error message:', sendError);
        }
        throw error;
      }
    });

    // Handle members added (when bot or participant joins meeting)
    this.onMembersAdded(async (context, next) => {
      const membersAdded = context.activity.membersAdded;
      const meetingId = this.getMeetingId(context);
      
      for (const member of membersAdded) {
        // Check if bot itself joined
        if (member.id === context.activity.recipient.id) {
          logger.info('Bot joined the meeting', { meetingId });
          await this.handleBotJoinedMeeting(context, meetingId);
        } else {
          // Another participant joined
          logger.info('Participant joined meeting', {
            meetingId,
            memberId: member.id,
            memberName: member.name,
          });
          
          await this.handleParticipantJoined(context, meetingId, member);
        }
      }

      await next();
    });

    // Handle meeting start events
    this.onEvent(async (context, next) => {
      const meetingId = this.getMeetingId(context);

      if (context.activity.name === 'application/vnd.microsoft.meetingStart') {
        logger.info('Meeting started', { meetingId });
        await this.handleMeetingStart(context, meetingId);
      }

      if (context.activity.name === 'application/vnd.microsoft.meetingEnd') {
        logger.info('Meeting ended', { meetingId });
        await this.handleMeetingEnd(context, meetingId);
      }

      await next();
    });
  }

  /**
   * Get meeting ID from context
   * @param {Object} context - Turn context
   * @returns {string} Meeting ID
   */
  getMeetingId(context) {
    return context.activity.channelData?.meeting?.id || 
           context.activity.conversation?.id ||
           'unknown';
  }

  /**
   * Handle bot joining the meeting
   * @param {Object} context - Turn context
   * @param {string} meetingId - Meeting ID
   */
  async handleBotJoinedMeeting(context, meetingId) {
    try {
      logger.info('Initializing bot for meeting:', meetingId);

      // Initialize meeting state
      this.meetingStates.set(meetingId, {
        status: 'bot_joined',
        startTime: new Date(),
        participantCount: 1, // Bot itself
        introductionGiven: false,
        joinUrl: context.activity.channelData?.meeting?.joinUrl || null,
      });

      // Send text notification
      await context.sendActivity(
        MessageFactory.text('AI Interview Bot has joined the meeting. Initializing...')
      );

      // Initialize OpenAI Realtime API session (this works in Node.js)
      await this.initializeRealtimeSession(meetingId);

      // Get meeting join URL from context or state
      const joinUrl = context.activity.channelData?.meeting?.joinUrl || 
                      this.meetingStates.get(meetingId)?.joinUrl;

      // Try to initialize ACS calling service for audio (if available)
      // Note: ACS Calling SDK is browser-only, so this will likely fail in Node.js
      if (joinUrl && ACSCallingService && process.env.ACS_CONNECTION_STRING) {
        try {
          await this.initializeACSCalling(meetingId, joinUrl);
          // Connect audio streams if ACS is available
          await this.connectAudioStreams(meetingId);
          logger.info('ACS audio initialized (if browser environment)', { meetingId });
        } catch (error) {
          logger.warn('ACS calling not available, continuing in text-only mode', {
            meetingId,
            error: error.message,
            note: 'ACS Calling SDK requires browser APIs - this is expected in Node.js',
          });
        }
      } else {
        logger.info('Bot initialized in text-only mode (ACS not configured or not available)', {
          meetingId,
          hasJoinUrl: !!joinUrl,
          hasACSService: !!ACSCallingService,
          hasACSConfig: !!process.env.ACS_CONNECTION_STRING,
        });
      }

      logger.info('Bot fully initialized for meeting', { meetingId });

    } catch (error) {
      logger.error('Error handling bot join:', error);
      // Try to continue with text-only mode
      try {
        await this.initializeRealtimeSession(meetingId);
      } catch (fallbackError) {
        logger.error('Failed to initialize fallback text-only mode:', fallbackError);
      }
    }
  }

  /**
   * Handle participant joining the meeting
   * @param {Object} context - Turn context
   * @param {string} meetingId - Meeting ID
   * @param {Object} member - Member who joined
   */
  async handleParticipantJoined(context, meetingId, member) {
    try {
      const state = this.meetingStates.get(meetingId) || {};
      state.participantCount = (state.participantCount || 0) + 1;
      this.meetingStates.set(meetingId, state);

      logger.info('Participant joined, starting introduction', {
        meetingId,
        participant: member.name,
        totalParticipants: state.participantCount,
      });

      // Greet the participant
      await context.sendActivity(
        MessageFactory.text(`Welcome ${member.name || 'to the interview'}!`)
      );

      // Start interview introduction if not already given
      if (!state.introductionGiven) {
        await this.startInterviewIntroduction(context, meetingId);
        state.introductionGiven = true;
        state.status = 'introduction_started';
        this.meetingStates.set(meetingId, state);
      }

    } catch (error) {
      logger.error('Error handling participant join:', error);
    }
  }

  /**
   * Start interview introduction (bot introduces itself and asks for candidate intro)
   * @param {Object} context - Turn context
   * @param {string} meetingId - Meeting ID
   */
  async startInterviewIntroduction(context, meetingId) {
    try {
      logger.info('Starting interview introduction', { meetingId });

      // Send text introduction first
      const introMessage = `Hello! I'm your AI interview assistant. I'm here to conduct your interview today.

Could you please introduce yourself? Tell me your name and a bit about your background.`;

      await context.sendActivity(MessageFactory.text(introMessage));

      // Trigger voice introduction via Realtime API
      const realtimeService = this.realtimeSessions.get(meetingId);
      if (realtimeService && realtimeService.isConnected) {
        logger.info('Triggering voice introduction');
        realtimeService.startIntroduction();
      } else {
        logger.warn('Realtime service not available for voice introduction');
      }

    } catch (error) {
      logger.error('Error starting introduction:', error);
    }
  }

  /**
   * Initialize ACS calling service for Teams audio
   * @param {string} meetingId - Meeting ID
   * @param {string} joinUrl - Teams meeting join URL
   */
  async initializeACSCalling(meetingId, joinUrl) {
    if (!ACSCallingService) {
      throw new Error('ACS Calling Service not available (browser-only SDK)');
    }

    let acsService = null;
    try {
      logger.info('Initializing ACS calling service for meeting:', meetingId);

      acsService = new ACSCallingService(meetingId);
      
      // Set up error handlers
      acsService.stateManager.on('error', (error) => {
        logger.error('ACS calling service error:', {
          meetingId,
          error: error.message,
          stack: error.stack,
        });
        this.handleAudioError(meetingId, error);
      });

      // Join the Teams meeting via ACS
      await acsService.joinMeeting(joinUrl, 'AI Interviewer');

      this.acsCallingServices.set(meetingId, acsService);
      logger.info('ACS calling service initialized for meeting:', meetingId);

    } catch (error) {
      logger.error('Failed to initialize ACS calling service:', {
        meetingId,
        error: error.message,
        stack: error.stack,
      });
      
      // Cleanup if partially initialized
      if (acsService) {
        try {
          await acsService.leaveMeeting();
        } catch (cleanupError) {
          logger.error('Error cleaning up failed ACS service:', cleanupError);
        }
      }
      
      // Don't throw - allow fallback to text-only mode
    }
  }

  /**
   * Initialize OpenAI Realtime API session for voice
   * @param {string} meetingId - Meeting ID
   */
  async initializeRealtimeSession(meetingId) {
    let realtimeService = null;
    try {
      logger.info('Initializing Realtime API session for meeting:', meetingId);

      realtimeService = new RealtimeService();
      
      // Set up callbacks for audio/transcription
      // Audio response will be handled by connectAudioStreams
      realtimeService.onAudioResponseCallback((audioBuffer) => {
        // This will be connected to audio bridge in connectAudioStreams
        logger.debug('Received audio response from OpenAI', { 
          meetingId,
          audioSize: audioBuffer.length 
        });
      });

      realtimeService.onTranscriptionCallback((transcript) => {
        logger.info('Candidate said:', { meetingId, transcript });
        // Store transcript for evaluation
        const state = this.meetingStates.get(meetingId);
        if (state) {
          if (!state.transcripts) {
            state.transcripts = [];
          }
          state.transcripts.push({
            text: transcript,
            timestamp: new Date().toISOString(),
          });
          this.meetingStates.set(meetingId, state);
        }
      });

      // Connect to Realtime API with retry logic
      let connected = false;
      let retryCount = 0;
      const maxRetries = 3;

      while (!connected && retryCount < maxRetries) {
        try {
          await realtimeService.connect({
            voice: 'alloy',
            instructions: this.getInterviewInstructions(),
          });
          connected = true;
        } catch (connectError) {
          retryCount++;
          logger.warn('Failed to connect to Realtime API, retrying...', {
            meetingId,
            attempt: retryCount,
            maxRetries,
            error: connectError.message,
          });

          if (retryCount >= maxRetries) {
            throw new Error(`Failed to connect to Realtime API after ${maxRetries} attempts: ${connectError.message}`);
          }

          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }

      this.realtimeSessions.set(meetingId, realtimeService);
      logger.info('Realtime session initialized for meeting:', meetingId);

    } catch (error) {
      logger.error('Failed to initialize Realtime session:', {
        meetingId,
        error: error.message,
        stack: error.stack,
      });
      
      // Cleanup if partially initialized
      if (realtimeService) {
        try {
          realtimeService.disconnect();
        } catch (cleanupError) {
          logger.error('Error cleaning up failed Realtime service:', cleanupError);
        }
      }
      
      throw error;
    }
  }

  /**
   * Connect audio streams between Teams and OpenAI
   * @param {string} meetingId - Meeting ID
   */
  async connectAudioStreams(meetingId) {
    try {
      logger.info('Connecting audio streams for meeting:', meetingId);

      const realtimeService = this.realtimeSessions.get(meetingId);
      const acsService = this.acsCallingServices.get(meetingId);

      if (!realtimeService) {
        logger.warn('Realtime service not available for audio streaming', { meetingId });
        return;
      }

      // Create audio bridge if ACS is available
      let audioBridge = null;
      if (acsService && AudioBridge) {
        try {
          audioBridge = new AudioBridge(meetingId);
          audioBridge.start();
          this.audioBridges.set(meetingId, audioBridge);
          logger.info('Audio bridge created and started', { meetingId });
        } catch (error) {
          logger.warn('Failed to create audio bridge', {
            meetingId,
            error: error.message,
          });
        }
      }

      // Connect Teams → OpenAI audio stream
      if (acsService && audioBridge) {
        acsService.onAudioReceived(async (audioChunk) => {
          try {
            // Convert Teams audio to OpenAI format and stream
            const pcm16Audio = await audioBridge.streamToOpenAI(audioChunk);
            if (pcm16Audio && realtimeService.isConnected) {
              realtimeService.sendAudio(pcm16Audio);
              // Commit audio after sending
              realtimeService.commitAudio();
            }
          } catch (error) {
            logger.error('Error streaming Teams audio to OpenAI:', error);
          }
        });
        logger.info('Teams → OpenAI audio stream connected', { meetingId });
      }

      // Connect OpenAI → Teams audio stream
      if (acsService && audioBridge) {
        realtimeService.onAudioResponseCallback(async (audioBuffer) => {
          try {
            // Convert OpenAI audio to Teams format and send
            const teamsAudio = await audioBridge.streamToTeams(audioBuffer);
            if (teamsAudio) {
              await acsService.sendAudio(teamsAudio);
            }
          } catch (error) {
            logger.error('Error streaming OpenAI audio to Teams:', error);
          }
        });
        logger.info('OpenAI → Teams audio stream connected', { meetingId });
      } else {
        // Fallback: log audio but don't send to Teams
        realtimeService.onAudioResponseCallback((audioBuffer) => {
          logger.debug('OpenAI audio received (no Teams connection)', {
            meetingId,
            audioSize: audioBuffer.length,
          });
        });
      }

      logger.info('Audio streams connected successfully', { meetingId });

    } catch (error) {
      logger.error('Failed to connect audio streams:', {
        meetingId,
        error: error.message,
        stack: error.stack,
      });
      // Don't throw - allow text-only mode to continue
      // Notify user about audio limitations
      this.handleAudioError(meetingId, error);
    }
  }

  /**
   * Handle audio errors gracefully
   * @param {string} meetingId - Meeting ID
   * @param {Error} error - Error object
   */
  async handleAudioError(meetingId, error) {
    try {
      logger.warn('Handling audio error, falling back to text-only mode', {
        meetingId,
        error: error.message,
      });

      const state = this.meetingStates.get(meetingId);
      if (state) {
        state.audioError = {
          message: error.message,
          timestamp: new Date().toISOString(),
        };
        state.audioEnabled = false;
        this.meetingStates.set(meetingId, state);
      }

      // Try to reconnect audio after a delay
      setTimeout(async () => {
        try {
          const acsService = this.acsCallingServices.get(meetingId);
          const audioBridge = this.audioBridges.get(meetingId);
          
          if (acsService && audioBridge) {
            logger.info('Attempting to reconnect audio streams', { meetingId });
            await this.connectAudioStreams(meetingId);
          }
        } catch (reconnectError) {
          logger.error('Failed to reconnect audio streams:', reconnectError);
        }
      }, 5000); // Retry after 5 seconds

    } catch (handlerError) {
      logger.error('Error in audio error handler:', handlerError);
    }
  }

  /**
   * Get interview instructions for Realtime API
   * @returns {string}
   */
  getInterviewInstructions() {
    return `You are an AI interview assistant conducting a professional technical interview.

When you first speak:
1. Introduce yourself: "Hello! I'm your AI interview assistant. I'm here to conduct your interview today."
2. Ask for introduction: "Could you please introduce yourself? Tell me your name and a bit about your background."
3. Listen carefully to their response.
4. Acknowledge warmly: "Thank you for the introduction! It's great to meet you."
5. Transition: "Now let's begin the interview. I'll ask you some questions based on the job description."

During the interview:
- Ask clear, concise technical questions
- Listen actively and let them finish
- Provide thoughtful follow-up questions
- Be professional but friendly
- Allow time to think (don't rush)
- Acknowledge good answers positively

Keep responses natural and conversational. Speak clearly at a moderate pace.`;
  }

  /**
   * Handle meeting start event
   * @param {Object} context - Turn context
   * @param {string} meetingId - Meeting ID
   */
  async handleMeetingStart(context, meetingId) {
    try {
      logger.info('Handling meeting start', { meetingId });
      
      const state = this.meetingStates.get(meetingId) || {};
      state.status = 'meeting_started';
      state.meetingStartTime = new Date();
      this.meetingStates.set(meetingId, state);

      await context.sendActivity(
        MessageFactory.text('Interview session started. I am ready to begin.')
      );

    } catch (error) {
      logger.error('Error handling meeting start:', error);
    }
  }

  /**
   * Handle meeting end event
   * @param {Object} context - Turn context
   * @param {string} meetingId - Meeting ID
   */
  async handleMeetingEnd(context, meetingId) {
    try {
      logger.info('Handling meeting end', { meetingId });

      // Disconnect ACS calling service (if available)
      if (ACSCallingService) {
        const acsService = this.acsCallingServices.get(meetingId);
        if (acsService) {
          try {
            await acsService.leaveMeeting();
          } catch (error) {
            logger.error('Error leaving ACS meeting:', error);
          }
          this.acsCallingServices.delete(meetingId);
        }
      }

      // Stop and cleanup audio bridge (if available)
      if (AudioBridge) {
        const audioBridge = this.audioBridges.get(meetingId);
        if (audioBridge) {
          audioBridge.stop();
          this.audioBridges.delete(meetingId);
        }
      }

      // Disconnect Realtime API
      const realtimeService = this.realtimeSessions.get(meetingId);
      if (realtimeService) {
        realtimeService.disconnect();
        this.realtimeSessions.delete(meetingId);
      }

      // Clean up meeting state
      this.meetingStates.delete(meetingId);

      await context.sendActivity(
        MessageFactory.text('Interview session ended. Thank you for participating!')
      );

      logger.info('Meeting cleanup completed', { meetingId });

    } catch (error) {
      logger.error('Error handling meeting end:', error);
    }
  }
}

module.exports = InterviewBot;

