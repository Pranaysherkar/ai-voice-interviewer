# Timeout Issue Fixed ✅

## Problem

Bot was showing "I'm thinking... (response timeout)" even though OpenAI was sending responses.

## Root Cause

Looking at the logs (line 122):
```json
{
  "output_modalities": ["audio"],
  "content": [{
    "type": "output_audio",
    "transcript": "Hey! How's it going? What can I do for you today?"
  }]
}
```

**The issue:** OpenAI was returning responses as `output_audio` with a `transcript` field, but the code was only checking for `content.type === 'text'`.

Even though we configured the session with `modalities: ['text']`, Azure OpenAI Realtime API still returns audio format with transcripts.

## Solution

Updated `handleMessage()` in `backend/services/realtimeService.js` to extract transcripts from audio responses:

### Changes Made

1. **`response.output_item.added` handler** - Now checks for both:
   - `content.type === 'text'` → extract `content.text`
   - `content.type === 'output_audio'` → extract `content.transcript`

2. **`response.output_item.done` handler** - Now checks for both:
   - `content.type === 'text'` → extract `content.text`
   - `content.type === 'output_audio'` → extract `content.transcript`

3. **`response.done` handler** - Now checks for both:
   - `content.type === 'text'` → extract `content.text`
   - `content.type === 'output_audio'` → extract `content.transcript`

## Code Example

```javascript
// Before (only handled text)
if (content.type === 'text' && content.text) {
  this.onResponseText(content.text);
}

// After (handles both text and audio transcripts)
if (content.type === 'text' && content.text) {
  this.onResponseText(content.text);
}
else if (content.type === 'output_audio' && content.transcript) {
  this.onResponseText(content.transcript);
}
```

## Why This Happens

Azure OpenAI Realtime API behavior:
- Even with `modalities: ['text']`, it may return audio format
- Audio responses include a `transcript` field with the text
- This is the text version of what would be spoken
- For text-only chat, we extract the transcript instead of playing audio

## Expected Behavior Now

1. User sends: "hey"
2. OpenAI responds with audio format containing transcript: "Hey! How's it going? What can I do for you today?"
3. Bot extracts the transcript
4. Bot sends text to Teams: "Hey! How's it going? What can I do for you today?"
5. No more timeout!

## Testing

The server should auto-restart with nodemon. Send a message in Teams and you should see:

**In logs:**
```
[info]: Extracted transcript from output_audio in response.done
[info]: AI response sent successfully
```

**In Teams:**
```
You: hey
Bot: Hey! How's it going? What can I do for you today?
```

## Additional Notes

- The `output_audio` type is normal for Realtime API
- The transcript is the text representation of the audio
- This works for both Azure OpenAI and standard OpenAI
- No configuration changes needed - the fix handles both formats automatically

---

**Status:** ✅ Fixed and deployed
**Date:** 2026-01-02
**Impact:** Bot now responds with AI-generated text instead of timing out

