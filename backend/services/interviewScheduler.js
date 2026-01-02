const logger = require('../utils/logger');
const graphService = require('./graphService');
const { query } = require('../config/database');

/**
 * Interview Scheduler Service
 * Handles interview scheduling, Teams meeting creation, and n8n workflow triggers
 */
class InterviewScheduler {
  /**
   * Schedule an interview
   * @param {Object} interviewData - Interview details
   * @param {string} interviewData.candidateId - Candidate UUID
   * @param {string} interviewData.jdId - Job description UUID
   * @param {Date} interviewData.scheduledDate - Interview date
   * @param {string} interviewData.scheduledTime - Interview time
   * @param {string} interviewData.timezone - Timezone (default: UTC)
   * @param {string} interviewData.candidateEmail - Candidate email address
   * @returns {Promise<Object>} Scheduled interview details
   */
  async scheduleInterview(interviewData) {
    try {
      logger.info('Scheduling interview', interviewData);

      // Validate required fields
      if (!interviewData.candidateId || !interviewData.jdId) {
        throw new Error('candidateId and jdId are required');
      }

      // Calculate meeting start and end times
      const scheduledDateTime = new Date(`${interviewData.scheduledDate}T${interviewData.scheduledTime}`);
      const endDateTime = new Date(scheduledDateTime);
      endDateTime.setHours(endDateTime.getHours() + 1); // 1 hour interview

      // Get candidate and JD details for meeting subject
      const candidateResult = await query(
        'SELECT name, email FROM candidates WHERE id = $1',
        [interviewData.candidateId]
      );
      const candidate = candidateResult.rows[0];

      const jdResult = await query(
        'SELECT position FROM job_descriptions WHERE id = $1',
        [interviewData.jdId]
      );
      const jd = jdResult.rows[0];

      const meetingSubject = `AI Interview - ${jd?.position || 'Technical Interview'} - ${candidate?.name || 'Candidate'}`;

      // Create Teams meeting
      const meeting = await this.createTeamsMeeting({
        subject: meetingSubject,
        startDateTime: scheduledDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        attendees: interviewData.candidateEmail ? [interviewData.candidateEmail] : [],
      });

      // Create interview record in PostgreSQL
      const interviewResult = await query(
        `INSERT INTO interviews (
          candidate_id, jd_id, scheduled_date, scheduled_time, timezone,
          meeting_link, meeting_id, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          interviewData.candidateId,
          interviewData.jdId,
          scheduledDateTime,
          interviewData.scheduledTime,
          interviewData.timezone || 'UTC',
          meeting.joinUrl,
          meeting.meetingId,
          'scheduled',
        ]
      );

      const interview = interviewResult.rows[0];

      logger.info('Interview scheduled successfully', {
        interviewId: interview.id,
        meetingId: meeting.meetingId,
      });

      // TODO: Trigger n8n workflow for email notification
      // await this.sendInterviewEmail({...});

      return {
        interview,
        meeting,
      };
    } catch (error) {
      logger.error('Failed to schedule interview:', error);
      throw error;
    }
  }

  /**
   * Create a Teams meeting
   * @param {Object} meetingData - Meeting details
   * @param {string} meetingData.subject - Meeting subject
   * @param {Date} meetingData.startDateTime - Meeting start time (ISO string)
   * @param {Date} meetingData.endDateTime - Meeting end time (ISO string)
   * @param {Array<string>} meetingData.attendees - Attendee email addresses
   * @returns {Promise<Object>} Teams meeting details with join link
   */
  async createTeamsMeeting(meetingData) {
    try {
      logger.info('Creating Teams meeting', meetingData);

      // Validate required fields
      if (!meetingData.startDateTime || !meetingData.endDateTime) {
        throw new Error('startDateTime and endDateTime are required');
      }

      // Create meeting via Graph API
      const meeting = await graphService.createOnlineMeeting({
        subject: meetingData.subject || 'AI Interview',
        startDateTime: meetingData.startDateTime,
        endDateTime: meetingData.endDateTime,
        attendees: meetingData.attendees || [],
      });

      logger.info('Teams meeting created successfully', {
        meetingId: meeting.meetingId,
        joinUrl: meeting.joinUrl,
      });

      return meeting;
    } catch (error) {
      logger.error('Failed to create Teams meeting:', error);
      throw error;
    }
  }

  /**
   * Trigger n8n workflow for interview scheduling
   * @param {Object} workflowData - Workflow data
   * @param {string} workflowData.webhookUrl - n8n webhook URL
   * @param {Object} workflowData.payload - Payload to send to n8n
   * @returns {Promise<Object>} n8n workflow response
   */
  async triggerN8nWorkflow(workflowData) {
    logger.info('Triggering n8n workflow', workflowData);
    // TODO: Implement n8n workflow trigger
    // 1. Send POST request to n8n webhook
    // 2. Handle response
    // 3. Log workflow execution
    // 4. Return workflow response
    throw new Error('Not implemented');
  }

  /**
   * Send interview email notification via n8n
   * @param {Object} emailData - Email details
   * @param {string} emailData.candidateEmail - Candidate email
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.body - Email body
   * @param {string} emailData.meetingLink - Teams meeting link
   * @returns {Promise<Object>} Email send confirmation
   */
  async sendInterviewEmail(emailData) {
    logger.info('Sending interview email', emailData);
    // TODO: Implement email sending via n8n
    // 1. Prepare email payload
    // 2. Trigger n8n email webhook
    // 3. Return confirmation
    throw new Error('Not implemented');
  }
}

// Export singleton instance
module.exports = new InterviewScheduler();

