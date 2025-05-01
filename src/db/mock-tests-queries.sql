-- SQL Queries for Mock Tests Database Operations

-- 1. Insert a new test submission
-- Used when a user completes a test
INSERT INTO test_submissions 
(test_id, user_id, answers, score, completed_at, time_spent, test_title, subject) 
VALUES 
($1, $2, $3, $4, $5, $6, $7, $8) 
RETURNING id;

-- 2. Update user progress when a test is completed
-- This is a transaction that updates multiple tables
BEGIN;
  -- Update user_progress table
  INSERT INTO user_progress 
  (user_id, streak, last_login_date, total_questions_answered, total_tests_completed, average_score) 
  VALUES 
  ($1, $2, $3, $4 + $5, $6 + 1, (($7 * $6 + $8) / ($6 + 1))) 
  ON CONFLICT (user_id) DO UPDATE SET 
  total_questions_answered = user_progress.total_questions_answered + $5,
  total_tests_completed = user_progress.total_tests_completed + 1,
  average_score = ((user_progress.average_score * user_progress.total_tests_completed) + $8) / (user_progress.total_tests_completed + 1),
  last_login_date = $3;

  -- Update subject_progress table
  INSERT INTO subject_progress 
  (user_id, subject, score, questions_answered, tests_completed, last_activity) 
  VALUES 
  ($1, $9, $8, $5, 1, $3) 
  ON CONFLICT (user_id, subject) DO UPDATE SET 
  score = ((subject_progress.score * subject_progress.tests_completed) + $8) / (subject_progress.tests_completed + 1),
  questions_answered = subject_progress.questions_answered + $5,
  tests_completed = subject_progress.tests_completed + 1,
  last_activity = $3;

  -- Update weekly_activity table
  INSERT INTO weekly_activity 
  (user_id, date, score, questions_answered) 
  VALUES 
  ($1, $3::date, $8, $5) 
  ON CONFLICT (user_id, date) DO UPDATE SET 
  score = weekly_activity.score + $8,
  questions_answered = weekly_activity.questions_answered + $5;
COMMIT;

-- 3. Get test submission by ID
SELECT * FROM test_submissions 
WHERE id = $1;

-- 4. Get test submission by test_id, user_id and completed_at
SELECT * FROM test_submissions 
WHERE test_id = $1 AND user_id = $2 AND completed_at = $3;

-- 5. Get all test submissions for a user (test history)
SELECT 
  ts.id,
  ts.test_id,
  COALESCE(ts.test_title, mt.title, 'Mock Test') as title,
  COALESCE(ts.subject, mt.subject, 'General') as subject,
  ts.score,
  ts.completed_at,
  ts.time_spent
FROM test_submissions ts
LEFT JOIN mock_tests mt ON ts.test_id = mt.id
WHERE ts.user_id = $1
ORDER BY ts.completed_at DESC;

-- 6. Get user performance statistics by subject
SELECT 
  subject,
  AVG(score) as average_score,
  COUNT(*) as tests_completed,
  SUM(time_spent) as total_time_spent
FROM test_submissions
WHERE user_id = $1
GROUP BY subject
ORDER BY average_score DESC;

-- 7. Get user's recent test submissions (last 5)
SELECT 
  ts.id,
  ts.test_id,
  COALESCE(ts.test_title, mt.title, 'Mock Test') as title,
  COALESCE(ts.subject, mt.subject, 'General') as subject,
  ts.score,
  ts.completed_at,
  ts.time_spent
FROM test_submissions ts
LEFT JOIN mock_tests mt ON ts.test_id = mt.id
WHERE ts.user_id = $1
ORDER BY ts.completed_at DESC
LIMIT 5;

-- 8. Get detailed test results for a specific submission
SELECT * FROM test_results
WHERE submission_id = $1;

-- 9. Insert detailed test results
INSERT INTO test_results
(submission_id, question_id, user_answer, is_correct, marks_obtained, question_text)
VALUES
($1, $2, $3, $4, $5, $6);

-- 10. Get user's progress over time (weekly trend)
SELECT 
  date,
  score,
  questions_answered
FROM weekly_activity
WHERE user_id = $1
ORDER BY date DESC
LIMIT 8;