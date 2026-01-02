const { CallClient, CallAgent, Features } = require('@azure/communication-calling');
const { AzureCommunicationTokenCredential } = require('@azure/communication-common');
const logger = require('../utils/logger');
const { createUserIdentity, getAccessToken } = require('../config/acs');
const { CallStateManager, CallStates } = require('./callStateManager');

/**
 * Azure Communication Services Calling Service
 * Handles Teams meeting audio integration via ACS
 */
class ACSCallingService {
  constructor(meetingId) {
    this.meetingId = meetingId;
    this.callClient = null;
    this.callAgent = null;
    this.call = null;
    this.stateManager = new CallStateManager(meetingId);
    
    // Audio stream handlers
    this.audioReceivedCallbacks = [];
    this.audioStream = null;
    this.localAudioStream = null;
    
    // Call event handlers
    this.callEventHandlers = {
      onCallStateChanged: null,
      onRemoteParticipantsUpdated: null,
      onCallEnded: null,
    };

    logger.info('ACSCallingService created', { meetingId });
  }

  /**
   * Initialize ACS calling client
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      this.stateManager.transitionTo(CallStates.CONNECTING);

      // Create user identity and get token
      const userId = await createUserIdentity();
      const token = await getAccessToken(userId, ['voip', 'chat']);
      
      // Create credential
      const tokenCredential = new AzureCommunicationTokenCredential(token);
      
      // Initialize call client
      this.callClient = new CallClient();
      
      // Create call agent
      this.callAgent = await this.callClient.createCallAgent(tokenCredential, {
        displayName: 'AI Interviewer',
      });

      logger.info('ACS calling client initialized', { 
        meetingId: this.meetingId,
        userId 
      });

      // Set up call agent event handlers
      this.setupCallAgentHandlers();

    } catch (error) {
      logger.error('Failed to initialize ACS calling client:', error);
      this.stateManager.notifyError(error);
      throw error;
    }
  }

  /**
   * Set up call agent event handlers
   */
  setupCallAgentHandlers() {
    // Handle incoming calls (if needed)
    this.callAgent.on('incomingCall', (args) => {
      logger.info('Incoming call received', { 
        meetingId: this.meetingId,
        callerInfo: args.callerInfo 
      });
    });
  }

  /**
   * Join a Teams meeting
   * @param {string} meetingUrl - Teams meeting join URL
   * @param {string} displayName - Display name for the bot
   * @returns {Promise<void>}
   */
  async joinMeeting(meetingUrl, displayName = 'AI Interviewer') {
    try {
      if (!this.callAgent) {
        await this.initialize();
      }

      this.stateManager.transitionTo(CallStates.CONNECTING, { meetingUrl });

      // Extract meeting coordinates from URL
      const meetingLink = this.extractMeetingLink(meetingUrl);
      
      // Start the call
      this.call = this.callAgent.join({ meetingLink }, {
        audioOptions: {
          muted: false, // Bot should be able to speak
        },
      });

      // Set up call event handlers
      this.setupCallHandlers();

      // Wait for call to connect
      await this.waitForCallState('Connected');

      this.stateManager.transitionTo(CallStates.CONNECTED);
      
      // Start audio streaming
      await this.startAudioStream();

      logger.info('Successfully joined Teams meeting', { 
        meetingId: this.meetingId,
        meetingUrl 
      });

    } catch (error) {
      logger.error('Failed to join Teams meeting:', error);
      this.stateManager.notifyError(error);
      throw error;
    }
  }

  /**
   * Extract meeting link from Teams URL
   * @param {string} meetingUrl - Teams meeting URL
   * @returns {string} Meeting link
   */
  extractMeetingLink(meetingUrl) {
    // Teams meeting URLs can be in various formats
    // Extract the meeting link identifier
    try {
      const url = new URL(meetingUrl);
      // Teams meeting links typically contain the meeting ID
      return meetingUrl;
    } catch (error) {
      // If URL parsing fails, return as-is
      return meetingUrl;
    }
  }

