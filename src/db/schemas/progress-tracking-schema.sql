-- SQL Schema for Progress Tracking

-- User Progress Table
CREATE TABLE IF NOT EXISTS user_progress (
  user_id TEXT PRIMARY KEY,
  streak INTEGER DEFAULT 1,
  last_login_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  total_questions_answered INTEGER DEFAULT 0,
  total_tests_completed INTEGER DEFAULT 0,
  average_score NUMERIC(5,2) DEFAULT 0
);

-- Subject Progress Table
CREATE TABLE IF NOT EXISTS subject_progress (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  score NUMERIC(5,2) DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  tests_completed INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, subject),
  FOREIGN KEY (user_id) REFERENCES user_progress(user_id) ON DELETE CASCADE
);

-- Weekly Activity Table
CREATE TABLE IF NOT EXISTS weekly_activity (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  score NUMERIC(5,2) DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  UNIQUE(user_id, date),
  FOREIGN KEY (user_id) REFERENCES user_progress(user_id) ON DELETE CASCADE
);

-- User Achievements Table
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  achievement_type TEXT NOT NULL,
  achievement_name TEXT NOT NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_progress(user_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_subject_progress_user_id ON subject_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_subject_progress_subject ON subject_progress(subject);
CREATE INDEX IF NOT EXISTS idx_weekly_activity_user_id ON weekly_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_activity_date ON weekly_activity(date);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);