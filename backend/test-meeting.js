require('dotenv').config();
const graphService = require('./services/graphService');

async function testMeeting() {
  try {
    console.log('Creating Teams meeting...');
    
    const startTime = new Date();
    startTime.setHours(startTime.getHours() + 1); // 1 hour from now
    
    const endTime = new Date(startTime);
    endTime.setHours(endTime.getHours() + 1); // 1 hour duration

    // For application permissions, you need to specify a userId
    // userId can be: user's email (UPN) or user's object ID from Azure AD
    // Get from environment variable or use a test user email
    const userId = process.env.TEST_USER_EMAIL || process.env.MICROSOFT_USER_ID;
    
    if (!userId) {
      console.error('\n❌ Error: userId is required for application permissions.');
      console.error('Please set TEST_USER_EMAIL or MICROSOFT_USER_ID in .env file');
      console.error('Example: TEST_USER_EMAIL=your-email@rigvedtech.com');
      process.exit(1);
    }

    console.log(`Creating meeting for user: ${userId}`);

    const meeting = await graphService.createOnlineMeeting({
      subject: 'Test AI Interview Meeting',
      startDateTime: startTime.toISOString(),
      endDateTime: endTime.toISOString(),
      attendees: [], // Optional: add test email
      userId: userId // Required for application permissions
    });

    console.log('\n✅ Meeting created successfully!');
    console.log('Meeting ID:', meeting.meetingId);
    console.log('Join URL:', meeting.joinUrl);
    console.log('Subject:', meeting.subject);
    console.log('Start:', meeting.startDateTime);
    console.log('End:', meeting.endDateTime);
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Copy the Join URL above');
    console.log('2. Join the meeting in Teams');
    console.log('3. The bot will automatically join and initialize audio');
    console.log('4. Once a participant joins, the bot will start the interview\n');
    
    console.log('💡 TROUBLESHOOTING:');
    console.log('- If bot doesn\'t join: Check Azure Bot configuration');
    console.log('- If audio doesn\'t work: Check ACS_CONNECTION_STRING in .env');
    console.log('- If OpenAI errors: Check OPENAI_API_KEY and INTERVIEW_MODEL\n');
    
    return meeting;
  } catch (error) {
    console.error('\n❌ Error creating meeting:');
    console.error('Message:', error.message);
    if (error.statusCode) {
      console.error('Status Code:', error.statusCode);
    }
    if (error.body) {
      console.error('Error Details:', JSON.stringify(error.body, null, 2));
    }
    process.exit(1);
  }
}

testMeeting();

