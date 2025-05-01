# Setting Up DeepSeek API Integration for CA Guru AI

This document explains how to set up the DeepSeek API integration for real-time AI responses in the CA Guru AI application.

## Overview

CA Guru AI now uses the DeepSeek API to generate real-time, accurate responses for CA-related questions. This integration replaces the previous static mock responses with dynamic AI-generated content tailored to Chartered Accountancy topics.

## Setup Instructions

### 1. Get a DeepSeek API Key

1. Visit [DeepSeek Platform](https://platform.deepseek.com/) and create an account
2. Navigate to the API section and generate a new API key
3. Copy your API key for the next step

### 2. Configure Environment Variables

1. Create a `.env` file in the root directory of the project (you can copy from `.env.example`)
2. Add your DeepSeek API key to the file:

```
DEEPSEEK_API_KEY=your_api_key_here
```

3. Save the file

### 3. Restart the Application

After setting up the environment variables, restart your development server for the changes to take effect:

```bash
npm run dev
```

## How It Works

The application now uses the DeepSeek API in two main areas:

1. **Subject Q&A** (`/api/qa`): When users ask questions about specific CA subjects, the application sends the query to the DeepSeek API with a specialized prompt tailored to the subject area.

2. **Voice Query** (`/api/voice-query`): When users use voice input to ask questions, the application detects the subject area and sends the transcribed query to the DeepSeek API.

## Fallback Behavior

If the DeepSeek API key is not configured or if there's an issue with the API connection, the application will display a fallback message asking the user to try again later.

## Troubleshooting

- **No API responses**: Verify that your DeepSeek API key is correctly set in the `.env` file
- **Error responses**: Check the server logs for specific error messages from the DeepSeek API
- **Rate limiting**: If you encounter rate limiting issues, consider implementing a caching strategy or upgrading your DeepSeek API plan

## Security Considerations

- The DeepSeek API key is stored as an environment variable and is not exposed to the client
- All API requests are made server-side to protect your credentials
- The application includes content filtering to ensure responses are appropriate and relevant to CA curriculum