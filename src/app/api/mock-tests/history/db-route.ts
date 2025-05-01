import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
// Import the initialization module to ensure database is connected
import '../../_init';

// Import the database functions
import { getUserTestHistory } from '@/db/mock-tests-db';

// Using only database functions, no mock data

// GET endpoint to retrieve user's test history
export async function GET(req: NextRequest) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get the user's test history from the database
    const userHistory = await getUserTestHistory(userId);
    
    if (!userHistory || userHistory.length === 0) {
      return NextResponse.json([]);
    }

    return NextResponse.json(userHistory);
  } catch (error) {
    console.error('Error retrieving test history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve test history' },
      { status: 500 }
    );
  }
}