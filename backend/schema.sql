-- This SQL file defines the database structure for your NeonDB instance.

-- 1. Table for Batches/Classes
CREATE TABLE IF NOT EXISTS batches (
  batch_id SERIAL PRIMARY KEY,
  batch_name VARCHAR(100) NOT NULL UNIQUE
);

-- 2. Table for Users
CREATE TABLE IF NOT EXISTS users (
  user_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  registration_number VARCHAR(50) UNIQUE,
  batch_id INT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (batch_id) REFERENCES batches(batch_id)
);

-- 3. Table for User Progress
-- Tracks completion, XP, and performance metrics (mistakes).
CREATE TABLE IF NOT EXISTS user_progress (
  progress_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  lesson_id VARCHAR(100) NOT NULL, 
  xp_gained INT NOT NULL DEFAULT 10,
  mistakes INT DEFAULT 0, -- NEW: Tracks wrong answers during the session
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 4. Table for Chapters (already implied in code, but good to explicitely create if missing or for Study Materials linking)
CREATE TABLE IF NOT EXISTS chapters (
  chapter_id SERIAL PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  sequence_order INT DEFAULT 0
);

-- 5. Table for Exercises (already implied)
CREATE TABLE IF NOT EXISTS exercises (
  exercise_id SERIAL PRIMARY KEY,
  chapter_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'quiz', 'game'
  xp_reward INT DEFAULT 10,
  FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id)
);

-- 6. Table for Questions (already implied)
CREATE TABLE IF NOT EXISTS questions (
  question_id SERIAL PRIMARY KEY,
  exercise_id INT NOT NULL,
  question_type VARCHAR(50) NOT NULL, -- 'fill_blank', 'match', etc.
  content JSONB NOT NULL,
  FOREIGN KEY (exercise_id) REFERENCES exercises(exercise_id) ON DELETE CASCADE
);

-- 7. Table for Batch Access (already implied)
CREATE TABLE IF NOT EXISTS batch_chapter_access (
  access_id SERIAL PRIMARY KEY,
  batch_id INT NOT NULL,
  chapter_id INT NOT NULL,
  UNIQUE(batch_id, chapter_id)
);

-- 8. NEW: Table for Study Materials
CREATE TABLE IF NOT EXISTS study_materials (
  material_id SERIAL PRIMARY KEY,
  chapter_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'grammar',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (chapter_id) REFERENCES chapters(chapter_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_batch ON users(batch_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_week ON user_progress(user_id, completed_at);