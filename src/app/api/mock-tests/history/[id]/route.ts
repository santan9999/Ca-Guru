import { NextRequest, NextResponse } from 'next/server';
// Import the initialization module to ensure database is connected
import '../../../_init';

// Import the database functions
import { getUserTestHistory, getTestQuestionResponses } from '@/db/test-history-db';
import { ensureUserExists } from '@/db/user-db';

// Import the safeDbOperation function
import { safeDbOperation } from '../../route';

// GET endpoint to retrieve detailed test history for a specific entry
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  // Extract userId from query parameter instead of auth
  const userId = req.nextUrl.searchParams.get('userId');
  
  if (!userId) {
    console.warn('Missing userId parameter for test history detail');
    return NextResponse.json({ error: 'UserId is required', message: 'User authentication required. Please sign in to view test history.' }, { status: 400 });
  }

  const testHistoryId = params.id;
  if (!testHistoryId) {
    return NextResponse.json({ error: 'Test history ID is required' }, { status: 400 });
  }

  try {
    console.log(`Fetching test history detail for ID: ${testHistoryId}`);
    
    // Ensure the user exists in the database to prevent foreign key constraint errors
    await safeDbOperation(
      async () => await ensureUserExists(userId!),
      false
    );
    
    // Get the test history entries for this user
    const userHistory = await safeDbOperation(
      async () => await getUserTestHistory(userId!),
      []
    );
    
    // Find the specific test history entry
    const testHistory = userHistory.find(entry => entry.id === testHistoryId);
    
    if (!testHistory) {
      console.log(`Test history not found for ID: ${testHistoryId}`);
      return NextResponse.json({ error: 'Test history not found' }, { status: 404 });
    }
    
    // Get the question responses for this test history entry
    const questionResponses = await safeDbOperation(
      async () => await getTestQuestionResponses(testHistoryId),
      []
    );
    
    // Combine the test history with its question responses
    const testHistoryDetail = {
      ...testHistory,
      questionResponses
    };
    
    console.log(`Found test history detail with ${questionResponses.length} question responses`);
    return NextResponse.json(testHistoryDetail);
  } catch (error) {
    console.error('Error retrieving test history detail:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve test history detail' },
      { status: 500 }
    );
  }
}