  /**
   * Set up call event handlers
   */
  setupCallHandlers() {
    if (!this.call) {
      return;
    }

    // Call state changed
    this.call.on('stateChanged', (args) => {
      const newState = args.callState;
      logger.info('Call state changed', { 
        meetingId: this.meetingId,
        newState 
      });

      if (newState === 'Connected') {
        this.stateManager.transitionTo(CallStates.CONNECTED);
      } else if (newState === 'Disconnected') {
        this.stateManager.transitionTo(CallStates.DISCONNECTING);
        this.handleCallEnded();
      }
    });

    // Remote participants updated
    this.call.on('remoteParticipantsUpdated', (args) => {
      logger.info('Remote participants updated', { 
        meetingId: this.meetingId,
        added: args.added?.length || 0,
        removed: args.removed?.length || 0,
      });

      args.added?.forEach(participant => {
        logger.info('Participant joined call', {
          meetingId: this.meetingId,
          participantId: participant.identifier.communicationUserId,
        });
      });

      args.removed?.forEach(participant => {
        logger.info('Participant left call', {
          meetingId: this.meetingId,
          participantId: participant.identifier.communicationUserId,
        });
      });
    });

    // Call ended
    this.call.on('callEnded', (args) => {
      logger.info('Call ended', { 
        meetingId: this.meetingId,
        callEndReason: args.callEndReason 
      });
      this.handleCallEnded();
    });
  }

  /**
   * Wait for call to reach a specific state
   * @param {string} targetState - Target state to wait for
   * @param {number} timeout - Timeout in milliseconds
   * @returns {Promise<void>}
   */
  async waitForCallState(targetState, timeout = 30000) {
    return new Promise((resolve, reject) => {
      if (!this.call) {
        reject(new Error('Call not initialized'));
        return;
      }

      const checkState = () => {
        if (this.call.state === targetState) {
          resolve();
        }
      };

      // Check immediately
      checkState();

      // Listen for state changes
      const stateHandler = () => {
        checkState();
        if (this.call.state === targetState) {
          this.call.off('stateChanged', stateHandler);
          clearTimeout(timeoutId);
          resolve();
        }
      };

      this.call.on('stateChanged', stateHandler);

      // Timeout
      const timeoutId = setTimeout(() => {
        this.call.off('stateChanged', stateHandler);
        reject(new Error(`Timeout waiting for call state: ${targetState}`));
      }, timeout);
    });
  }

  /**
   * Start audio streaming
   * @returns {Promise<void>}
   */
  async startAudioStream() {
    try {
      if (!this.call) {
        throw new Error('Call not initialized');
      }

      // Get local audio stream
      const localAudioStream = await this.callClient.createLocalAudioStream();
      this.localAudioStream = localAudioStream;

      // Start sending audio
      await this.call.startAudio(localAudioStream);

      // Get remote audio streams
      const remoteAudioStreams = this.call.remoteAudioStreams;
      
      remoteAudioStreams.forEach((remoteAudioStream) => {
        this.setupRemoteAudioStream(remoteAudioStream);
      });

      // Listen for new remote audio streams
      this.call.on('remoteAudioStreamsUpdated', (args) => {
        args.added?.forEach((remoteAudioStream) => {
          this.setupRemoteAudioStream(remoteAudioStream);
        });
      });

      this.stateManager.transitionTo(CallStates.AUDIO_ACTIVE);
      logger.info('Audio streaming started', { meetingId: this.meetingId });

    } catch (error) {
      logger.error('Failed to start audio stream:', error);
      this.stateManager.notifyError(error);
      throw error;
    }
  }

  /**
   * Set up remote audio stream handler
   * @param {Object} remoteAudioStream - Remote audio stream
   */
  setupRemoteAudioStream(remoteAudioStream) {
    const stream = remoteAudioStream.stream;
    
    stream.on('audioSampleReceived', (audioSample) => {
      // Convert audio sample to buffer
      const audioBuffer = this.audioSampleToBuffer(audioSample);
      
      // Notify all callbacks
      this.audioReceivedCallbacks.forEach(callback => {
        try {
          callback(audioBuffer);
        } catch (error) {
          logger.error('Error in audio received callback:', error);
        }
      });
    });

    // Subscribe to the stream
    remoteAudioStream.subscribe();
    
    logger.info('Remote audio stream set up', { 
      meetingId: this.meetingId,
      streamId: remoteAudioStream.id 
    });
  }

