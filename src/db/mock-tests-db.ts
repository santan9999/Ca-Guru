import { executeQuery as query } from '@/lib/db';

// In-memory cache for mock tests
const mockTests: Record<string, MockTest> = {};

// Types for mock test data
type QuestionType = 'MCQ' | 'Subjective';

type Question = {
  id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  correctAnswer?: number; // Index of the correct option for MCQs
  isCompulsory?: boolean; // Whether this is a compulsory question
  marks?: number; // Marks allocated to this question
};

type MockTest = {
  id: string;
  title: string;
  subject: string;
  duration: number; // in minutes
  questionCount: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  examLevel: 'Foundation' | 'Intermediate' | 'Final'; // CA exam level
  paperType: 'Subjective' | 'Objective' | 'Mixed'; // Type of paper
  questions: Question[];
};

type TestSubmission = {
  testId: string;
  userId: string;
  answers: Record<string, number>; // questionId -> selected option index
  score: number;
  completedAt: string;
  timeSpent: number; // in seconds
  testTitle?: string; // Title of the test
  subject?: string; // Subject of the test
};

// Database functions for mock tests

/**
 * Save a mock test to the database
 */
export async function saveMockTest(test: MockTest): Promise<boolean> {
  try {
    // First save the test metadata
    await query(
      'INSERT INTO mock_tests (id, title, subject, duration, question_count, difficulty, exam_level, paper_type) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO UPDATE SET title = $2, subject = $3, duration = $4, question_count = $5, difficulty = $6, exam_level = $7, paper_type = $8',
      [test.id, test.title, test.subject, test.duration, test.questionCount, test.difficulty, test.examLevel, test.paperType]
    );

    // Then save each question
    for (const question of test.questions) {
      await query(
        'INSERT INTO questions (id, test_id, text, type, options, correct_answer, is_compulsory, marks) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (id) DO UPDATE SET test_id = $2, text = $3, type = $4, options = $5, correct_answer = $6, is_compulsory = $7, marks = $8',
        [
          question.id,
          test.id,
          question.text,
          question.type,
          JSON.stringify(question.options || []),
          question.correctAnswer,
          question.isCompulsory !== false, // Default to true if not specified
          question.marks || (question.type === 'MCQ' ? 1 : 16) // Default marks based on question type
        ]
      );
    }

    return true;
  } catch (error) {
    console.error('Error saving mock test to database:', error);
    return false;
  }
}

/**
 * Get a mock test from the database
 */
export async function getMockTest(testId: string): Promise<MockTest | null> {
  try {
    // Get the test metadata
    const testResult = await query('SELECT * FROM mock_tests WHERE id = $1', [testId]);
    if (testResult.rows.length === 0) {
      return null;
    }

    const testData = testResult.rows[0];

    // Get the questions for this test
    const questionsResult = await query('SELECT * FROM questions WHERE test_id = $1', [testId]);
    
    // Map database rows to Question objects
    const questions = questionsResult.rows.map(row => ({
      id: row.id,
      text: row.text,
      type: row.type as QuestionType,
      options: row.options,
      correctAnswer: row.correct_answer,
      isCompulsory: row.is_compulsory,
      marks: row.marks
    }));

    // Construct and return the complete MockTest object
    return {
      id: testData.id,
      title: testData.title,
      subject: testData.subject,
      duration: testData.duration,
      questionCount: testData.question_count,
      difficulty: testData.difficulty,
      examLevel: testData.exam_level,
      paperType: testData.paper_type,
      questions
    };
  } catch (error) {
    console.error('Error retrieving mock test from database:', error);
    return null;
  }
}

/**
 * Save a test submission to the database and update user progress
 */
