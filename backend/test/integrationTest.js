require('dotenv').config();
const logger = require('../utils/logger');
const InterviewBot = require('../services/interviewBot');
const { TurnContext } = require('botbuilder');

/**
 * Integration test for end-to-end audio interview flow
 * Note: This requires actual Azure and OpenAI credentials
 */
class IntegrationTest {
  constructor() {
    this.bot = new InterviewBot();
    this.testResults = [];
  }

  /**
   * Create mock Teams activity
   */
  createMockActivity(type, meetingId, joinUrl = null) {
    return {
      type: type,
      channelId: 'msteams',
      from: {
        id: 'test-user-123',
        name: 'Test Candidate',
      },
      recipient: {
        id: 'bot-id-123',
        name: 'AI Interviewer',
      },
      conversation: {
        id: meetingId,
      },
      channelData: {
        meeting: {
          id: meetingId,
          joinUrl: joinUrl || `https://teams.microsoft.com/l/meetup-join/${meetingId}`,
        },
      },
      serviceUrl: 'https://smba.trafficmanager.net/',
    };
  }

  /**
   * Create mock turn context
   */
  createMockContext(activity) {
    // Note: This is a simplified mock - real TurnContext is more complex
    return {
      activity: activity,
      sendActivity: async (message) => {
        console.log('Bot sent message:', message);
        return { id: 'msg-123' };
      },
    };
  }

  /**
   * Test bot joining meeting
   */
  async testBotJoin() {
    console.log('\n=== Test: Bot Joining Meeting ===\n');

    try {
      const meetingId = 'test-meeting-integration-001';
      const joinUrl = 'https://teams.microsoft.com/l/meetup-join/test-meeting';

      const activity = this.createMockActivity('membersAdded', meetingId, joinUrl);
      const context = this.createMockContext(activity);

      // Simulate bot joining
      activity.membersAdded = [{
        id: activity.recipient.id,
        name: activity.recipient.name,
      }];

      await this.bot.onMembersAdded(context, async () => {});

      console.log('✓ Bot join test completed');
      this.testResults.push({ test: 'botJoin', status: 'passed' });

    } catch (error) {
      console.error('✗ Bot join test failed:', error.message);
      this.testResults.push({ test: 'botJoin', status: 'failed', error: error.message });
    }
  }

  /**
   * Test participant joining
   */
  async testParticipantJoin() {
    console.log('\n=== Test: Participant Joining ===\n');

    try {
      const meetingId = 'test-meeting-integration-001';
      const activity = this.createMockActivity('membersAdded', meetingId);
      const context = this.createMockContext(activity);

      // Simulate participant joining
      activity.membersAdded = [{
        id: 'participant-123',
        name: 'Test Candidate',
      }];

      await this.bot.onMembersAdded(context, async () => {});

      console.log('✓ Participant join test completed');
      this.testResults.push({ test: 'participantJoin', status: 'passed' });

    } catch (error) {
      console.error('✗ Participant join test failed:', error.message);
      this.testResults.push({ test: 'participantJoin', status: 'failed', error: error.message });
    }
  }

  /**
   * Test audio stream connection (mock)
   */
  async testAudioStreamConnection() {
    console.log('\n=== Test: Audio Stream Connection ===\n');

    try {
      const meetingId = 'test-meeting-integration-001';
      
      // Check if services are initialized
      const hasRealtime = this.bot.realtimeSessions.has(meetingId);
      const hasACS = this.bot.acsCallingServices.has(meetingId);
      const hasBridge = this.bot.audioBridges.has(meetingId);

      console.log('Service status:', {
        realtimeService: hasRealtime ? 'initialized' : 'not initialized',
        acsService: hasACS ? 'initialized' : 'not initialized',
        audioBridge: hasBridge ? 'initialized' : 'not initialized',
      });

      if (hasRealtime || hasACS || hasBridge) {
        console.log('✓ Audio services initialized');
        this.testResults.push({ test: 'audioStreamConnection', status: 'passed' });
      } else {
        console.log('⚠ Audio services not initialized (may require actual credentials)');
        this.testResults.push({ test: 'audioStreamConnection', status: 'skipped' });
      }

    } catch (error) {
      console.error('✗ Audio stream connection test failed:', error.message);
      this.testResults.push({ test: 'audioStreamConnection', status: 'failed', error: error.message });
    }
  }

  /**
   * Run all integration tests
   */
  async runAllTests() {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Integration Test Suite');
    console.log('═══════════════════════════════════════════════════════════\n');

    await this.testBotJoin();
    await this.testParticipantJoin();
    await this.testAudioStreamConnection();

    // Print summary
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  Test Summary');
    console.log('═══════════════════════════════════════════════════════════\n');

    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const skipped = this.testResults.filter(r => r.status === 'skipped').length;

    console.log(`Total tests: ${this.testResults.length}`);
    console.log(`✓ Passed: ${passed}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`⚠ Skipped: ${skipped}\n`);

    this.testResults.forEach(result => {
      const icon = result.status === 'passed' ? '✓' : result.status === 'failed' ? '✗' : '⚠';
      console.log(`${icon} ${result.test}: ${result.status}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });

    console.log('\n═══════════════════════════════════════════════════════════\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }
}

// Run tests if executed directly
if (require.main === module) {
  const test = new IntegrationTest();
  test.runAllTests().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
}

module.exports = IntegrationTest;

