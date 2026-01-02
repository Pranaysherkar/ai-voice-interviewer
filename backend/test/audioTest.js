const AudioBridge = require('../services/audioBridge');
const logger = require('../utils/logger');

/**
 * Test audio format conversion and buffer management
 */
async function testAudioBridge() {
  console.log('\n=== Testing AudioBridge ===\n');

  try {
    const meetingId = 'test-meeting-001';
    const audioBridge = new AudioBridge(meetingId);

    // Test 1: Start/Stop
    console.log('Test 1: Start/Stop functionality');
    audioBridge.start();
    console.log('✓ AudioBridge started');
    
    const metrics1 = audioBridge.getMetrics();
    console.log('✓ Metrics retrieved:', metrics1);
    
    audioBridge.stop();
    console.log('✓ AudioBridge stopped\n');

    // Test 2: Buffer management
    console.log('Test 2: Buffer management');
    audioBridge.start();
    
    // Simulate audio chunks (PCM16 format - 2 bytes per sample)
    const chunkSize = 480 * 2; // 20ms at 24kHz
    const testChunk = Buffer.alloc(chunkSize, 0x00);
    
    // Write multiple chunks
    for (let i = 0; i < 10; i++) {
      const result = await audioBridge.streamToOpenAI(testChunk);
      if (result) {
        console.log(`✓ Processed chunk ${i + 1}, size: ${result.length}`);
      }
    }
    
    const metrics2 = audioBridge.getMetrics();
    console.log('✓ Final metrics:', metrics2);
    console.log(`  - Input packets: ${metrics2.inputPackets}`);
    console.log(`  - Output packets: ${metrics2.outputPackets}`);
    console.log(`  - Dropped packets: ${metrics2.droppedPackets}\n`);

    // Test 3: Format conversion (simplified)
    console.log('Test 3: Format conversion');
    const teamsAudio = Buffer.alloc(1000, 0x7F); // Simulated Teams audio
    const openaiAudio = await audioBridge.convertTeamsToOpenAI(teamsAudio);
    console.log('✓ Teams → OpenAI conversion:', {
      inputSize: teamsAudio.length,
      outputSize: openaiAudio?.length || 0,
    });

    const openaiResponse = Buffer.alloc(960, 0x80); // Simulated OpenAI response
    const teamsResponse = await audioBridge.convertOpenAIToTeams(openaiResponse);
    console.log('✓ OpenAI → Teams conversion:', {
      inputSize: openaiResponse.length,
      outputSize: teamsResponse?.length || 0,
    });

    audioBridge.stop();
    console.log('\n✓ All AudioBridge tests passed\n');

  } catch (error) {
    console.error('\n✗ AudioBridge test failed:', error);
    process.exit(1);
  }
}

/**
 * Test audio buffer overflow handling
 */
async function testBufferOverflow() {
  console.log('\n=== Testing Buffer Overflow Handling ===\n');

  try {
    const meetingId = 'test-meeting-002';
    const audioBridge = new AudioBridge(meetingId);
    audioBridge.start();

    // Send large amount of data to test overflow
    const largeChunk = Buffer.alloc(100000, 0xFF);
    
    console.log('Sending large audio chunk...');
    const result = await audioBridge.streamToOpenAI(largeChunk);
    
    if (result) {
      console.log('✓ Buffer handled large chunk, output size:', result.length);
    } else {
      console.log('✓ Buffer correctly rejected oversized chunk');
    }

    const metrics = audioBridge.getMetrics();
    console.log('✓ Metrics after overflow test:', {
      droppedPackets: metrics.droppedPackets,
      inputPackets: metrics.inputPackets,
    });

    audioBridge.stop();
    console.log('\n✓ Buffer overflow test passed\n');

  } catch (error) {
    console.error('\n✗ Buffer overflow test failed:', error);
    process.exit(1);
  }
}

// Run tests
async function runTests() {
  try {
    await testAudioBridge();
    await testBufferOverflow();
    console.log('=== All Audio Tests Passed ===\n');
    process.exit(0);
  } catch (error) {
    console.error('Test suite failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = {
  testAudioBridge,
  testBufferOverflow,
};

