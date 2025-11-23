
-- This SQL file defines the database structure for your NeonDB instance.

-- 1. Table for Batches/Classes
-- This allows grouping users by their class.
CREATE TABLE IF NOT EXISTS batches (
  batch_id SERIAL PRIMARY KEY,
  batch_name VARCHAR(100) NOT NULL UNIQUE
);

-- 2. Table for Users
-- Stores user information, links to a batch, and securely stores the password.
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
-- This table tracks every lesson completed and the XP gained.
-- This is the core table for gamification.
CREATE TABLE IF NOT EXISTS user_progress (
  progress_id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  lesson_id VARCHAR(100) NOT NULL, -- e.g., 'verbs-level-1', 'greetings-quiz'
  xp_gained INT NOT NULL DEFAULT 10,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- Optional: Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_batch ON users(batch_id);
CREATE INDEX IF NOT EXISTS idx_progress_user_week ON user_progress(user_id, completed_at);
