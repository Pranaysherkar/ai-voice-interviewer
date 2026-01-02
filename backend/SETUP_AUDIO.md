# Teams Audio Interview Bot Setup Guide

This guide explains how to set up the Teams Audio Interview Bot with bidirectional audio streaming between Teams meetings and OpenAI's gpt-4o-mini-realtime-preview model.

## Architecture Overview

The bot uses Azure Communication Services (ACS) to bridge audio between Teams meetings and OpenAI Realtime API:

```
Teams Meeting → ACS Calling SDK → Audio Bridge → OpenAI Realtime API
              ← ACS Calling SDK ← Audio Bridge ← OpenAI Realtime API
```

## Prerequisites

1. **Azure Communication Services Resource**
   - Create an ACS resource in Azure Portal
   - Obtain the connection string
   - Note: ACS is required for audio streaming in Teams

2. **Azure Bot Registration**
   - Bot registered in Azure Portal
   - Teams channel enabled
   - Calling capability enabled (for audio)

3. **OpenAI API Access**
   - OpenAI API key (or Azure OpenAI)
   - Access to `gpt-4o-mini-realtime-preview` model

4. **Local Development Setup**
   - Node.js 18+ installed
   - ngrok for local webhook testing
   - All environment variables configured

## Environment Variables

Add these to your `.env` file:

```env
# Bot Framework (required)
MicrosoftAppId=your-bot-app-id
MicrosoftAppPassword=your-bot-app-password
MicrosoftAppType=MultiTenant
MicrosoftAppTenantId=

# Azure Communication Services (required for audio)
ACS_CONNECTION_STRING=endpoint=https://your-resource.communication.azure.com/;accesskey=your-key
ACS_PHONE_NUMBER=  # Optional, for PSTN calls

# Audio Configuration
AUDIO_SAMPLE_RATE=24000  # OpenAI requires 24kHz
AUDIO_CHANNELS=1  # Mono
AUDIO_BIT_DEPTH=16  # 16-bit PCM

# OpenAI Configuration
# For Azure OpenAI (recommended if you have Azure OpenAI resource):
OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_ENDPOINT=https://your-resource.cognitiveservices.azure.com
AZURE_OPENAI_API_VERSION=2024-02-15-preview
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4o-mini-realtime-preview
INTERVIEW_MODEL=gpt-4o-mini-realtime-preview

# For Standard OpenAI (if using openai.com):
# OPENAI_API_KEY=sk-your-openai-key
# INTERVIEW_MODEL=gpt-4o-mini-realtime-preview
# (Leave AZURE_OPENAI_* variables unset)

# Microsoft Graph (for meeting creation)
MICROSOFT_CLIENT_ID=your-graph-client-id
MICROSOFT_CLIENT_SECRET=your-graph-client-secret
MICROSOFT_TENANT_ID=your-tenant-id

# Test User (for meeting creation)
TEST_USER_EMAIL=your-email@domain.com
```

## Azure Communication Services Setup

### Step 1: Create ACS Resource

1. Go to Azure Portal
2. Create new resource → Search "Communication Services"
3. Create resource with:
   - Resource name
   - Region (choose closest to your users)
   - Pricing tier

### Step 2: Get Connection String

1. Go to your ACS resource → Keys
2. Copy the Connection String
3. Add to `.env` as `ACS_CONNECTION_STRING`

### Step 3: Configure Bot for Calling

1. Go to Azure Portal → Your Bot → Channels
2. Click "Microsoft Teams"
3. Enable "Calling" capability
4. Set Calling endpoint: `https://your-domain.com/api/calling`

## Local Development Setup

### Step 1: Install Dependencies

```bash
cd backend
npm install
```

### Step 2: Start ngrok

```bash
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`)

### Step 3: Configure Azure Bot

1. Azure Portal → Your Bot → Configuration
2. Set Messaging endpoint: `https://your-ngrok-url.ngrok-free.app/api/messages`
3. Set Calling endpoint: `https://your-ngrok-url.ngrok-free.app/api/calling`
4. Save and wait 1-2 minutes for propagation

### Step 4: Start Backend Server

```bash
cd backend
npm run dev
```

## Testing

### Test 1: Create Meeting

```bash
cd backend
node test-meeting.js
```

This creates a Teams meeting and returns the join URL.

### Test 2: Audio Bridge

```bash
cd backend
node test/audioTest.js
```

Tests audio format conversion and buffer management.

### Test 3: Integration Test

```bash
cd backend
node test/integrationTest.js
```

Tests end-to-end bot functionality (requires credentials).

## How It Works

### 1. Meeting Creation

- Use `test-meeting.js` or Graph API to create Teams meeting
- Meeting returns a join URL

### 2. Bot Joins Meeting

- Bot receives `membersAdded` event when it joins
- Bot initializes:
  - ACS Calling Service (for Teams audio)
  - OpenAI Realtime API (for AI voice)
  - Audio Bridge (for format conversion)

