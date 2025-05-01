import { NextRequest, NextResponse } from 'next/server';
// Import the initialization module to ensure database is connected
import '../../_init';

// Import the database functions
import { getUserTestHistory } from '@/db/test-history-db';

// Import the safeDbOperation function from the main route file
import { safeDbOperation } from '../route';

// Using only database functions, no mock data

// GET endpoint to retrieve user's test history
export async function GET(req: NextRequest) {
  // Extract userId from query parameter instead of auth
  const userId = req.nextUrl.searchParams.get('userId');
  
  if (!userId) {
    console.warn('Missing userId parameter for test history');
    return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
  }

  try {
    console.log('Fetching test history for user:', userId);
    
    // Get the user's test history from the database using safeDbOperation
    const userHistory = await safeDbOperation(
      async () => await getUserTestHistory(userId!),
      []
    );
    
    if (!userHistory || userHistory.length === 0) {
      console.log('No test history found for user:', userId);
      return NextResponse.json([]);
    }

    console.log(`Found ${userHistory.length} test history entries for user:`, userId);
    return NextResponse.json(userHistory);
  } catch (error) {
    console.error('Error retrieving test history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve test history' },
      { status: 500 }
    );
  }
}