import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateQuestionsForTest, generateMultipleFallbackQuestions } from '@/lib/question-generator';

/**
 * API endpoint for generating questions on demand for mock tests
 * This allows questions to be generated at the point of test taking
 * rather than loading from predefined data
 */

// Configure API route for edge runtime
export const runtime = 'edge';

export async function POST(request: NextRequest) {
  // Verify user authentication
  const authResult = await auth();
  const userId = authResult.userId;
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parse request body
    const { subject, difficulty, examLevel, questionCount, paperType } = await request.json();

    // Validate required parameters
    if (!subject || !difficulty || !examLevel || !questionCount || !paperType) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Generate immediate fallback questions for fast initial response
    console.log(`Generating ${questionCount} questions for ${subject} test...`);
    
    // Generate fallback questions immediately
    const fallbackQuestions = generateMultipleFallbackQuestions(
      subject, 
      difficulty, 
      examLevel, 
      questionCount, 
      paperType
    );
    
    // Start the async generation of real questions
    const questionsPromise = generateQuestionsForTest(
      subject,
      difficulty,
      examLevel,
      questionCount,
      paperType
    );
    
    // Return the fallback questions right away for faster response
    return NextResponse.json({ 
      questions: fallbackQuestions,
      message: "Questions generated successfully. These are initial fallback questions. Refresh in a moment for AI-generated questions."
    });
    
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}