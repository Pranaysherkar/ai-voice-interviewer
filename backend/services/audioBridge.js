const logger = require('../utils/logger');
const { AUDIO_CONFIG } = require('../config/acs');

/**
 * Circular buffer for audio streaming
 */
class CircularBuffer {
  constructor(size) {
    this.buffer = Buffer.alloc(size);
    this.size = size;
    this.writeIndex = 0;
    this.readIndex = 0;
    this.count = 0;
  }

  write(data) {
    const dataLength = data.length;
    if (dataLength > this.size - this.count) {
      logger.warn('Circular buffer overflow, dropping oldest data');
      // Advance read index to make room
      this.readIndex = (this.readIndex + dataLength) % this.size;
      this.count = Math.max(0, this.count - dataLength);
    }

    for (let i = 0; i < dataLength; i++) {
      this.buffer[this.writeIndex] = data[i];
      this.writeIndex = (this.writeIndex + 1) % this.size;
      this.count++;
    }
  }

  read(length) {
    if (this.count < length) {
      return null; // Not enough data
    }

    const result = Buffer.alloc(length);
    for (let i = 0; i < length; i++) {
      result[i] = this.buffer[this.readIndex];
      this.readIndex = (this.readIndex + 1) % this.size;
      this.count--;
    }

    return result;
  }

  available() {
    return this.count;
  }

  clear() {
    this.writeIndex = 0;
    this.readIndex = 0;
    this.count = 0;
  }
}

/**
 * Audio Bridge Service
 * Handles bidirectional audio streaming between Teams and OpenAI Realtime API
 * Manages format conversion and buffer management
 */
class AudioBridge {
  constructor(meetingId) {
    this.meetingId = meetingId;
    this.isActive = false;
    
    // Audio buffers for streaming
    this.inputBuffer = new CircularBuffer(48000); // 1 second at 24kHz
    this.outputBuffer = new CircularBuffer(48000);
    
    // Audio quality metrics
    this.metrics = {
      inputPackets: 0,
      outputPackets: 0,
      droppedPackets: 0,
      latency: 0,
      startTime: null,
    };

    logger.info('AudioBridge created', { meetingId });
  }

  /**
   * Start audio bridge
   */
  start() {
    if (this.isActive) {
      logger.warn('AudioBridge already active', { meetingId: this.meetingId });
      return;
    }

    this.isActive = true;
    this.metrics.startTime = Date.now();
    logger.info('AudioBridge started', { meetingId: this.meetingId });
  }

  /**
   * Stop audio bridge
   */
  stop() {
    if (!this.isActive) {
      return;
    }

    this.isActive = false;
    this.inputBuffer.clear();
    this.outputBuffer.clear();
    
    const duration = Date.now() - this.metrics.startTime;
    logger.info('AudioBridge stopped', {
      meetingId: this.meetingId,
      duration,
      metrics: this.metrics,
    });
  }

  /**
   * Convert Teams audio format to OpenAI PCM16 format
   * Teams typically uses Opus, G.711, or G.722
   * OpenAI requires: PCM16, 24kHz, mono, 16-bit
   * 
   * @param {Buffer} audioChunk - Raw audio from Teams
   * @returns {Promise<Buffer>} PCM16 audio buffer
   */
  async convertTeamsToOpenAI(audioChunk) {
    if (!this.isActive) {
      return null;
    }

    try {
      // For now, assume audio is already in a compatible format or needs minimal processing
      // In production, you would use prism-media or similar to decode Opus/G.711
      // and resample to 24kHz
      
      // If audio is already PCM16, we may need to resample
      // This is a simplified version - production should use proper audio processing
      let processedAudio = audioChunk;

      // Ensure mono channel (if stereo, convert to mono)
      // Ensure 16-bit depth
      // Resample to 24kHz if needed
      
      // For now, we'll assume Teams provides audio in a format that can be converted
      // The actual conversion would require:
      // 1. Decode Opus/G.711 using prism-media
      // 2. Resample to 24kHz using a resampling library
      // 3. Convert to mono if stereo
      // 4. Ensure 16-bit depth

      this.metrics.inputPackets++;
      return processedAudio;
    } catch (error) {
      logger.error('Error converting Teams audio to OpenAI format:', error);
      this.metrics.droppedPackets++;
      return null;
    }
  }

