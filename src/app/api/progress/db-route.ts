import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
// Import the initialization module to ensure database is connected
import '../_init';

// Import the database functions
import { getUserProgress, updateUserProgress, updateUserActivity } from '@/db/user-progress-db';

// Import the createEmptyUserProgress function
import { createEmptyUserProgress } from './route';

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
        const subjectProgress = progress.subjectProgress.find((s: any) => s.subject === subject);
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
        const totalAnswered = progress.subjectProgress.reduce((sum: number, a: any) => sum + a.questionsAnswered, 0);
        const weightedScoreSum = progress.subjectProgress.reduce(
          (sum: number, a: any) => sum + (a.score * a.questionsAnswered), 0
        );
        progress.averageScore = totalAnswered > 0 ? Math.round(weightedScoreSum / totalAnswered) : 0;
        
        // Update today's activity
        const today = new Date().toISOString().split('T')[0];
        let todayActivity = progress.weeklyActivity.find((a: any) => a.date === today);
        if (!todayActivity) {
          todayActivity = {
            date: today,
            score: 0,
            questionsAnswered: 0
          };
          progress.weeklyActivity.unshift(todayActivity);
        }
        todayActivity.questionsAnswered += 1;
        if (isCorrect) {
          todayActivity.score = Math.round(
            ((todayActivity.score * (todayActivity.questionsAnswered - 1)) + 100) / todayActivity.questionsAnswered
          );
        }
        
        // Update database
        await updateUserProgress(progress);
        await updateUserActivity(userId, isCorrect ? 100 : 0, 1);
        
        break;
      }
      case 'test_completed': {
        const { subject, score, questionsAnswered } = activity;
        if (!subject || score === undefined || !questionsAnswered) {
          return NextResponse.json(
            { error: 'Subject, score, and questionsAnswered are required for test activity' },
            { status: 400 }
          );
        }
        
        // Find subject progress
        const subjectProgress = progress.subjectProgress.find((s: any) => s.subject === subject);
        if (subjectProgress) {
          // Update subject progress
          subjectProgress.testsCompleted += 1;
          subjectProgress.questionsAnswered += questionsAnswered;
          
          // Update score (weighted average)
          const oldTotal = subjectProgress.score * (subjectProgress.questionsAnswered - questionsAnswered);
          const newTotal = oldTotal + (score * questionsAnswered);
          subjectProgress.score = Math.round(newTotal / subjectProgress.questionsAnswered);
          
          subjectProgress.lastActivity = new Date().toISOString();
        }
        
        // Update total tests completed and questions answered
        progress.totalTestsCompleted += 1;
        progress.totalQuestionsAnswered += questionsAnswered;
        
        // Update average score across all subjects
        const totalAnswered = progress.subjectProgress.reduce((sum: number, a: any) => sum + a.questionsAnswered, 0);
        const weightedScoreSum = progress.subjectProgress.reduce(
          (sum: number, a: any) => sum + (a.score * a.questionsAnswered), 0
        );
        progress.averageScore = totalAnswered > 0 ? Math.round(weightedScoreSum / totalAnswered) : 0;
        
        // Update today's activity
        const today = new Date().toISOString().split('T')[0];
        let todayActivity = progress.weeklyActivity.find((a: any) => a.date === today);
        if (!todayActivity) {
          todayActivity = {
            date: today,
            score: 0,
            questionsAnswered: 0
          };
          progress.weeklyActivity.unshift(todayActivity);
        }
        todayActivity.questionsAnswered += questionsAnswered;
        todayActivity.score = Math.round(
          ((todayActivity.score * (todayActivity.questionsAnswered - questionsAnswered)) + (score * questionsAnswered)) / todayActivity.questionsAnswered
        );
        
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
    
    return NextResponse.json(progress);
  } catch (error) {
    console.error('Error updating progress data:', error);
    return NextResponse.json(
      { error: 'Failed to update progress' },
      { status: 500 }
    );
  }
}