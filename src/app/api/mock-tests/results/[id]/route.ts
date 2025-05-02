import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
// Import the initialization module to ensure database is connected
import '../../../_init';

// Import the database functions
import { getMockTest, getTestSubmission } from '@/db/mock-tests-db';

// Import the safeDbOperation function
import { safeDbOperation } from '../../route';

// GET endpoint to retrieve a specific test result
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await auth();
  const userId = authResult.userId;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resultId = params.id;
    if (!resultId) {
      return NextResponse.json({ error: 'Result ID is required' }, { status: 400 });
    }

    // Parse the result ID to extract test ID and completion timestamp
    // Format is expected to be: testId-timestamp
    const parts = resultId.split('-');
    if (parts.length < 2) {
      return NextResponse.json({ error: 'Invalid result ID format' }, { status: 400 });
    }

    const testId = parts[0];
    const timestamp = parts.slice(1).join('-'); // Rejoin in case timestamp contains hyphens

    // Try to get the submission from database
    const submission = await safeDbOperation(
      async () => await getTestSubmission(testId, userId, timestamp),
      null
    );

    if (!submission) {
      return NextResponse.json({ error: 'Test result not found' }, { status: 404 });
    }

    // Try to get the test from database
    const test = await safeDbOperation(
      async () => await getMockTest(testId),
      null
    );
    
    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Prepare questions with correct answers and user answers
    const questions = test.questions.map(q => ({
      id: q.id,
      text: q.text,
      options: q.options,
      correctAnswer: q.correctAnswer,
      userAnswer: submission.answers[q.id] ?? -1 // -1 indicates no answer
    }));

    // Calculate correct answers count
    const correctAnswers = questions.filter(q => q.userAnswer === q.correctAnswer).length;

    // Return the complete result
    return NextResponse.json({
      id: resultId,
      testId,
      title: submission.testTitle || test.title,
      subject: submission.subject || test.subject,
      score: submission.score,
      correctAnswers,
      totalQuestions: test.questions.length,
      completedAt: submission.completedAt,
      timeSpent: submission.timeSpent,
      questions
    });
  } catch (error) {
    console.error('Error retrieving test result:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve test result' },
      { status: 500 }
    );
  }
}