export async function saveTestSubmission(submission: TestSubmission): Promise<boolean> {
  try {
    // Begin transaction
    await query('BEGIN');
    
    // Insert test submission
    await query(
      'INSERT INTO test_submissions (test_id, user_id, answers, score, completed_at, time_spent, test_title, subject) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [
        submission.testId,
        submission.userId,
        JSON.stringify(submission.answers),
        submission.score,
        submission.completedAt,
        submission.timeSpent,
        submission.testTitle,
        submission.subject
      ]
    );
    
    // const submissionId = result.rows[0].id; // Commented out since it's unused
    
    // Also save to test_history table
    try {
      // Import the saveTestHistory function
      const { saveTestHistory } = await import('./test-history-db');
      
      // Prepare test history data
      const testHistory = {
        userId: submission.userId,
        testId: submission.testId,
        title: submission.testTitle || 'Mock Test',
        subject: submission.subject || 'General',
        score: submission.score,
        completedAt: submission.completedAt,
        timeSpent: submission.timeSpent
      };
      
      // Prepare question responses data
      const questionResponses = Object.entries(submission.answers).map(([questionId, answer]) => {
        // Find the question in the test to determine if the answer is correct
        let isCorrect = false;
        
        try {
          // Try to find the test in mockTests (in-memory storage)
          const test = mockTests[submission.testId];
          if (test && test.questions) {
            // Find the question
            const question = test.questions.find((q: Question) => q.id === questionId);
            if (question && question.type === 'MCQ' && question.correctAnswer !== undefined) {
              // For MCQs, check if the answer matches the correct answer
              isCorrect = answer === question.correctAnswer;
            }
            // For subjective questions, we can't automatically determine correctness
          }
        } catch (err) {
          console.error(`Error determining if answer is correct for question ${questionId}:`, err);
        }
        
        return {
          testHistoryId: '', // Will be set by saveTestHistory
          questionId,
          userAnswer: answer?.toString(),
          isCorrect,
          timeTaken: undefined // Not tracking individual question time yet
        };
      });
      
      // Also update test performance analytics
      try {
        const { updateTestPerformanceAnalytics } = await import('./test-history-db');
        await updateTestPerformanceAnalytics(
          submission.userId,
          submission.subject || 'General',
          'General', // Topic - could be more specific in the future
          submission.score
        );
      } catch (analyticsError) {
        console.error('Error updating test performance analytics:', analyticsError);
      }
      
      // Save to test_history tables
      await saveTestHistory(testHistory, questionResponses);
    } catch (historyError) {
      // Log but don't fail the submission if test history storage fails
      console.error('Error storing in test_history tables:', historyError);
    }
    
    
    // Get current user progress to update stats
    const userProgressResult = await query(
      'SELECT * FROM user_progress WHERE user_id = $1',
      [submission.userId]
    );
    
    const today = new Date().toISOString().split('T')[0];
    const questionCount = Object.keys(submission.answers).length;
    
    if (userProgressResult.rows.length > 0) {
      // const currentProgress = userProgressResult.rows[0]; // Commented out since it's unused
      
      // Update user progress
      await query(
        `UPDATE user_progress SET 
         total_questions_answered = total_questions_answered + $1,
         total_tests_completed = total_tests_completed + 1,
         average_score = ((average_score * total_tests_completed) + $2) / (total_tests_completed + 1),
         last_login_date = $3
         WHERE user_id = $4`,
        [questionCount, submission.score, today, submission.userId]
      );
    } else {
      // Create new user progress record
      await query(
        `INSERT INTO user_progress 
         (user_id, streak, last_login_date, total_questions_answered, total_tests_completed, average_score) 
         VALUES ($1, 1, $2, $3, 1, $4)`,
        [submission.userId, today, questionCount, submission.score]
      );
    }
    
    // Update subject progress
    await query(
      `INSERT INTO subject_progress 
       (user_id, subject, score, questions_answered, tests_completed, last_activity) 
       VALUES ($1, $2, $3, $4, 1, $5) 
       ON CONFLICT (user_id, subject) DO UPDATE SET 
       score = ((subject_progress.score * subject_progress.tests_completed) + $3) / (subject_progress.tests_completed + 1),
       questions_answered = subject_progress.questions_answered + $4,
       tests_completed = subject_progress.tests_completed + 1,
       last_activity = $5`,
      [submission.userId, submission.subject || 'General', submission.score, questionCount, today]
    );
    
    // Update weekly activity
    await query(
      `INSERT INTO weekly_activity 
       (user_id, date, score, questions_answered) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (user_id, date) DO UPDATE SET 
       score = weekly_activity.score + $3,
       questions_answered = weekly_activity.questions_answered + $4`,
      [submission.userId, today, submission.score, questionCount]
    );
    
    // Commit transaction
    await query('COMMIT');
    return true;
  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');
    console.error('Error saving test submission to database:', error);
    return false;
  }
}

/**
 * Get a test submission from the database
 */
export async function getTestSubmission(testId: string, userId: string, completedAt: string): Promise<TestSubmission | null> {
  try {
    const result = await query(
      'SELECT * FROM test_submissions WHERE test_id = $1 AND user_id = $2 AND completed_at = $3',
      [testId, userId, completedAt]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      testId: row.test_id,
      userId: row.user_id,
      answers: row.answers,
      score: row.score,
      completedAt: row.completed_at.toISOString(),
      timeSpent: row.time_spent,
      testTitle: row.test_title,
      subject: row.subject
    };
  } catch (error) {
    console.error('Error retrieving test submission from database:', error);
    return null;
  }
}

/**
 * Get all test submissions for a user
 */
