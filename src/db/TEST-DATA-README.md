# Test Data SQL Queries

This document provides an overview of the SQL queries implemented for managing test submissions, user progress, and test history in the CA.AI application.

## Overview

The SQL queries in this project are designed to:

1. Save test submissions when users complete tests
2. Update user progress metrics across multiple tables
3. Retrieve test history and performance statistics
4. Store and retrieve detailed test results

## Files

### `mock-tests-queries.sql`

Contains all the SQL queries used for test data operations, including:

- Inserting new test submissions
- Updating user progress when tests are completed
- Retrieving test history and performance statistics
- Managing detailed test results

### `mock-tests-db.ts`

Implements TypeScript functions that use the SQL queries to interact with the database:

- `saveTestSubmission()`: Saves a test submission and updates user progress
- `getUserTestHistory()`: Retrieves a user's complete test history
- `getRecentTestSubmissions()`: Gets a user's 5 most recent test submissions
- `getUserPerformanceBySubject()`: Retrieves performance statistics by subject
- `saveTestResults()`: Saves detailed results for each question in a test
- `getTestResults()`: Retrieves detailed results for a specific submission
- `getUserProgressTrend()`: Gets a user's progress over time (weekly trend)

## Database Schema

The test data is stored across multiple tables:

- `test_submissions`: Stores overall test submission data
- `test_results`: Stores detailed results for each question
- `user_progress`: Tracks overall user progress metrics
- `subject_progress`: Tracks progress by subject
- `weekly_activity`: Tracks user activity over time

## Transaction Management

All operations that update multiple tables use database transactions to ensure data consistency. If any part of the operation fails, the entire transaction is rolled back to prevent partial updates.

## Usage Example

```typescript
// Save a test submission
const submission = {
  testId: 'test-123',
  userId: 'user-456',
  answers: { 'q1': 2, 'q2': 0, 'q3': 3 },
  score: 75.5,
  completedAt: new Date().toISOString(),
  timeSpent: 1800, // 30 minutes in seconds
  testTitle: 'Financial Accounting Mock Test',
  subject: 'Accounting'
};

const success = await saveTestSubmission(submission);

// Get user's test history
const testHistory = await getUserTestHistory('user-456');

// Get user's performance by subject
const subjectPerformance = await getUserPerformanceBySubject('user-456');
```

## Performance Considerations

- The queries use PostgreSQL's `ON CONFLICT` clause for upsert operations
- Indexes are created on frequently queried columns
- Transactions ensure data consistency across related tables