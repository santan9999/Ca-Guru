import { NextRequest, NextResponse } from 'next/server';
// Import the initialization module to ensure database is connected
import '../../../_init';

// Import the database functions
import { getAllTestHistory, getUserTestHistory } from '@/db/test-history-db';
import { ensureUserExists } from '@/db/user-db';

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
      
      // Ensure the user exists in the database to prevent foreign key constraint errors
      await safeDbOperation(
        async () => await ensureUserExists(userId),
        false
      );
      
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
      // Remove admin functionality - don't allow fetching all test history
      return NextResponse.json(
        { error: 'UserId is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error retrieving public test history:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve test history' },
      { status: 500 }
    );
  }
}