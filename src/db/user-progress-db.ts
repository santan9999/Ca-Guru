import { query } from '@/lib/db';

// Types for progress data
type SubjectProgress = {
  subject: string;
  score: number;
  questionsAnswered: number;
  testsCompleted: number;
  lastActivity: string;
};

type UserProgress = {
  userId: string;
  streak: number;
  lastLoginDate: string;
  totalQuestionsAnswered: number;
  totalTestsCompleted: number;
  averageScore: number;
  subjectProgress: SubjectProgress[];
  weeklyActivity: {
    date: string;
    score: number;
    questionsAnswered: number;
  }[];
};

/**
 * Get user progress from the database
 */
export async function getUserProgress(userId: string): Promise<UserProgress | null> {
  try {
    // Get the user progress metadata
    const progressResult = await query(
      'SELECT * FROM user_progress WHERE user_id = $1',
      [userId]
    );
    
    if (progressResult.rows.length === 0) {
      return null;
    }

    const progressData = progressResult.rows[0];

    // Get subject progress for this user
    const subjectProgressResult = await query(
      'SELECT * FROM subject_progress WHERE user_id = $1',
      [userId]
    );

    // Get weekly activity for this user
    const weeklyActivityResult = await query(
      'SELECT * FROM weekly_activity WHERE user_id = $1 ORDER BY date DESC LIMIT 7',
      [userId]
    );

    // Map database rows to SubjectProgress objects
    const subjectProgress = subjectProgressResult.rows.map(row => ({
      subject: row.subject,
      score: row.score,
      questionsAnswered: row.questions_answered,
      testsCompleted: row.tests_completed,
      lastActivity: row.last_activity
    }));

    // Map database rows to weekly activity objects
    const weeklyActivity = weeklyActivityResult.rows.map(row => ({
      date: row.date,
      score: row.score,
      questionsAnswered: row.questions_answered
    }));

    // Construct the full user progress object
    return {
      userId: progressData.user_id,
      streak: progressData.streak,
      lastLoginDate: progressData.last_login_date,
      totalQuestionsAnswered: progressData.total_questions_answered,
      totalTestsCompleted: progressData.total_tests_completed,
      averageScore: progressData.average_score,
      subjectProgress,
      weeklyActivity
    };
  } catch (error) {
    console.error('Error getting user progress from database:', error);
    return null;
  }
}

/**
 * Update user progress in the database
 */
export async function updateUserProgress(progress: UserProgress): Promise<boolean> {
  try {
    // Begin transaction
    await query('BEGIN');

    // Update or insert user progress metadata
    await query(
      `INSERT INTO user_progress 
       (user_id, streak, last_login_date, total_questions_answered, total_tests_completed, average_score) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       ON CONFLICT (user_id) DO UPDATE SET 
       streak = $2, last_login_date = $3, total_questions_answered = $4, 
       total_tests_completed = $5, average_score = $6`,
      [
        progress.userId,
        progress.streak,
        progress.lastLoginDate,
        progress.totalQuestionsAnswered,
        progress.totalTestsCompleted,
        progress.averageScore
      ]
    );

    // Update subject progress
    for (const subject of progress.subjectProgress) {
      await query(
        `INSERT INTO subject_progress 
         (user_id, subject, score, questions_answered, tests_completed, last_activity) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         ON CONFLICT (user_id, subject) DO UPDATE SET 
         score = $3, questions_answered = $4, tests_completed = $5, last_activity = $6`,
        [
          progress.userId,
          subject.subject,
          subject.score,
          subject.questionsAnswered,
          subject.testsCompleted,
          subject.lastActivity
        ]
      );
    }

    // Update weekly activity
    for (const activity of progress.weeklyActivity) {
      await query(
        `INSERT INTO weekly_activity 
         (user_id, date, score, questions_answered) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (user_id, date) DO UPDATE SET 
         score = $3, questions_answered = $4`,
        [
          progress.userId,
          activity.date,
          activity.score,
          activity.questionsAnswered
        ]
      );
    }

    // Commit transaction
    await query('COMMIT');
    return true;
  } catch (error) {
    // Rollback transaction on error
    await query('ROLLBACK');
    console.error('Error updating user progress in database:', error);
    return false;
  }
}

/**
 * Update user activity for today
 */
export async function updateUserActivity(userId: string, score: number, questionsAnswered: number): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    await query(
      `INSERT INTO weekly_activity 
       (user_id, date, score, questions_answered) 
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (user_id, date) DO UPDATE SET 
       score = weekly_activity.score + $3, 
       questions_answered = weekly_activity.questions_answered + $4`,
      [userId, today, score, questionsAnswered]
    );
    
    return true;
  } catch (error) {
    console.error('Error updating user activity in database:', error);
    return false;
  }
}