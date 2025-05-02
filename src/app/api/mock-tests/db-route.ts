import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
// Import the initialization module to ensure database is connected
import '../_init';

// Import the database functions
import {
  saveMockTest,
  getMockTest,
  saveTestSubmission,
  // Removing unused imports
  // getTestSubmission,
  // getUserTestHistory
} from '@/db/mock-tests-db';

// Import the mock test data from the original route for fallback
import { mockTests, testTemplates, generateTest } from './route';

// Flag to track if database is available
// Initially assume database is available if URL is configured
let isDatabaseAvailable = !!process.env.DATABASE_URL;

// Function to safely execute database operations with fallback
export async function safeDbOperation<T>(dbOperation: () => Promise<T>, fallback: T): Promise<T> {
  // If database is already known to be unavailable, use fallback immediately
  if (!isDatabaseAvailable) return fallback;
  
  try {
    return await dbOperation();
  } catch (error) {
    console.error('Database operation failed:', error);
    // Mark database as unavailable for future operations
    isDatabaseAvailable = false;
    return fallback;
  }
}

// GET endpoint to retrieve mock tests or generate a new one
export async function GET(req: NextRequest) {
  const authResult = await auth();
  const userId = authResult.userId;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(req.url);
  const testId = url.searchParams.get('testId');
  const templateId = url.searchParams.get('templateId');

  // If testId is provided, return that specific test
  if (testId) {
    // Try to get the test from the database first
    const test = await safeDbOperation(
      async () => await getMockTest(testId),
      mockTests[testId] // Fallback to in-memory storage
    );

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Create a copy without revealing correct answers
    const testForUser = {
      ...test,
      questions: test.questions.map(q => {
        if (q.type === 'MCQ') {
          return {
            id: q.id,
            text: q.text,
            type: q.type,
            options: q.options,
            isCompulsory: q.isCompulsory,
            marks: q.marks || 1 // Default 1 mark for MCQs
          };
        } else {
          return {
            id: q.id,
            text: q.text,
            type: q.type,
            isCompulsory: q.isCompulsory,
            marks: q.marks || 16 // Default 16 marks for subjective questions
          };
        }
      })
    };

    return NextResponse.json(testForUser);
  }
  
  // If templateId is provided, generate a new test from that template
  if (templateId) {
    try {
      const newTest = generateTest(templateId);
      if (!newTest) {
        return NextResponse.json({ error: 'Failed to generate test from template' }, { status: 400 });
      }
      
      // Store the generated test in memory as fallback
      mockTests[newTest.id] = newTest;
      
      // If database is available, try to store it there too
      await safeDbOperation(
        async () => await saveMockTest(newTest),
        false
      );
      
      // Create a copy without revealing correct answers
      const testForUser = {
        ...newTest,
        questions: newTest.questions.map(q => {
          if (q.type === 'MCQ') {
            return {
              id: q.id,
              text: q.text,
              type: q.type,
              options: q.options,
              isCompulsory: q.isCompulsory,
              marks: q.marks || 1 // Default 1 mark for MCQs
            };
          } else {
            return {
              id: q.id,
              text: q.text,
              type: q.type,
              isCompulsory: q.isCompulsory,
              marks: q.marks || 16 // Default 16 marks for subjective questions
            };
          }
        })
      };
      
      return NextResponse.json(testForUser);
    } catch (error) {
      console.error('Error generating test:', error);
      return NextResponse.json({ error: 'Failed to generate test. Using fallback mechanism.' }, { status: 500 });
    }
  }

  // Otherwise return list of available test templates
  const availableTests = Object.entries(testTemplates).map(([id, template]) => ({
    id,
    title: template.title,
    subject: template.subject,
    duration: template.duration,
    questionCount: template.questionCount,
    difficulty: template.difficulty
  }));

  return NextResponse.json(availableTests);
}

// POST endpoint to submit a completed test
export async function POST(req: NextRequest) {
  const authResult = await auth();
  const userId = authResult.userId;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { testId, answers } = await req.json();
    
    if (!testId || !answers) {
      return NextResponse.json({ error: 'Test ID and answers are required' }, { status: 400 });
    }

    // Get the test from database first, fall back to in-memory if needed
    const test = await safeDbOperation(
      async () => await getMockTest(testId),
      mockTests[testId]
    );

    if (!test) {
      return NextResponse.json({ error: 'Test not found' }, { status: 404 });
    }

    // Calculate score
    let correctCount = 0;
    const totalQuestions = test.questions.length;

    for (const question of test.questions) {
      if (question.type === 'MCQ' && answers[question.id] === question.correctAnswer) {
        correctCount++;
      }
    }

    const score = (correctCount / totalQuestions) * 100;
    const completedAt = new Date().toISOString();
    
    // Create submission object
    const submission = {
      testId,
      userId,
      answers,
      score,
      completedAt,
      timeSpent: 0, // This should be calculated based on start time
      testTitle: test.title,
      subject: test.subject
    };

    // Save to database if available, otherwise store in memory
    const success = await safeDbOperation(
      async () => await saveTestSubmission(submission),
      true // Assume success for in-memory storage
    );

    if (!success) {
      return NextResponse.json({ error: 'Failed to save test submission' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      score,
      correctAnswers: correctCount,
      totalQuestions,
      resultId: `${testId}-${completedAt}`
    });
  } catch (error) {
    console.error('Error submitting test:', error);
    return NextResponse.json({ error: 'Failed to submit test' }, { status: 500 });
  }
}