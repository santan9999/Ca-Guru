import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
// Import the initialization module to ensure database is connected
import '../_init';

// Import the database functions
import { getUserProgress, updateUserProgress, updateUserActivity } from '@/db/user-progress-db';

// No need for safeDbOperation as we're using direct database calls

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

// No mock database - using real database only

// Create empty progress data when needed
export function createEmptyUserProgress(userId: string): UserProgress {
  const today = new Date();
  return {
    userId,
    streak: 1,
    lastLoginDate: today.toISOString(),
    totalQuestionsAnswered: 0,
    totalTestsCompleted: 0,
    averageScore: 0,
    subjectProgress: [
      { subject: 'Taxation', score: 0, questionsAnswered: 0, testsCompleted: 0, lastActivity: today.toISOString() },
      { subject: 'Corporate Law', score: 0, questionsAnswered: 0, testsCompleted: 0, lastActivity: today.toISOString() },
      { subject: 'Accounting Standards', score: 0, questionsAnswered: 0, testsCompleted: 0, lastActivity: today.toISOString() },
      { subject: 'Auditing', score: 0, questionsAnswered: 0, testsCompleted: 0, lastActivity: today.toISOString() },
      { subject: 'Financial Management', score: 0, questionsAnswered: 0, testsCompleted: 0, lastActivity: today.toISOString() },
      { subject: 'Cost Accounting', score: 0, questionsAnswered: 0, testsCompleted: 0, lastActivity: today.toISOString() },
    ],
    weeklyActivity: [],
  };
}

// GET endpoint to retrieve user progress
export async function GET(req: NextRequest) {
  try {
    const authResult = await auth();
    const userId = authResult?.userId;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's progress from the database
    let progress = await getUserProgress(userId);
    
    // If no progress exists in the database, create a new one
    if (!progress) {
      progress = createEmptyUserProgress(userId);
      await updateUserProgress(progress);
    }

    // Update streak and last login date
    const today = new Date().toISOString().split('T')[0];
    const lastLogin = new Date(progress.lastLoginDate).toISOString().split('T')[0];
    
    if (today !== lastLogin) {
      const lastLoginDate = new Date(lastLogin);
      const todayDate = new Date(today);
      const diffTime = Math.abs(todayDate.getTime() - lastLoginDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Consecutive day login - increase streak
        progress.streak += 1;
      } else if (diffDays > 1) {
        // Streak broken
        progress.streak = 1;
      }
      
      progress.lastLoginDate = today;
      
      // Update the progress in the database
      await updateUserProgress(progress);
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error retrieving progress data:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve progress data' },
      { status: 500 }
    );
  }
}

// POST endpoint to update user progress
export async function POST(req: NextRequest) {
  const authResult = await auth();
  const userId = authResult?.userId;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { activity } = await req.json();

    // Validate request
    if (!activity || !activity.type) {
      return NextResponse.json(
        { error: 'Activity data is required' },
        { status: 400 }
      );
    }

    // Get current progress from database
    let progress = await getUserProgress(userId);
    
    // If no progress exists in the database, create a new one
    if (!progress) {
      progress = createEmptyUserProgress(userId);
      await updateUserProgress(progress);
    }
    
    // Update progress based on activity type
    switch (activity.type) {
      case 'question_answered': {
        const { subject, isCorrect } = activity;
        if (!subject) {
          return NextResponse.json(
            { error: 'Subject is required for question activity' },
            { status: 400 }
          );
        }
        
        // Find subject progress
        const subjectProgress = progress.subjectProgress.find(s => s.subject === subject);
        if (subjectProgress) {
          // Update subject progress
          subjectProgress.questionsAnswered += 1;
          if (isCorrect) {
            // Update score (weighted average)
            const oldTotal = subjectProgress.score * (subjectProgress.questionsAnswered - 1);
            const newTotal = oldTotal + 100; // 100 for correct answer
            subjectProgress.score = Math.round(newTotal / subjectProgress.questionsAnswered);
          }
          subjectProgress.lastActivity = new Date().toISOString();
        }
        
        // Update total questions answered
        progress.totalQuestionsAnswered += 1;
        
        // Update average score across all subjects
        const totalAnswered = progress.subjectProgress.reduce((sum, s) => sum + s.questionsAnswered, 0);
        const weightedScoreSum = progress.subjectProgress.reduce(
          (sum, s) => sum + (s.score * s.questionsAnswered), 0
        );
        progress.averageScore = totalAnswered > 0 ? Math.round(weightedScoreSum / totalAnswered) : 0;
        
        // Update today's activity
        const today = new Date().toISOString().split('T')[0];
        const todayActivity = progress.weeklyActivity.find(a => a.date === today);
        if (todayActivity) {
          todayActivity.questionsAnswered += 1;
          todayActivity.score = progress.averageScore;
        } else {
          progress.weeklyActivity.push({
            date: today,
            score: progress.averageScore,
            questionsAnswered: 1
          });
          // Keep only the last 7 days
          if (progress.weeklyActivity.length > 7) {
            progress.weeklyActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            progress.weeklyActivity = progress.weeklyActivity.slice(0, 7);
          }
        }
        
        // Update database
        await updateUserProgress(progress);
        await updateUserActivity(userId, isCorrect ? 100 : 0, 1);
        
        break;
      }
      
      case 'test_completed': {
        const { subject, score, questionsAnswered } = activity;
        if (!subject || score === undefined) {
          return NextResponse.json(
            { error: 'Subject and score are required for test activity' },
            { status: 400 }
          );
        }
        
        // Find subject progress
        const subjectProgress = progress.subjectProgress.find(s => s.subject === subject);
        if (subjectProgress) {
          // Update subject progress
          subjectProgress.testsCompleted += 1;
          subjectProgress.questionsAnswered += questionsAnswered || 0;
          
          // Update score (weighted average with existing score)
          const oldWeight = 0.7; // Give 70% weight to previous performance
          const newWeight = 0.3; // Give 30% weight to new test
          subjectProgress.score = Math.round(
            (subjectProgress.score * oldWeight) + (score * newWeight)
          );
          
          subjectProgress.lastActivity = new Date().toISOString();
        }
        
        // Update total tests completed
        progress.totalTestsCompleted += 1;
        
        // Update average score across all subjects (same as in question_answered)
        const totalAnswered = progress.subjectProgress.reduce((sum, s) => sum + s.questionsAnswered, 0);
        const weightedScoreSum = progress.subjectProgress.reduce(
          (sum, s) => sum + (s.score * s.questionsAnswered), 0
        );
        progress.averageScore = totalAnswered > 0 ? Math.round(weightedScoreSum / totalAnswered) : 0;
        
        // Update today's activity
        const today = new Date().toISOString().split('T')[0];
        const todayActivity = progress.weeklyActivity.find(a => a.date === today);
        if (todayActivity) {
          todayActivity.questionsAnswered += questionsAnswered || 0;
          todayActivity.score = progress.averageScore;
        } else {
          progress.weeklyActivity.push({
            date: today,
            score: progress.averageScore,
            questionsAnswered: questionsAnswered || 0
          });
          // Keep only the last 7 days
          if (progress.weeklyActivity.length > 7) {
            progress.weeklyActivity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            progress.weeklyActivity = progress.weeklyActivity.slice(0, 7);
          }
        }
        
        // Update database
        await updateUserProgress(progress);
        await updateUserActivity(userId, score, questionsAnswered || 0);
        
        break;
      }
      
      default:
        return NextResponse.json(
          { error: 'Unknown activity type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      progress
    });
  } catch (error) {
    console.error('Error updating progress:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}