const logger = require('../utils/logger');
const { graphClient } = require('../config/graph');

/**
 * Microsoft Graph API Service
 * Handles Teams meeting creation and management
 */
class GraphService {
  /**
   * Get user object ID from email address
   * @param {string} email - User's email address
   * @returns {Promise<string>} User's object ID
   */
  async getUserObjectId(email) {
    if (!graphClient) {
      throw new Error('Microsoft Graph client not initialized');
    }

    try {
      const user = await graphClient.api(`/users/${email}`).select('id').get();
      return user.id;
    } catch (error) {
      logger.error(`Failed to get user object ID for ${email}:`, error.message);
      throw new Error(`User not found: ${email}. Please verify the email exists in Azure AD.`);
    }
  }

  /**
   * Create a Teams online meeting
   * @param {Object} meetingData - Meeting details
   * @param {string} meetingData.subject - Meeting subject
   * @param {Date} meetingData.startDateTime - Meeting start time (ISO string)
   * @param {Date} meetingData.endDateTime - Meeting end time (ISO string)
   * @param {Array<string>} meetingData.attendees - Array of attendee email addresses
   * @param {string} meetingData.userId - User ID (email or object ID, required for application permissions)
   * @returns {Promise<Object>} Teams meeting details with join link
   */
  async createOnlineMeeting(meetingData) {
    if (!graphClient) {
      throw new Error('Microsoft Graph client not initialized');
    }

    try {
      logger.info('Creating Teams online meeting', meetingData);

      // Get user object ID if email is provided
      let userId = meetingData.userId || 'me';
      
      // If userId looks like an email, get the object ID
      if (userId !== 'me' && userId.includes('@')) {
        try {
          logger.info(`Resolving user object ID for email: ${userId}`);
          userId = await this.getUserObjectId(userId);
          logger.info(`Resolved to object ID: ${userId}`);
        } catch (error) {
          logger.error('Failed to resolve user:', error.message);
          throw error;
        }
      }

      const meeting = {
        subject: meetingData.subject || 'AI Interview',
        startDateTime: meetingData.startDateTime,
        endDateTime: meetingData.endDateTime,
        participants: {
          attendees: meetingData.attendees?.map(email => ({
            upn: email,
            role: 'attendee',
          })) || [],
        },
      };

      // For application permissions, use /users/{userId}/onlineMeetings
      // For delegated permissions, use /me/onlineMeetings
      const endpoint = userId === 'me' 
        ? '/me/onlineMeetings' 
        : `/users/${userId}/onlineMeetings`;

      logger.info(`Using endpoint: ${endpoint}`);
      const result = await graphClient.api(endpoint).post(meeting);

      logger.info('Teams meeting created successfully', {
        meetingId: result.id,
        joinUrl: result.joinWebUrl,
      });

      return {
        meetingId: result.id,
        joinUrl: result.joinWebUrl,
        joinUrlExpirationDateTime: result.joinWebUrlExpirationDateTime,
        subject: result.subject,
        startDateTime: result.startDateTime,
        endDateTime: result.endDateTime,
      };
    } catch (error) {
      logger.error('Failed to create Teams meeting:', error);
      throw error;
    }
  }

  /**
   * Get meeting details by ID
   * @param {string} meetingId - Meeting ID
   * @returns {Promise<Object>} Meeting details
   */
  async getMeeting(meetingId) {
    if (!graphClient) {
      throw new Error('Microsoft Graph client not initialized');
    }

    try {
      const meeting = await graphClient.api(`/me/onlineMeetings/${meetingId}`).get();
      return meeting;
    } catch (error) {
      logger.error('Failed to get Teams meeting:', error);
      throw error;
    }
  }

  /**
   * Delete a Teams meeting
   * @param {string} meetingId - Meeting ID
   * @returns {Promise<void>}
   */
  async deleteMeeting(meetingId) {
    if (!graphClient) {
      throw new Error('Microsoft Graph client not initialized');
    }

    try {
      await graphClient.api(`/me/onlineMeetings/${meetingId}`).delete();
      logger.info('Teams meeting deleted successfully', { meetingId });
    } catch (error) {
      logger.error('Failed to delete Teams meeting:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new GraphService();

