import { Pool } from 'pg';

// Check if DATABASE_URL is defined
if (!process.env.DATABASE_URL) {
  console.warn('WARNING: DATABASE_URL environment variable is not set. Database functionality will be limited.');
}

// Create a PostgreSQL connection pool with Neon-specific settings
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Required for Neon Tech PostgreSQL
  },
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
  connectionTimeoutMillis: 5000, // Increased timeout for Neon's serverless connections
});

// Test the connection
pool.on('connect', () => {
  console.log('Connected to Neon PostgreSQL database');
});

pool.on('error', (err) => {
  // Don't crash the application on connection errors
  console.error('Database connection error:', err);
  // Only exit in development, not in production
  if (process.env.NODE_ENV === 'development') {
    console.error('Exiting due to database error in development mode');
    process.exit(-1);
  }
});

// Helper function to execute SQL queries with improved error handling
export async function query(text: string, params?: any[]) {
  let client;
  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    // Rethrow the error for the caller to handle
    throw error;
  } finally {
    if (client) client.release();
  }
}

// Initialize database tables if they don't exist
export async function initDatabase() {
  try {
    // Create users table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        streak INTEGER DEFAULT 1,
        last_login_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        total_questions_answered INTEGER DEFAULT 0,
        total_tests_completed INTEGER DEFAULT 0,
        average_score NUMERIC(5,2) DEFAULT 0
      )
    `);
    
    // Create user_queries table for logging Q&A interactions
    await query(`
      CREATE TABLE IF NOT EXISTS user_queries (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        subject TEXT NOT NULL,
        query TEXT NOT NULL,
        response TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create subject_progress table
    await query(`
      CREATE TABLE IF NOT EXISTS subject_progress (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        subject TEXT NOT NULL,
        score NUMERIC(5,2) DEFAULT 0,
        questions_answered INTEGER DEFAULT 0,
        tests_completed INTEGER DEFAULT 0,
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create weekly_activity table
    await query(`
      CREATE TABLE IF NOT EXISTS weekly_activity (
        id SERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        date DATE NOT NULL,
        score NUMERIC(5,2) DEFAULT 0,
        questions_answered INTEGER DEFAULT 0
      )
    `);

    // Create mock_tests table
    await query(`
      CREATE TABLE IF NOT EXISTS mock_tests (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        subject TEXT NOT NULL,
        duration INTEGER NOT NULL,
        question_count INTEGER NOT NULL,
        difficulty TEXT NOT NULL,
        exam_level TEXT NOT NULL DEFAULT 'Foundation',
        paper_type TEXT NOT NULL DEFAULT 'Mixed'
      )
    `);

    // Create questions table
    await query(`
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        test_id TEXT REFERENCES mock_tests(id) ON DELETE CASCADE,
        text TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'MCQ',
        options JSONB NOT NULL DEFAULT '[]',
        correct_answer INTEGER,
        is_compulsory BOOLEAN DEFAULT false,
        marks INTEGER DEFAULT 1
      )
    `);

    // Create test_submissions table
    await query(`
      CREATE TABLE IF NOT EXISTS test_submissions (
        id SERIAL PRIMARY KEY,
        test_id TEXT REFERENCES mock_tests(id) ON DELETE CASCADE,
        user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
        answers JSONB NOT NULL,
        score NUMERIC(5,2) NOT NULL,
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        time_spent INTEGER NOT NULL,
        test_title TEXT,
        subject TEXT
      )
    `);

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Export the pool for direct use if needed
export default pool;