export async function getUserTestHistory(userId: string): Promise<TestHistoryItem[]> {
  try {
    const result = await query(
      `SELECT 
        ts.id,
        ts.test_id,
        COALESCE(ts.test_title, mt.title, 'Mock Test') as title,
        COALESCE(ts.subject, mt.subject, 'General') as subject,
        ts.score,
        ts.completed_at,
        ts.time_spent
      FROM test_submissions ts
      LEFT JOIN mock_tests mt ON ts.test_id = mt.id
      WHERE ts.user_id = $1
      ORDER BY ts.completed_at DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      testId: row.test_id,
      title: row.title,
      subject: row.subject,
      score: row.score,
      completedAt: row.completed_at.toISOString(),
      timeSpent: row.time_spent
    }));
  } catch (error) {
    console.error('Error retrieving user test history from database:', error);
    return [];
  }
}

// Define interfaces for better type safety
export interface TestHistoryItem {
  id: number | string;
  testId: string;
  title: string;
  subject: string;
  score: number;
  completedAt: string;
  timeSpent: number;
}

export interface SubjectPerformance {
  subject: string;
  score: number;
  questionsAnswered: number;
  testsCompleted: number;
  lastActivity: string;
}

export interface ProgressTrendItem {
  date: string;
  score: number;
  questionsAnswered: number;
}

export interface TestResult {
  questionId: string;
  isCorrect: boolean;
  userAnswer: string | number;
  correctAnswer?: string | number;
  marksObtained?: number;
  questionText?: string;
}

/**
 * Get user's recent test submissions (last 5)
 */
export async function getRecentTestSubmissions(userId: string): Promise<TestHistoryItem[]> {
  try {
    const result = await query(
      `SELECT 
        ts.id,
        ts.test_id,
        COALESCE(ts.test_title, mt.title, 'Mock Test') as title,
        COALESCE(ts.subject, mt.subject, 'General') as subject,
        ts.score,
        ts.completed_at,
        ts.time_spent
      FROM test_submissions ts
      LEFT JOIN mock_tests mt ON ts.test_id = mt.id
      WHERE ts.user_id = $1
      ORDER BY ts.completed_at DESC
      LIMIT 5`,
      [userId]
    );

    return result.rows.map(row => ({
      id: row.id,
      testId: row.test_id,
      title: row.title,
      subject: row.subject,
      score: row.score,
      completedAt: row.completed_at.toISOString(),
      timeSpent: row.time_spent
    }));
  } catch (error) {
    console.error('Error retrieving recent test submissions from database:', error);
    return [];
  }
}

/**
 * Get user performance statistics by subject
 */
export async function getUserPerformanceBySubject(userId: string): Promise<SubjectPerformance[]> {
  try {
    const result = await query(
      `SELECT 
        subject,
        AVG(score) as average_score,
        COUNT(*) as tests_completed,
        SUM(time_spent) as total_time_spent
      FROM test_submissions
      WHERE user_id = $1
      GROUP BY subject
      ORDER BY average_score DESC`,
      [userId]
    );

    return result.rows.map(row => ({
      subject: row.subject || 'General',
      score: parseFloat(row.average_score),
      questionsAnswered: parseInt(row.tests_completed),
      testsCompleted: parseInt(row.tests_completed),
      lastActivity: row.total_time_spent.toISOString()
    }));
  } catch (error) {
    console.error('Error retrieving user performance by subject from database:', error);
    return [];
  }
}

/**
 * Save detailed test results
 */
export async function saveTestResults(submissionId: number, results: TestResult[]): Promise<boolean> {
  try {
    // Begin transaction
    await query('BEGIN');
    
    for (const result of results) {
      await query(
        `INSERT INTO test_results
         (submission_id, question_id, user_answer, is_correct, marks_obtained, question_text)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          submissionId,
          result.questionId,
          result.userAnswer,
          result.isCorrect,
          result.marksObtained,
          result.questionText
        ]
      );
    }
    
    // Commit transaction
    await query('COMMIT');
    return true;
  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');
    console.error('Error saving test results to database:', error);
    return false;
  }
}

/**
 * Get detailed test results for a submission
 */
export async function getTestResults(submissionId: number): Promise<TestResult[]> {
  try {
    const result = await query(
      'SELECT * FROM test_results WHERE submission_id = $1',
      [submissionId]
    );

    return result.rows.map(row => ({
      questionId: row.question_id,
      userAnswer: row.user_answer,
      isCorrect: row.is_correct,
      marksObtained: row.marks_obtained,
      questionText: row.question_text
    }));
  } catch (error) {
    console.error('Error retrieving test results from database:', error);
    return [];
  }
}

/**
 * Get user's progress over time (weekly trend)
 */
export async function getUserProgressTrend(userId: string): Promise<ProgressTrendItem[]> {
  try {
    const result = await query(
      `SELECT 
        date,
        score,
        questions_answered
      FROM weekly_activity
      WHERE user_id = $1
      ORDER BY date DESC
      LIMIT 8`,
      [userId]
    );

    return result.rows.map(row => ({
      date: row.date,
      score: parseFloat(row.score),
      questionsAnswered: parseInt(row.questions_answered)
    }));
  } catch (error) {
    console.error('Error retrieving user progress trend from database:', error);
    return [];
  }
}