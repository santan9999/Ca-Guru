-- SQL Script for creating mock test related tables in Neon Tech database

-- Create mock_tests table to store test templates
CREATE TABLE IF NOT EXISTS mock_tests (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  duration INTEGER NOT NULL,
  question_count INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  exam_level TEXT NOT NULL,
  paper_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create questions table to store test questions
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  test_id TEXT REFERENCES mock_tests(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  type TEXT NOT NULL,
  options JSONB,
  correct_answer INTEGER,
  is_compulsory BOOLEAN DEFAULT TRUE,
  marks INTEGER DEFAULT 1
);

-- Create test_submissions table to store user test submissions
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
);

-- Create test_results table to store detailed test results
CREATE TABLE IF NOT EXISTS test_results (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER REFERENCES test_submissions(id) ON DELETE CASCADE,
  question_id TEXT REFERENCES questions(id) ON DELETE CASCADE,
  user_answer INTEGER,
  is_correct BOOLEAN NOT NULL,
  marks_obtained NUMERIC(5,2) NOT NULL,
  question_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);