  /**
   * Convert OpenAI PCM16 format to Teams audio format
   * OpenAI provides: PCM16, 24kHz, mono, 16-bit
   * Teams expects: Opus, G.711, or G.722
   * 
   * @param {Buffer} audioChunk - PCM16 audio from OpenAI
   * @returns {Promise<Buffer>} Teams-compatible audio buffer
   */
  async convertOpenAIToTeams(audioChunk) {
    if (!this.isActive) {
      return null;
    }

    try {
      // OpenAI provides PCM16 at 24kHz
      // Teams may need different format (Opus, G.711, etc.)
      // This is a simplified version - production should use proper audio processing
      
      // For now, we'll assume Teams can accept PCM16 or we convert it
      // The actual conversion would require:
      // 1. Resample if Teams needs different sample rate
      // 2. Encode to Opus/G.711 using prism-media
      // 3. Ensure proper channel configuration

      let processedAudio = audioChunk;

      this.metrics.outputPackets++;
      return processedAudio;
    } catch (error) {
      logger.error('Error converting OpenAI audio to Teams format:', error);
      this.metrics.droppedPackets++;
      return null;
    }
  }

  /**
   * Stream Teams audio to OpenAI
   * @param {Buffer} audioChunk - Audio chunk from Teams
   * @returns {Promise<Buffer|null>} Converted PCM16 audio or null if not ready
   */
  async streamToOpenAI(audioChunk) {
    if (!this.isActive || !audioChunk) {
      return null;
    }

    try {
      // Convert format
      const pcm16Audio = await this.convertTeamsToOpenAI(audioChunk);
      
      if (!pcm16Audio) {
        return null;
      }

      // Buffer for smooth streaming
      this.inputBuffer.write(pcm16Audio);
      
      // Return frame-sized chunks (20ms = 480 samples at 24kHz)
      const frameSize = AUDIO_CONFIG.frameSize * 2; // 2 bytes per sample (16-bit)
      if (this.inputBuffer.available() >= frameSize) {
        return this.inputBuffer.read(frameSize);
      }

      return null;
    } catch (error) {
      logger.error('Error streaming Teams audio to OpenAI:', error);
      return null;
    }
  }

  /**
   * Stream OpenAI audio to Teams
   * @param {Buffer} audioChunk - PCM16 audio from OpenAI
   * @returns {Promise<Buffer|null>} Converted Teams audio or null if not ready
   */
  async streamToTeams(audioChunk) {
    if (!this.isActive || !audioChunk) {
      return null;
    }

    try {
      // Buffer for smooth streaming
      this.outputBuffer.write(audioChunk);
      
      // Convert format
      const frameSize = AUDIO_CONFIG.frameSize * 2; // 2 bytes per sample
      if (this.outputBuffer.available() >= frameSize) {
        const frame = this.outputBuffer.read(frameSize);
        const teamsAudio = await this.convertOpenAIToTeams(frame);
        return teamsAudio;
      }

      return null;
    } catch (error) {
      logger.error('Error streaming OpenAI audio to Teams:', error);
      return null;
    }
  }

  /**
   * Get audio quality metrics
   * @returns {Object} Metrics object
   */
  getMetrics() {
    return {
      ...this.metrics,
      isActive: this.isActive,
      inputBufferAvailable: this.inputBuffer.available(),
      outputBufferAvailable: this.outputBuffer.available(),
    };
  }

  /**
   * Reset metrics
   */
  resetMetrics() {
    this.metrics = {
      inputPackets: 0,
      outputPackets: 0,
      droppedPackets: 0,
      latency: 0,
      startTime: this.isActive ? Date.now() : null,
    };
  }
}

module.exports = AudioBridge;

