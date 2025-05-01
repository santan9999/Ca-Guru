import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
// Import the initialization module to ensure database is connected
import '../_init';
// Import DeepSeek API utilities
import { generateDeepSeekResponse, generateCASystemPrompt, isDeepSeekAvailable, detectRequestedFormat } from '@/lib/deepseek';

// This is a simple implementation for voice query processing
// In a production environment, you would:
// 1. Connect to a real LLM API (OpenAI, Anthropic, etc.)
// 2. Implement proper error handling and validation
// 3. Add rate limiting and security measures
// 4. Add logging and monitoring

export async function POST(req: NextRequest) {
  // Verify user is authenticated
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { transcript } = await req.json();

    // Validate request data
    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    // Process the transcript to determine the subject
    // This is a simple implementation - in a real app, you would use NLP
    const subjectKeywords = {
      'taxation': ['tax', 'income tax', 'tds', 'gst', 'return', 'itr', 'section'],
      'corporate-law': ['company', 'companies act', 'director', 'board', 'shareholder', 'corporate'],
      'accounting': ['accounting', 'balance sheet', 'profit and loss', 'ind as', 'financial statement'],
      'audit': ['audit', 'auditor', 'auditing', 'sa', 'internal control', 'opinion'],
      'finance': ['finance', 'capital', 'investment', 'portfolio', 'dividend', 'valuation'],
      'costing': ['cost', 'costing', 'overhead', 'absorption', 'marginal', 'standard cost']
    };

    let detectedSubject = 'general';
    const lowercaseTranscript = transcript.toLowerCase();
    
    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
      for (const keyword of keywords) {
        if (lowercaseTranscript.includes(keyword.toLowerCase())) {
          detectedSubject = subject;
          break;
        }
      }
      if (detectedSubject !== 'general') break;
    }

    // Generate a response using the DeepSeek API
    const systemPrompt = generateCASystemPrompt(detectedSubject);
    
    // Detect if user is requesting a specific format
    const requestedFormat = detectRequestedFormat(transcript);
    
    const response = await generateDeepSeekResponse(systemPrompt, transcript);

    // Return the response
    return NextResponse.json({
      answer: response,
      detectedSubject,
      transcript,
      format: requestedFormat || 'default',
      usingAI: isDeepSeekAvailable
    });
  } catch (error) {
    console.error('Error processing voice query:', error);
    return NextResponse.json(
      { error: 'Failed to process your voice query' },
      { status: 500 }
    );
  }
}

// Note: The generateResponse function has been replaced with the DeepSeek API integration