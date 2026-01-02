const WebSocket = require('ws');
const logger = require('../utils/logger');
const { getEnv } = require('../utils/envValidator');

/**
 * OpenAI Realtime API Service
 * Handles voice-to-voice conversation using OpenAI's Realtime API
 * Supports both standard OpenAI and Azure OpenAI
 */
class RealtimeService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.sessionConfigured = false;
    this.pendingConfig = null;
    this.apiKey = getEnv('OPENAI_API_KEY', 'OpenAI API key');
    this.model = getEnv('INTERVIEW_MODEL', 'Interview model') || 'gpt-4o-mini-realtime-preview';
    
    // Azure OpenAI configuration
    this.azureEndpoint = getEnv('AZURE_OPENAI_ENDPOINT', 'Azure OpenAI endpoint');
    this.azureApiVersion = getEnv('AZURE_OPENAI_API_VERSION', 'Azure OpenAI API version') || '2024-02-15-preview';
    this.azureDeploymentName = getEnv('AZURE_OPENAI_DEPLOYMENT_NAME', 'Azure OpenAI deployment name');
    
    // Determine if using Azure OpenAI
    this.isAzure = !!this.azureEndpoint;
    
    if (this.isAzure) {
      logger.info('RealtimeService configured for Azure OpenAI', {
        endpoint: this.azureEndpoint,
        deploymentName: this.azureDeploymentName || this.model,
        apiVersion: this.azureApiVersion,
      });
    } else {
      logger.info('RealtimeService configured for standard OpenAI', {
        model: this.model,
      });
    }
  }

  /**
   * Get WebSocket URL for Realtime API
   * @returns {string} WebSocket URL
   */
  getWebSocketUrl() {
    if (this.isAzure) {
      // Azure OpenAI Realtime API format:
      // Note: Azure OpenAI Realtime API might not be available yet or use different format
      // Try different possible formats based on Azure OpenAI REST API patterns
      const endpoint = this.azureEndpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const deploymentName = this.azureDeploymentName || this.model;
      
      // Try format: wss://{endpoint}/openai/v1/realtime?model={deployment}&api-version={version}
      // This matches the pattern: /openai/v1/... used by other Azure OpenAI endpoints
      const url = `wss://${endpoint}/openai/v1/realtime?model=${deploymentName}&api-version=${this.azureApiVersion}`;
      
      logger.debug('Azure OpenAI WebSocket URL constructed', {
        endpoint,
        deploymentName,
        apiVersion: this.azureApiVersion,
        url: url.replace(/api-key=[^&]*/, 'api-key=***'),
      });
      
      logger.warn('Azure OpenAI Realtime API might not be available yet. If you get 404, consider using standard OpenAI.');
      
      return url;
    } else {
      // Standard OpenAI Realtime API format:
      // wss://api.openai.com/v1/realtime?model={model-name}
      return `wss://api.openai.com/v1/realtime?model=${this.model}`;
    }
  }

  /**
   * Get authentication headers for WebSocket connection
   * @returns {Object} Headers object
   */
  getAuthHeaders() {
    if (this.isAzure) {
      // Azure OpenAI uses api-key header
      return {
        'api-key': this.apiKey,
        'OpenAI-Beta': 'realtime=v1',
      };
    } else {
      // Standard OpenAI uses Bearer token
      return {
        'Authorization': `Bearer ${this.apiKey}`,
        'OpenAI-Beta': 'realtime=v1',
      };
    }
  }

  /**
   * Connect to OpenAI Realtime API
   * @param {Object} config - Configuration for the session
   * @returns {Promise<void>}
   */
  async connect(config = {}) {
    try {
      const url = this.getWebSocketUrl();
      const headers = this.getAuthHeaders();
      
      logger.info('Connecting to Realtime API...', {
        provider: this.isAzure ? 'Azure OpenAI' : 'Standard OpenAI',
        url: url.replace(this.apiKey, '***').replace(/api-key=[^&]*/, 'api-key=***'),
      });

      this.ws = new WebSocket(url, {
        headers: headers,
      });

      return new Promise((resolve, reject) => {
        let sessionConfigured = false;
        
        this.ws.on('open', () => {
          logger.info('Connected to Realtime API', {
            provider: this.isAzure ? 'Azure OpenAI' : 'Standard OpenAI',
          });
          this.isConnected = true;
          
          // Wait for session.created before configuring
          // The session will be configured when we receive session.created event
          resolve();
        });

        this.ws.on('error', (error) => {
          logger.error('Realtime API error:', error);
          this.isConnected = false;
          
          // Notify error callbacks if registered
          if (this.onError) {
            this.onError(error);
          }
          
          reject(error);
        });

        this.ws.on('close', (code, reason) => {
          logger.info('Realtime API connection closed', { 
            code, 
            reason: reason?.toString() 
          });
          this.isConnected = false;
          
          // Attempt reconnection if not intentionally closed
          if (code !== 1000) { // 1000 = normal closure
            logger.info('Attempting to reconnect to Realtime API...');
            this.reconnect();
          }
        });

        this.ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            this.handleMessage(message);
          } catch (error) {
            logger.error('Error parsing WebSocket message:', error);
          }
        });
      });
    } catch (error) {
      logger.error('Failed to connect to Realtime API:', error);
      throw error;
    }
  }

  /**
   * Configure Realtime API session
   * @param {Object} config - Session configuration
   */
  configureSession(config = {}) {
    // Store config if session not ready yet
    if (!this.isConnected) {
      this.pendingConfig = config;
      return;
    }

    const sessionConfig = {
      type: 'session.update',
      session: {
        modalities: ['text', 'audio'],
        voice: config.voice || 'alloy',
        instructions: config.instructions || this.getDefaultInstructions(),
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: {
          model: 'whisper-1',
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5,
          prefix_padding_ms: 300,
          silence_duration_ms: 500,
        },
      },
    };

    this.send(sessionConfig);
    logger.info('Realtime session configured');
  }

  /**
   * Get default instructions for the AI interviewer
   * @returns {string}
   */
  getDefaultInstructions() {
    return `You are an AI interview assistant conducting a professional technical interview.

When the meeting starts:
1. Introduce yourself: "Hello! I'm your AI interview assistant. I'm here to conduct your interview today."
2. Ask for candidate introduction: "Could you please introduce yourself? Tell me your name and a bit about your background."
3. Listen to their response carefully.
4. Acknowledge their introduction warmly.
5. Then say: "Great! Let's begin the interview. I'll ask you some questions based on the job description."

During the interview:
- Ask clear, concise questions
- Listen actively to responses
- Provide thoughtful follow-up questions
- Be professional but friendly
- Allow time for the candidate to think
- Acknowledge good answers positively

Keep your responses natural and conversational. Speak clearly and at a moderate pace.`;
  }

  /**
   * Send message to Realtime API
   * @param {Object} message - Message to send
   */
  send(message) {
    if (!this.isConnected || !this.ws) {
      logger.warn('Cannot send message: not connected to Realtime API');
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Send audio input to Realtime API
   * @param {Buffer} audioBuffer - Audio buffer (PCM16)
   */
  sendAudio(audioBuffer) {
    if (!this.isConnected) {
      logger.warn('Cannot send audio: not connected');
      return;
    }

    const base64Audio = audioBuffer.toString('base64');
    this.send({
      type: 'input_audio_buffer.append',
      audio: base64Audio,
    });
  }

  /**
   * Commit audio input (signal end of audio)
   */
  commitAudio() {
    this.send({
      type: 'input_audio_buffer.commit',
    });
  }

  /**
   * Send text message to trigger bot response
   * @param {string} text - Text message
   */
  sendText(text) {
    this.send({
      type: 'conversation.item.create',
      item: {
        type: 'message',
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: text,
          },
        ],
      },
    });

    // Trigger response
    this.send({
      type: 'response.create',
    });
  }

  /**
   * Trigger bot to start speaking (self-introduction)
   */
  startIntroduction() {
    logger.info('Starting bot introduction...');
    this.sendText('Please introduce yourself as the AI interview assistant and ask the candidate to introduce themselves.');
  }

  /**
   * Handle incoming messages from Realtime API
   * @param {Object} message - Received message
   */
  handleMessage(message) {
    switch (message.type) {
      case 'session.created':
        logger.info('Session created:', message.session.id);
        break;

      case 'session.updated':
        logger.info('Session updated');
        break;

      case 'conversation.item.created':
        logger.info('Conversation item created:', message.item.id);
        break;

      case 'response.audio.delta':
        // Audio response chunk received
        if (this.onAudioResponse) {
          const audioBuffer = Buffer.from(message.delta, 'base64');
          this.onAudioResponse(audioBuffer);
        }
        break;

      case 'response.audio.done':
        logger.info('Audio response complete');
        if (this.onAudioComplete) {
          this.onAudioComplete();
        }
        break;

      case 'response.text.delta':
        // Text response chunk (for logging)
        logger.debug('Text response:', message.delta);
        break;

      case 'response.done':
        logger.info('Response complete');
        break;

      case 'input_audio_buffer.speech_started':
        logger.info('User started speaking');
        if (this.onUserSpeechStart) {
          this.onUserSpeechStart();
        }
        break;

      case 'input_audio_buffer.speech_stopped':
        logger.info('User stopped speaking');
        if (this.onUserSpeechStop) {
          this.onUserSpeechStop();
        }
        break;

      case 'conversation.item.input_audio_transcription.completed':
        logger.info('Transcription:', message.transcript);
        if (this.onTranscription) {
          this.onTranscription(message.transcript);
        }
        break;

      case 'error':
        logger.error('Realtime API error:', message.error);
        break;

      default:
        logger.debug('Realtime API message:', message.type);
    }
  }

  /**
   * Set callback for audio response
   * @param {Function} callback - Callback function (receives audio buffer)
   */
  onAudioResponseCallback(callback) {
    this.onAudioResponse = callback;
  }

  /**
   * Set callback for audio complete
   * @param {Function} callback - Callback function
   */
  onAudioCompleteCallback(callback) {
    this.onAudioComplete = callback;
  }

  /**
   * Set callback for user speech start
   * @param {Function} callback - Callback function
   */
  onUserSpeechStartCallback(callback) {
    this.onUserSpeechStart = callback;
  }

  /**
   * Set callback for user speech stop
   * @param {Function} callback - Callback function
   */
  onUserSpeechStopCallback(callback) {
    this.onUserSpeechStop = callback;
  }

  /**
   * Set callback for transcription
   * @param {Function} callback - Callback function (receives transcript text)
   */
  onTranscriptionCallback(callback) {
    this.onTranscription = callback;
  }

  /**
   * Reconnect to Realtime API
   * @param {Object} config - Configuration for the session
   * @returns {Promise<void>}
   */
  async reconnect(config = {}) {
    try {
      // Wait before reconnecting (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts || 0), 30000);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      this.reconnectAttempts = (this.reconnectAttempts || 0) + 1;
      logger.info('Reconnecting to Realtime API', { 
        attempt: this.reconnectAttempts,
        provider: this.isAzure ? 'Azure OpenAI' : 'Standard OpenAI',
      });
      
      await this.connect(config);
      this.reconnectAttempts = 0; // Reset on successful connection
    } catch (error) {
      logger.error('Failed to reconnect to Realtime API:', error);
      
      // Retry up to 5 times
      if (this.reconnectAttempts < 5) {
        setTimeout(() => this.reconnect(config), 5000);
      } else {
        logger.error('Max reconnection attempts reached');
        if (this.onError) {
          this.onError(new Error('Max reconnection attempts reached'));
        }
      }
    }
  }

  /**
   * Set error callback
   * @param {Function} callback - Callback function
   */
  onErrorCallback(callback) {
    this.onError = callback;
  }

  /**
   * Disconnect from Realtime API
   */
  disconnect() {
    if (this.ws) {
      logger.info('Disconnecting from Realtime API...');
      // Use normal closure code to prevent auto-reconnect
      this.ws.close(1000, 'Intentional disconnect');
      this.ws = null;
      this.isConnected = false;
      this.reconnectAttempts = 0;
    }
  }
}

module.exports = RealtimeService;

