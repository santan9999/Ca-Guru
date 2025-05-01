-- SQL Schema for Adaptive Learning

-- Weak Areas Table
CREATE TABLE IF NOT EXISTS weak_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  accuracy NUMERIC(5,2) NOT NULL,
  identified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_progress(user_id) ON DELETE CASCADE
);

-- Recommended Resources Table
CREATE TABLE IF NOT EXISTS recommended_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weak_area_id UUID NOT NULL,
  resource_id TEXT NOT NULL,
  title TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  relevance_score NUMERIC(5,2) DEFAULT 0,
  FOREIGN KEY (weak_area_id) REFERENCES weak_areas(id) ON DELETE CASCADE
);

-- Recommended Topics Table
CREATE TABLE IF NOT EXISTS recommended_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  relevance TEXT NOT NULL,
  recommended_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES user_progress(user_id) ON DELETE CASCADE
);

-- Learning Path Table
CREATE TABLE IF NOT EXISTS learning_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  path_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completion_percentage NUMERIC(5,2) DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES user_progress(user_id) ON DELETE CASCADE
);

-- Learning Path Items Table
CREATE TABLE IF NOT EXISTS learning_path_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  learning_path_id UUID NOT NULL,
  item_order INTEGER NOT NULL,
  subject TEXT NOT NULL,
  topic TEXT NOT NULL,
  resource_id TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  FOREIGN KEY (learning_path_id) REFERENCES learning_paths(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_weak_areas_user_id ON weak_areas(user_id);
CREATE INDEX IF NOT EXISTS idx_weak_areas_subject ON weak_areas(subject);
CREATE INDEX IF NOT EXISTS idx_recommended_resources_weak_area_id ON recommended_resources(weak_area_id);
CREATE INDEX IF NOT EXISTS idx_recommended_topics_user_id ON recommended_topics(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_user_id ON learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_items_learning_path_id ON learning_path_items(learning_path_id);