### 3. Audio Streaming

**Teams → OpenAI:**
1. Teams sends audio to ACS
2. ACS forwards to Audio Bridge
3. Audio Bridge converts to PCM16 24kHz
4. Audio Bridge streams to OpenAI Realtime API

**OpenAI → Teams:**
1. OpenAI generates audio response (PCM16)
2. Audio Bridge converts to Teams format
3. Audio Bridge sends to ACS
4. ACS plays audio in Teams meeting

### 4. Interview Flow

- Bot introduces itself (voice + text)
- Bot asks candidate to introduce themselves
- Bot conducts interview using OpenAI Realtime API
- All audio is transcribed and stored
- Interview ends when meeting ends

## Troubleshooting

### Bot doesn't join meeting

**Check:**
- Bot is added to Teams meeting
- Application Access Policy configured (IT admin)
- Messaging endpoint correct in Azure Portal
- ngrok running and URL matches Azure config

### Audio not working

**Check:**
- ACS connection string valid
- ACS resource active
- Calling endpoint configured in Azure Bot
- Audio format conversion working (check logs)
- OpenAI Realtime API connected (check logs)

### "Unable to extract ConnectorClient" error

**Fix:**
- Verify `MicrosoftAppId` matches Azure Bot App ID
- Verify `MicrosoftAppPassword` is correct (not Secret ID)
- Check messaging endpoint matches ngrok URL exactly
- Restart backend server after .env changes

### OpenAI connection fails

**For Azure OpenAI:**
- `OPENAI_API_KEY` is valid (from Azure Portal)
- `AZURE_OPENAI_ENDPOINT` is correct (format: `https://your-resource.cognitiveservices.azure.com`)
- `AZURE_OPENAI_DEPLOYMENT_NAME` matches your deployment exactly
- `AZURE_OPENAI_API_VERSION` is set (e.g., `2024-02-15-preview`)
- Network connectivity to Azure OpenAI endpoint

**For Standard OpenAI:**
- `OPENAI_API_KEY` is valid (starts with `sk-`)
- `INTERVIEW_MODEL` is correct
- Network connectivity to `api.openai.com`

**Common Issues:**
- Using Azure key without setting `AZURE_OPENAI_ENDPOINT` → Will try standard OpenAI and fail
- Wrong deployment name → 404 error
- Missing `api-version` for Azure → Connection refused

### Audio quality issues

**Check:**
- Audio sample rate set to 24000 Hz
- Audio channels set to 1 (mono)
- Audio bit depth set to 16
- Network latency (check metrics in logs)
- Buffer overflow warnings (check logs)

## Production Deployment

### Requirements

1. **HTTPS Endpoint**
   - Valid SSL certificate
   - Publicly accessible domain
   - Stable URL (no ngrok in production)

2. **Azure App Service or VM**
   - Sufficient CPU for audio processing
   - Low latency network connection
   - Auto-scaling configured

3. **Monitoring**
   - Application Insights enabled
   - Log aggregation (e.g., Log Analytics)
   - Audio quality metrics dashboard

4. **Security**
   - Environment variables in Azure Key Vault
   - Network security groups configured
   - Bot credentials rotated regularly

## Audio Format Specifications

### OpenAI Realtime API Requirements
- Format: PCM16
- Sample Rate: 24,000 Hz
- Channels: 1 (mono)
- Bit Depth: 16-bit
- Frame Size: 480 samples (20ms)

### Teams Audio Format
- Format: Opus, G.711, or G.722 (varies)
- Sample Rate: 8,000 - 48,000 Hz (varies)
- Channels: Mono or Stereo
- Bit Depth: 16-bit

### Audio Bridge Conversion
- Converts Teams audio → PCM16 24kHz mono
- Converts OpenAI PCM16 → Teams format
- Handles resampling and channel conversion
- Manages buffering for smooth streaming

## Performance Considerations

### Latency
- Target: < 500ms end-to-end
- Factors: Network, audio processing, OpenAI response time
- Monitor via metrics in logs

### Resource Usage
- CPU: Audio conversion is CPU-intensive
- Memory: Audio buffers require memory
- Network: Real-time audio streaming needs bandwidth

### Scaling
- One bot instance per meeting (stateless design)
- Horizontal scaling for multiple concurrent meetings
- Consider Azure Functions for serverless scaling

## Support

For issues:
1. Check logs in `backend/logs/`
2. Review error messages in console
3. Verify all environment variables
4. Test individual components (ACS, OpenAI, Bot Framework)
5. Check Azure Portal for service status

## Next Steps

After setup:
1. Test with a real Teams meeting
2. Monitor audio quality metrics
3. Tune audio buffer sizes if needed
4. Configure interview instructions
5. Set up transcript storage and evaluation

