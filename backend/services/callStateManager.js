const logger = require('../utils/logger');

/**
 * Call state constants
 */
const CallStates = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  AUDIO_ACTIVE: 'audio_active',
  DISCONNECTING: 'disconnecting',
  ERROR: 'error',
};

/**
 * Call State Manager
 * Manages call lifecycle and state transitions for Teams meetings
 */
class CallStateManager {
  constructor(meetingId) {
    this.meetingId = meetingId;
    this.state = CallStates.IDLE;
    this.stateHistory = [];
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 1000; // Start with 1 second
    this.maxRetryDelay = 30000; // Max 30 seconds
    this.stateChangeCallbacks = new Map();
    this.errorCallbacks = new Map();
    
    logger.info('CallStateManager created', { meetingId });
  }

  /**
   * Transition to a new state
   * @param {string} newState - New state to transition to
   * @param {Object} metadata - Optional metadata about the state change
   */
  transitionTo(newState, metadata = {}) {
    if (!Object.values(CallStates).includes(newState)) {
      logger.error('Invalid state transition', { 
        meetingId: this.meetingId, 
        invalidState: newState 
      });
      return;
    }

    const previousState = this.state;
    this.state = newState;
    
    const stateChange = {
      from: previousState,
      to: newState,
      timestamp: new Date().toISOString(),
      metadata,
    };

    this.stateHistory.push(stateChange);
    
    logger.info('Call state transition', {
      meetingId: this.meetingId,
      ...stateChange,
    });

    // Notify callbacks
    this.notifyStateChange(stateChange);
  }

  /**
   * Get current state
   * @returns {string} Current state
   */
  getState() {
    return this.state;
  }

  /**
   * Check if in a specific state
   * @param {string} state - State to check
   * @returns {boolean}
   */
  isInState(state) {
    return this.state === state;
  }

  /**
   * Check if call is active (connected or audio active)
   * @returns {boolean}
   */
  isActive() {
    return this.state === CallStates.CONNECTED || 
           this.state === CallStates.AUDIO_ACTIVE;
  }

  /**
   * Check if call is in error state
   * @returns {boolean}
   */
  isError() {
    return this.state === CallStates.ERROR;
  }

  /**
   * Register callback for state changes
   * @param {string} event - Event name ('stateChange' or 'error')
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (event === 'stateChange') {
      if (!this.stateChangeCallbacks.has(this.meetingId)) {
        this.stateChangeCallbacks.set(this.meetingId, []);
      }
      this.stateChangeCallbacks.get(this.meetingId).push(callback);
    } else if (event === 'error') {
      if (!this.errorCallbacks.has(this.meetingId)) {
        this.errorCallbacks.set(this.meetingId, []);
      }
      this.errorCallbacks.get(this.meetingId).push(callback);
    }
  }

  /**
   * Notify state change callbacks
   * @param {Object} stateChange - State change object
   */
  notifyStateChange(stateChange) {
    const callbacks = this.stateChangeCallbacks.get(this.meetingId) || [];
    callbacks.forEach(callback => {
      try {
        callback(stateChange);
      } catch (error) {
        logger.error('Error in state change callback:', error);
      }
    });
  }

  /**
   * Notify error callbacks
   * @param {Error} error - Error object
   */
  notifyError(error) {
    this.transitionTo(CallStates.ERROR, { error: error.message });
    
    const callbacks = this.errorCallbacks.get(this.meetingId) || [];
    callbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        logger.error('Error in error callback:', callbackError);
      }
    });
  }

  /**
   * Calculate retry delay with exponential backoff
   * @returns {number} Delay in milliseconds
   */
  getRetryDelay() {
    const delay = Math.min(
      this.retryDelay * Math.pow(2, this.retryCount),
      this.maxRetryDelay
    );
    return delay;
  }

  /**
   * Increment retry count
   * @returns {boolean} True if retries are still available
   */
  incrementRetry() {
    this.retryCount++;
    return this.retryCount < this.maxRetries;
  }

  /**
   * Reset retry count
   */
  resetRetry() {
    this.retryCount = 0;
    this.retryDelay = 1000;
  }

  /**
   * Check if should retry
   * @returns {boolean}
   */
  shouldRetry() {
    return this.retryCount < this.maxRetries;
  }

  /**
   * Get retry information
   * @returns {Object} Retry info
   */
  getRetryInfo() {
    return {
      retryCount: this.retryCount,
      maxRetries: this.maxRetries,
      nextRetryDelay: this.getRetryDelay(),
      shouldRetry: this.shouldRetry(),
    };
  }

  /**
   * Get state history
   * @returns {Array} State history
   */
  getStateHistory() {
    return [...this.stateHistory];
  }

  /**
   * Get state summary
   * @returns {Object} State summary
   */
  getSummary() {
    return {
      meetingId: this.meetingId,
      currentState: this.state,
      isActive: this.isActive(),
      isError: this.isError(),
      retryInfo: this.getRetryInfo(),
      stateHistoryLength: this.stateHistory.length,
      lastStateChange: this.stateHistory[this.stateHistory.length - 1] || null,
    };
  }

  /**
   * Reset state manager
   */
  reset() {
    this.state = CallStates.IDLE;
    this.stateHistory = [];
    this.retryCount = 0;
    this.retryDelay = 1000;
    logger.info('CallStateManager reset', { meetingId: this.meetingId });
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stateChangeCallbacks.delete(this.meetingId);
    this.errorCallbacks.delete(this.meetingId);
    this.reset();
    logger.info('CallStateManager cleaned up', { meetingId: this.meetingId });
  }
}

module.exports = {
  CallStateManager,
  CallStates,
};

