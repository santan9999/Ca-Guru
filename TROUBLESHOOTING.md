# CA Guru AI - Troubleshooting Guide

## Database Issues

### 1. Foreign Key Constraint Violation

**Error:**
```
Error logging query to database: error: insert or update on table "user_queries" violates foreign key constraint "user_queries_user_id_fkey"
Key (user_id)=(user_2w99RrmVL4V2m31uUD82XJWm3to) is not present in table "users".
```

**Solution:**
1. The error occurs because the application is trying to insert records into `user_queries` table before creating the user in the `users` table.
2. Implement the following fix:

```typescript
// Add to src/app/api/qa/route.ts and other API endpoints
import { ensureUserExists } from '@/db/user-db';

// Inside POST handler, before saving any user data:
await ensureUserExists(userId);
```

3. Create the `ensureUserExists` function if it doesn't exist:

```typescript
// In src/db/user-db.ts
export async function ensureUserExists(userId: string) {
  try {
    // Check if user exists
    const result = await query('SELECT id FROM users WHERE id = $1', [userId]);
    
    // If user doesn't exist, create a new user record
    if (result.rowCount === 0) {
      await query(
        'INSERT INTO users (id, streak, last_login_date) VALUES ($1, 1, CURRENT_TIMESTAMP)',
        [userId]
      );
      console.log(`Created new user record for ${userId}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring user exists:', error);
    return false;
  }
}
```

### 2. Missing Column Error

**Error:**
```
Database query error: error: column "email" does not exist
```

**Solution:**
1. The error occurs because there's a reference to an `email` column in the users schema file, but this column doesn't exist in the table definition.
2. Edit the schema file:

```sql
-- In src/db/schemas/users-schema.sql
-- Remove or comment out any references to an email column or indexes
-- For example, change:
-- CREATE INDEX idx_users_email ON users(email);
-- To:
-- -- CREATE INDEX idx_users_email ON users(email);
```

3. Alternatively, add the email column to the users table:

```sql
-- In src/db/schemas/users-schema.sql, modify the table creation:
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
```

## DeepSeek API Issues

### Error Parsing JSON Response

**Error:**
```
Error generating question: SyntaxError: Unexpected token 'I', "I'm sorry,"... is not valid JSON
```

**Solution:**
1. The API is returning a text response instead of JSON. Update the question generator to handle this case:

```typescript
// In src/lib/question-generator.ts
async function generateQuestion(/* params */) {
  try {
    // ... existing code ...
    
    let questionData;
    try {
      // Try to parse as JSON
      questionData = JSON.parse(response);
    } catch (parseError) {
      // If parsing fails, create a fallback structure
      console.warn("Failed to parse API response as JSON, using fallback");
      questionData = {
        id: `fallback-${Date.now()}`,
        text: "Fallback question due to API error",
        type: "MCQ",
        options: [
          "Option A",
          "Option B",
          "Option C",
          "Option D"
        ],
        correctAnswer: 0
      };
    }
    
    // ... continue with the rest of the function ...
  } catch (error) {
    console.error("Error in question generation:", error);
    throw error;
  }
}
```

### API Connection Issues

**Error:**
```
Error calling DeepSeek API: [TypeError: terminated]
[Error [SocketError]: other side closed]
```

**Solution:**
1. Implement retry logic for API calls:

```typescript
// In src/lib/deepseek.ts
async function callDeepSeekWithRetry(payload, maxRetries = 3) {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      const response = await fetch(DEEPSEEK_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (!response.ok) {
        throw new Error(`API returned ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      retries++;
      console.warn(`API call failed (attempt ${retries}/${maxRetries}):`, error);
      
      if (retries >= maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));
    }
  }
}
```

2. Implement failover to static content:

```typescript
// In src/lib/question-generator.ts
// If API fails after retries, use fallback question banks
if (apiError) {
  console.warn("Using static question banks due to API failure");
  return fallbackToStaticQuestions(subject, count, type);
}
```

## General Recommendations

1. **Better Error Handling**: Implement try/catch blocks in all database and API operations
2. **Graceful Degradation**: Ensure the application can function with reduced capabilities when services are unavailable
3. **Database Connection Pooling**: Optimize database pool settings for your environment
4. **Logging**: Implement structured logging for easier debugging
5. **User Initialization**: Ensure user records are created on first authentication
6. **Schema Validation**: Validate all API responses and database schema changes

## Database Schema Updates

Consider updating your database initialization to use Prisma or another ORM for better schema management and migration support.

If you continue with raw SQL, implement proper migration scripts that can be applied sequentially to avoid schema conflicts. 