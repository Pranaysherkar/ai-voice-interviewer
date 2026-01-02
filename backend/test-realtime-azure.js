require('dotenv').config();
const RealtimeService = require('./services/realtimeService');
const logger = require('./utils/logger');

async function testRealtimeConnection() {
  console.log('\n=== Testing Azure OpenAI Realtime API Connection ===\n');
  
  // Check configuration
  console.log('Configuration Check:');
  console.log('  AZURE_OPENAI_ENDPOINT:', process.env.AZURE_OPENAI_ENDPOINT || '❌ MISSING');
  console.log('  AZURE_OPENAI_DEPLOYMENT_NAME:', process.env.AZURE_OPENAI_DEPLOYMENT_NAME || '❌ MISSING');
  console.log('  AZURE_OPENAI_API_VERSION:', process.env.AZURE_OPENAI_API_VERSION || 'Using default');
  console.log('  OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ SET' : '❌ MISSING');
  console.log('');

  if (!process.env.AZURE_OPENAI_ENDPOINT) {
    console.error('❌ AZURE_OPENAI_ENDPOINT is required!');
    console.error('   Please add it to your .env file');
    process.exit(1);
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY is required!');
    console.error('   Please add it to your .env file');
    process.exit(1);
  }

  // Create RealtimeService instance
  const realtimeService = new RealtimeService();
  
  // Check if Azure is detected
  console.log('Azure OpenAI Detection:');
  console.log('  Is Azure:', realtimeService.isAzure ? '✅ YES' : '❌ NO');
  if (realtimeService.isAzure) {
    console.log('  Endpoint:', realtimeService.azureEndpoint);
    console.log('  Deployment:', realtimeService.azureDeploymentName || realtimeService.model);
    console.log('  API Version:', realtimeService.azureApiVersion);
  } else {
    console.error('  ⚠️  Azure OpenAI not detected!');
    console.error('     Make sure AZURE_OPENAI_ENDPOINT is set in .env');
    process.exit(1);
  }
  console.log('');

  // Get WebSocket URL
  const wsUrl = realtimeService.getWebSocketUrl();
  console.log('WebSocket URL:');
  console.log('  ', wsUrl.replace(/api-key=[^&]*/, 'api-key=***').replace(/[a-zA-Z0-9]{32,}/g, '***'));
  console.log('');
  console.log('⚠️  IMPORTANT: Azure OpenAI Realtime API may not be available yet!');
  console.log('   The Realtime API is a very new feature and might only work with standard OpenAI.');
  console.log('   If you continue to get 404 errors, consider:');
  console.log('   1. Using standard OpenAI API (openai.com) instead of Azure OpenAI');
  console.log('   2. Checking Azure OpenAI documentation for Realtime API availability');
  console.log('   3. Contacting Azure support to confirm Realtime API support');
  console.log('');

  // Test connection
  console.log('Testing WebSocket Connection...');
  console.log('  Attempting to connect...\n');

  try {
    // Set up callbacks
    realtimeService.onAudioResponseCallback((audioBuffer) => {
      console.log('✅ Received audio response (', audioBuffer.length, 'bytes)');
    });

    realtimeService.onTranscriptionCallback((transcript) => {
      console.log('✅ Received transcription:', transcript);
    });

    realtimeService.onErrorCallback((error) => {
      console.error('❌ Error callback:', error.message);
    });

    // Connect with timeout
    const connectPromise = realtimeService.connect({
      voice: 'alloy',
      instructions: 'Say "Hello, I am connected successfully!"',
    });

    // Set timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout after 10 seconds')), 10000);
    });

    await Promise.race([connectPromise, timeoutPromise]);

    console.log('\n✅ SUCCESS: Connected to Azure OpenAI Realtime API!');
    console.log('   Connection established successfully.\n');

    // Wait a moment to see if we get any messages
    console.log('Waiting for session initialization...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Disconnect
    realtimeService.disconnect();
    console.log('✅ Disconnected successfully\n');
    
    console.log('=== Test Passed ===\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ FAILED: Connection test failed');
    console.error('   Error:', error.message);
    if (error.stack) {
      console.error('   Stack:', error.stack.split('\n').slice(0, 3).join('\n'));
    }
    console.log('\n=== Test Failed ===\n');
    
    // Troubleshooting tips
    console.log('Troubleshooting:');
    console.log('  1. Verify AZURE_OPENAI_ENDPOINT is correct');
    console.log('     Format: https://your-resource.cognitiveservices.azure.com');
    console.log('  2. Verify AZURE_OPENAI_DEPLOYMENT_NAME matches your deployment');
    console.log('     Check in Azure Portal → Deployments');
    console.log('  3. Verify OPENAI_API_KEY is valid');
    console.log('     Get from Azure Portal → Keys');
    console.log('  4. Check network connectivity to Azure');
    console.log('     Try: ping your-endpoint.cognitiveservices.azure.com');
    console.log('  5. Verify the deployment is active in Azure Portal');
    console.log('     Check deployment status in Azure AI Studio');
    console.log('  6. Check if api-version is correct');
    console.log('     Try: 2024-02-15-preview or 2024-08-01-preview');
    console.log('  7. ⚠️  404 Error: Azure OpenAI Realtime API endpoint might be different');
    console.log('     The Realtime API might not be available via Azure OpenAI yet');
    console.log('     Or the endpoint path format might be different');
    console.log('     Current URL format: /openai/deployments/{deployment}/realtime');
    console.log('     Alternative formats to try:');
    console.log('       - /v1/realtime?model={deployment}&api-version={version}');
    console.log('       - /openai/v1/realtime?model={deployment}&api-version={version}');
    console.log('     Check Azure OpenAI documentation for Realtime API support\n');
    
    process.exit(1);
  }
}

// Run the test
testRealtimeConnection().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});

