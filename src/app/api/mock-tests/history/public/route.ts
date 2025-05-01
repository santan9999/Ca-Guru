import { NextRequest, NextResponse } from 'next/server';
// Import the initialization module to ensure database is connected
import '../../../_init';

// Import the database functions
import { getAllTestHistory, getUserTestHistory } from '@/db/test-history-db';

// Import the safeDbOperation function from the main route file
import { safeDbOperation } from '../../route';

/**
 * Public API endpoint for test history
 * This endpoint allows access to test history without authentication
 * It can be used to retrieve all test history or filter by userId
 */
export async function GET(req: NextRequest) {
  // Extract userId from query parameter if provided
  const userId = req.nextUrl.searchParams.get('userId');
  
  try {
    if (userId) {
      console.log(`Fetching public test history for user: ${userId}`);
      
      // Get the user's test history from the database using safeDbOperation
      const userHistory = await safeDbOperation(
        async () => await getUserTestHistory(userId),
        []
      );
      
      if (!userHistory || userHistory.length === 0) {
        console.log(`No test history found for user: ${userId}`);
        return NextResponse.json([]);
      }

      console.log(`Found ${userHistory.length} test history entries for user: ${userId}`);
      return NextResponse.json(userHistory);
    } else {
      console.log('Fetching all public test history');
      
      // Get all test history from the database using safeDbOperation
      const allHistory = await safeDbOperation(
        async () => await getAllTestHistory(),
        []
      );
      
      if (!allHistory || allHistory.length === 0) {
        console.log('No test history found');
        return NextResponse.json([]);
      }

      console.log(`Found ${allHistory.length} total test history entries`);
      return NextResponse.json(allHistory);
    }
  } catch (error) {
    console.error('Error retrieving public test history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve test history' },
      { status: 500 }
    );
  }
}