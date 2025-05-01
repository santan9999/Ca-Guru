import { query } from '@/lib/db';

/**
 * Types for test history data
 */
type TestHistory = {
  id?: string;
  userId: string;
  testId: string;
  title: string;
  subject: string;
  score: number;
  completedAt?: string;
  timeSpent: number;
};

type TestQuestionResponse = {
  id?: string;
  testHistoryId: string;
  questionId: string;
  userAnswer?: string;
  isCorrect: boolean;
  timeTaken?: number;
};

/**
 * Save test history to the database
 */
export async function saveTestHistory(testHistory: TestHistory, questionResponses: TestQuestionResponse[]): Promise<boolean> {
  try {
    // Begin transaction
    await query('BEGIN');
    
    // Insert test history
    const result = await query(
      `INSERT INTO test_history 
       (user_id, test_id, title, subject, score, completed_at, time_spent) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING id`,
      [
        testHistory.userId,
        testHistory.testId,
        testHistory.title,
        testHistory.subject,
        testHistory.score,
        testHistory.completedAt || new Date().toISOString(),
        testHistory.timeSpent
      ]
    );
    
    const testHistoryId = result.rows[0].id;
    
    // Insert question responses
    for (const response of questionResponses) {
      await query(
        `INSERT INTO test_question_responses 
         (test_history_id, question_id, user_answer, is_correct, time_taken) 
         VALUES ($1, $2, $3, $4, $5)`,
        [
          testHistoryId,
          response.questionId,
          response.userAnswer || null,
          response.isCorrect,
          response.timeTaken || null
        ]
      );
    }
    
    // Commit transaction
    await query('COMMIT');
    return true;
  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');
    console.error('Error saving test history to database:', error);
    return false;
  }
}

/**
 * Get test history for a user
 */
export async function getUserTestHistory(userId: string): Promise<TestHistory[]> {
  try {
    console.log(`Attempting to fetch test history for user: ${userId}`);
    const result = await query(
      `SELECT * FROM test_history 
       WHERE user_id = $1 
       ORDER BY completed_at DESC`,
      [userId]
    );

    console.log(`Found ${result.rows.length} test history entries for user: ${userId}`);
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      testId: row.test_id,
      title: row.title,
      subject: row.subject,
      score: row.score,
      completedAt: row.completed_at ? row.completed_at.toISOString() : new Date().toISOString(),
      timeSpent: row.time_spent
    }));
  } catch (error) {
    console.error('Error retrieving user test history from database:', error);
    return [];
  }
}

/**
 * Get all test history (for admin or public access)
 */
export async function getAllTestHistory(): Promise<TestHistory[]> {
  try {
    console.log('Fetching all test history entries');
    const result = await query(
      `SELECT * FROM test_history 
       ORDER BY completed_at DESC 
       LIMIT 100`,
      []
    );

    console.log(`Found ${result.rows.length} total test history entries`);
    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      testId: row.test_id,
      title: row.title,
      subject: row.subject,
      score: row.score,
      completedAt: row.completed_at ? row.completed_at.toISOString() : new Date().toISOString(),
      timeSpent: row.time_spent
    }));
  } catch (error) {
    console.error('Error retrieving all test history from database:', error);
    return [];
  }
}

/**
 * Get test question responses for a test history entry
 */
export async function getTestQuestionResponses(testHistoryId: string): Promise<TestQuestionResponse[]> {
  try {
    const result = await query(
      `SELECT * FROM test_question_responses 
       WHERE test_history_id = $1`,
      [testHistoryId]
    );

    return result.rows.map(row => ({
      id: row.id,
      testHistoryId: row.test_history_id,
      questionId: row.question_id,
      userAnswer: row.user_answer,
      isCorrect: row.is_correct,
      timeTaken: row.time_taken
    }));
  } catch (error) {
    console.error('Error retrieving test question responses from database:', error);
    return [];
  }
}

/**
 * Update test performance analytics
 */
export async function updateTestPerformanceAnalytics(userId: string, subject: string, topic: string, score: number): Promise<boolean> {
  try {
    // Check if analytics entry exists
    const checkResult = await query(
      `SELECT * FROM test_performance_analytics 
       WHERE user_id = $1 AND subject = $2 AND topic = $3`,
      [userId, subject, topic]
    );
    
    const now = new Date().toISOString();
    
    if (checkResult.rows.length > 0) {
      // Update existing entry
      const currentData = checkResult.rows[0];
      const testsTaken = currentData.tests_taken + 1;
      const oldAverage = currentData.average_score;
      const newAverage = ((oldAverage * (testsTaken - 1)) + score) / testsTaken;
      
      // Calculate improvement rate
      let improvementRate = null;
      if (testsTaken > 1) {
        improvementRate = score - oldAverage;
      }
      
      await query(
        `UPDATE test_performance_analytics 
         SET average_score = $1, 
             tests_taken = $2, 
             last_test_date = $3, 
             improvement_rate = $4 
         WHERE user_id = $5 AND subject = $6 AND topic = $7`,
        [newAverage, testsTaken, now, improvementRate, userId, subject, topic]
      );
    } else {
      // Create new entry
      await query(
        `INSERT INTO test_performance_analytics 
         (user_id, subject, topic, average_score, tests_taken, last_test_date) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, subject, topic, score, 1, now]
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error updating test performance analytics in database:', error);
    return false;
  }
}