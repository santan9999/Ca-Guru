import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { generateQuestionsForTest } from '@/lib/question-generator';

/**
 * API endpoint for generating questions on demand for mock tests
 * This allows questions to be generated at the point of test taking
 * rather than loading from predefined data
 */
export async function POST(request: NextRequest) {
  // Verify user authentication
  const { userId } = auth();
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

    // Generate questions using AI
    console.log(`Generating ${questionCount} questions for ${subject} test...`);
    const questions = await generateQuestionsForTest(
      subject,
      difficulty,
      examLevel,
      questionCount,
      paperType
    );

    // Return the generated questions
    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Error generating questions:', error);
    return NextResponse.json(
      { error: 'Failed to generate questions' },
      { status: 500 }
    );
  }
}