# Mock Tests Database Integration

This directory contains database scripts and utilities for the mock tests functionality. These files help resolve the database connection issues for mock tests generation and submission.

## Files Overview

### 1. `mock-tests-schema.sql`

This SQL script contains all the necessary table creation statements for the mock tests database. It includes tables for:

- `mock_tests`: Stores test templates
- `questions`: Stores test questions
- `test_submissions`: Stores user test submissions
- `test_results`: Stores detailed test results

### 2. `mock-tests-db.ts`

This TypeScript file provides database functions for interacting with the mock tests tables:

- `saveMockTest`: Saves a mock test to the database
- `getMockTest`: Retrieves a mock test from the database
- `saveTestSubmission`: Saves a test submission to the database
- `getTestSubmission`: Retrieves a test submission from the database
- `getUserTestHistory`: Retrieves all test submissions for a user

## Updated API Routes

The following API routes have been updated to use the database functions:

- `/api/mock-tests/db-route.ts`: Main route for retrieving and submitting mock tests
- `/api/mock-tests/history/db-route.ts`: Route for retrieving user's test history
- `/api/mock-tests/results/[id]/db-route.ts`: Route for retrieving a specific test result

## How to Use

### 1. Set Up the Database

Ensure your Neon Tech database is properly configured with the `DATABASE_URL` environment variable. Then run the SQL script to create the necessary tables:

```bash
# Connect to your Neon Tech database and run the SQL script
# Example using psql (replace with your actual connection details)
psql -h your-neon-host.neon.tech -d your-database -U your-username -f mock-tests-schema.sql
```

### 2. Update API Routes

To use the new database-enabled routes, rename the files:

```bash
# Rename the main route
mv src/app/api/mock-tests/db-route.ts src/app/api/mock-tests/route.ts

# Rename the history route
mv src/app/api/mock-tests/history/db-route.ts src/app/api/mock-tests/history/route.ts

# Rename the results route
mv src/app/api/mock-tests/results/[id]/db-route.ts src/app/api/mock-tests/results/[id]/route.ts
```

### 3. Test the Connection

After updating the routes, test the connection by generating a mock test. The application will now try to use the database first and fall back to in-memory storage if the database is unavailable.

## Troubleshooting

If you encounter database connection issues:

1. Verify that your `DATABASE_URL` environment variable is correctly set
2. Check that the Neon Tech database is accessible from your deployment environment
3. Ensure the database tables have been created using the provided SQL script
4. Check the application logs for specific error messages

The application includes a fallback mechanism that will use in-memory storage if the database connection fails, so the mock tests functionality should continue to work even if there are database issues.