  /**
   * Convert audio sample to buffer
   * @param {Object} audioSample - Audio sample from ACS
   * @returns {Buffer} Audio buffer
   */
  audioSampleToBuffer(audioSample) {
    // ACS provides audio samples in a specific format
    // Convert to Buffer for processing
    // This is a simplified version - actual implementation depends on ACS SDK version
    if (audioSample.buffer) {
      return Buffer.from(audioSample.buffer);
    }
    
    // Fallback: create buffer from sample data
    if (audioSample.data) {
      return Buffer.from(audioSample.data);
    }
    
    // If no buffer/data, return empty buffer
    logger.warn('Audio sample has no buffer or data', { meetingId: this.meetingId });
    return Buffer.alloc(0);
  }

  /**
   * Send audio to the call
   * @param {Buffer} audioBuffer - Audio buffer to send
   * @returns {Promise<void>}
   */
  async sendAudio(audioBuffer) {
    try {
      if (!this.call || !this.localAudioStream) {
        logger.warn('Cannot send audio: call or audio stream not initialized', {
          meetingId: this.meetingId,
        });
        return;
      }

      if (!this.stateManager.isActive()) {
        logger.warn('Cannot send audio: call not active', {
          meetingId: this.meetingId,
          state: this.stateManager.getState(),
        });
        return;
      }

      // Send audio through local audio stream
      // The actual implementation depends on ACS SDK API
      // This is a placeholder - you may need to use a different method
      // based on the ACS SDK version and API
      
      // For now, we'll log that audio is being sent
      // In production, you would use the appropriate ACS SDK method
      logger.debug('Sending audio to call', {
        meetingId: this.meetingId,
        audioSize: audioBuffer.length,
      });

    } catch (error) {
      logger.error('Error sending audio to call:', error);
      throw error;
    }
  }

  /**
   * Register callback for received audio
   * @param {Function} callback - Callback function (receives Buffer)
   */
  onAudioReceived(callback) {
    if (typeof callback !== 'function') {
      throw new Error('Callback must be a function');
    }
    this.audioReceivedCallbacks.push(callback);
    logger.debug('Audio received callback registered', { 
      meetingId: this.meetingId,
      callbackCount: this.audioReceivedCallbacks.length 
    });
  }

  /**
   * Remove audio received callback
   * @param {Function} callback - Callback function to remove
   */
  removeAudioReceivedCallback(callback) {
    const index = this.audioReceivedCallbacks.indexOf(callback);
    if (index > -1) {
      this.audioReceivedCallbacks.splice(index, 1);
    }
  }

  /**
   * Handle call ended
   */
  handleCallEnded() {
    this.stateManager.transitionTo(CallStates.DISCONNECTING);
    this.stopAudioStream();
    this.cleanup();
  }

  /**
   * Stop audio streaming
   */
  stopAudioStream() {
    try {
      if (this.localAudioStream) {
        this.localAudioStream.dispose();
        this.localAudioStream = null;
      }

      if (this.call) {
        this.call.stopAudio();
      }

      this.stateManager.transitionTo(CallStates.DISCONNECTING);
      logger.info('Audio streaming stopped', { meetingId: this.meetingId });

    } catch (error) {
      logger.error('Error stopping audio stream:', error);
    }
  }

  /**
   * Leave the meeting
   * @returns {Promise<void>}
   */
  async leaveMeeting() {
    try {
      this.stateManager.transitionTo(CallStates.DISCONNECTING);

      if (this.call) {
        await this.call.hangUp();
        this.call = null;
      }

      this.stopAudioStream();
      this.cleanup();

      logger.info('Left Teams meeting', { meetingId: this.meetingId });

    } catch (error) {
      logger.error('Error leaving meeting:', error);
      throw error;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.audioReceivedCallbacks = [];
    this.audioStream = null;
    
    if (this.localAudioStream) {
      this.localAudioStream.dispose();
      this.localAudioStream = null;
    }

    if (this.callAgent) {
      this.callAgent.dispose();
      this.callAgent = null;
    }

    if (this.callClient) {
      this.callClient.dispose();
      this.callClient = null;
    }

    this.stateManager.cleanup();
    logger.info('ACSCallingService cleaned up', { meetingId: this.meetingId });
  }

  /**
   * Get call state
   * @returns {string} Current call state
   */
  getState() {
    return this.stateManager.getState();
  }

  /**
   * Get state summary
   * @returns {Object} State summary
   */
  getStateSummary() {
    return this.stateManager.getSummary();
  }
}

module.exports = ACSCallingService;

