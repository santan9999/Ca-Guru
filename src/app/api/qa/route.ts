import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { query } from '@/lib/db';
// Import the initialization module to ensure database is connected
import '../_init';
// Import DeepSeek API utilities
import { generateDeepSeekResponse, generateCASystemPrompt, isDeepSeekAvailable, detectRequestedFormat } from '@/lib/deepseek';

// Flag to track if database is available
const isDatabaseAvailable = !!process.env.DATABASE_URL;

// This implementation connects to a PostgreSQL database
// In a production environment, you would also:
// 1. Connect to a real LLM API (OpenAI, Anthropic, etc.)
// 2. Add rate limiting
// 3. Add more comprehensive logging and monitoring

export async function POST(req: NextRequest) {
  // Verify user is authenticated
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { subject, query: userQuery } = await req.json();

    // Validate request data
    if (!subject || !userQuery) {
      return NextResponse.json(
        { error: 'Subject and query are required' },
        { status: 400 }
      );
    }

      // Generate a response using the DeepSeek API
    const systemPrompt = generateCASystemPrompt(subject);
    
    // Detect if user is requesting a specific format
    const requestedFormat = detectRequestedFormat(userQuery);
    
    const aiResponse = await generateDeepSeekResponse(systemPrompt, userQuery);

    // Log the query to the database for future analysis (only if database is available)
    if (isDatabaseAvailable) {
      try {
        await query(
          'INSERT INTO user_queries (user_id, subject, query, response) VALUES ($1, $2, $3, $4)',
          [userId, subject, userQuery, aiResponse]
        );
      } catch (dbError) {
        // Log the error but don't fail the request
        console.error('Error logging query to database:', dbError);
      }
    }

    // Return the response
    return NextResponse.json({
      answer: aiResponse,
      subject,
      query: userQuery,
      format: requestedFormat || 'default',
      usingAI: isDeepSeekAvailable
    });
  } catch (error) {
    console.error('Error processing Q&A request:', error);
    return NextResponse.json(
      { error: 'Failed to process your question' },
      { status: 500 }
    );
  }
}

// Note: The simulateAIResponse function has been replaced with the DeepSeek API integration