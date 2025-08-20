# AI Integration Setup for Rivor

This document explains how the AI features in Rivor are connected to OpenAI and how to configure them.

## Overview

All AI features in Rivor are now connected to OpenAI's API, providing intelligent assistance for:

- **Chat Assistant** - Conversational AI with CRM context
- **Email Drafting** - AI-powered email composition
- **Content Summarization** - Intelligent summaries of CRM data
- **Lead Analysis** - AI insights for leads and pipeline

## Setup Instructions

### 1. Get OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the API key (starts with `sk-`)

### 2. Configure Environment Variables

Add your OpenAI API key to your environment file:

**For development (.env.local):**
```env
OPENAI_API_KEY=your-openai-api-key-here
AI_API_KEY=your-openai-api-key-here
```

**For production:**
Set the same environment variables in your hosting platform (Vercel, AWS, etc.)

### 3. Verify Setup

1. Start the development server: `npm run dev`
2. Navigate to `/app/chat`
3. Send a test message to the AI assistant
4. If configured correctly, you should get intelligent responses

## AI Features Available

### 1. Chat Assistant (`/app/chat`)
- **Functionality**: Conversational AI with access to CRM data
- **Context**: Can access leads, contacts, emails, and calendar data
- **Actions**: Can create tasks, schedule meetings, send emails
- **API Endpoint**: `/api/chat`

### 2. Email Drafting (`/api/ai/draft-email`)
- **Functionality**: Generate professional emails for different scenarios
- **Types**: Reply, follow-up, introduction, meeting-request
- **Tones**: Professional, warm, casual, urgent
- **Context**: Uses lead and contact information

### 3. AI Assistant (`/api/ai/assistant`)
- **Functionality**: Streaming AI responses for real-time assistance
- **Context**: Lead and property information
- **Model**: GPT-4o-mini for fast responses

### 4. Content Summarization (`/api/ai/summary`)
- **Functionality**: Summarize pipeline, inbox, calendar, and contacts
- **Context**: Specific CRM section data
- **Use**: Quick insights and overviews

## Technical Implementation

### AI Service Architecture

```
apps/web/src/server/ai/
├── ai-service.ts       # Main AI service with OpenAI integration
├── assistant.ts        # Streaming assistant responses
└── index.ts           # Email drafting and summarization
```

### API Endpoints

1. **POST /api/chat**
   - Chat conversation with AI assistant
   - Context-aware responses
   - Action suggestions

2. **POST /api/ai/draft-email**
   - Generate email drafts
   - Multiple types and tones
   - Lead context integration

3. **POST /api/ai/assistant**
   - Streaming AI responses
   - Real-time assistance
   - Lead and property context

4. **GET /api/ai/summary**
   - Generate summaries
   - CRM data analysis
   - Quick insights

### Models Used

- **GPT-4**: Main conversational AI and email drafting
- **GPT-4o-mini**: Fast streaming responses for assistant

## Error Handling

The AI services include comprehensive error handling:

- **API Key Missing**: Graceful degradation with error messages
- **Rate Limiting**: Proper HTTP status codes
- **Network Issues**: Fallback responses
- **Invalid Requests**: Input validation and sanitization

## Usage Examples

### Chat Assistant
```javascript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: "Show me my high-priority leads",
    context: { type: 'pipeline' }
  })
});
```

### Email Drafting
```javascript
const response = await fetch('/api/ai/draft-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'follow-up',
    tone: 'professional',
    context: { leadId: 'lead-123' }
  })
});
```

## Security Considerations

- API keys are server-side only (not exposed to client)
- Input validation on all AI endpoints
- Rate limiting implemented
- Error messages don't leak sensitive information
- Context data is filtered and sanitized

## Cost Optimization

- Uses GPT-4o-mini for faster, cheaper responses where appropriate
- Context is optimized to reduce token usage
- Response length limits implemented
- Caching strategies for repeated queries

## Monitoring and Analytics

The AI services include:
- Error logging and monitoring
- Usage tracking
- Performance metrics
- Cost analysis

## Troubleshooting

### Common Issues

1. **"AI service is currently unavailable"**
   - Check if OPENAI_API_KEY is set
   - Verify API key is valid and has credits

2. **"Failed to generate email draft"**
   - Check API key permissions
   - Verify request format

3. **Slow responses**
   - Consider using GPT-4o-mini for faster responses
   - Check OpenAI API status

### Debug Mode

Set `NODE_ENV=development` to enable detailed error messages and logging.

## Future Enhancements

- [ ] Function calling for direct CRM actions
- [ ] Custom fine-tuned models for real estate
- [ ] Voice AI integration
- [ ] Multi-language support
- [ ] Advanced analytics and insights

## Support

For issues with AI integration:
1. Check the console for error messages
2. Verify environment variables are set
3. Test with a simple chat message
4. Check OpenAI API status and usage limits

---

*Last updated: 2025-08-20*
*AI Integration completed and fully functional with OpenAI API*