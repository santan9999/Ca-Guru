-- SQL Schema for Test History

-- Test History Table
CREATE TABLE IF NOT EXISTS test_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  test_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  time_spent INTEGER NOT NULL, -- in seconds
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Test Question Responses Table
CREATE TABLE IF NOT EXISTS test_question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_history_id UUID NOT NULL,
  question_id TEXT NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  time_taken INTEGER, -- in seconds
  FOREIGN KEY (test_history_id) REFERENCES test_history(id) ON DELETE CASCADE
);

-- Test Performance Analytics Table
CREATE TABLE IF NOT EXISTS test_performance_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  average_score NUMERIC(5,2) NOT NULL,
  tests_taken INTEGER NOT NULL,
  last_test_date TIMESTAMP WITH TIME ZONE,
  improvement_rate NUMERIC(5,2), -- percentage improvement between tests
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_test_history_user_id ON test_history(user_id);
CREATE INDEX IF NOT EXISTS idx_test_history_subject ON test_history(subject);
CREATE INDEX IF NOT EXISTS idx_test_question_responses_test_history_id ON test_question_responses(test_history_id);
CREATE INDEX IF NOT EXISTS idx_test_performance_analytics_user_id ON test_performance_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_test_performance_analytics_subject ON test_performance_analytics(subject);