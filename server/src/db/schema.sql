-- 创建数据库表结构
PRAGMA foreign_keys = ON;

-- 家长表
CREATE TABLE IF NOT EXISTS parents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT DEFAULT 'parent' CHECK(role IN ('parent', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parents_username ON parents(username);
CREATE INDEX IF NOT EXISTS idx_parents_email ON parents(email);

-- 学生表
CREATE TABLE IF NOT EXISTS students (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT,
  birth_date DATE,
  avatar TEXT,
  grade TEXT DEFAULT 'kindergarten',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_students_parent ON students(parent_id);

-- 知识点表
CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL CHECK(category IN ('character', 'pinyin', 'math', 'story', 'scratch')),
  title TEXT NOT NULL,
  content JSON NOT NULL,
  difficulty INTEGER DEFAULT 1 CHECK(difficulty BETWEEN 1 AND 5),
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_topics_category ON topics(category);
CREATE INDEX IF NOT EXISTS idx_topics_active ON topics(is_active);
CREATE INDEX IF NOT EXISTS idx_topics_order ON topics(category, order_index);

-- 学习记录表
CREATE TABLE IF NOT EXISTS learning_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  topic_id INTEGER NOT NULL,
  activity_type TEXT NOT NULL CHECK(activity_type IN ('quiz', 'practice', 'game')),
  score INTEGER CHECK(score BETWEEN 0 AND 100),
  duration_seconds INTEGER,
  completed BOOLEAN DEFAULT 0,
  data JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_learning_student ON learning_records(student_id);
CREATE INDEX IF NOT EXISTS idx_learning_topic ON learning_records(topic_id);
CREATE INDEX IF NOT EXISTS idx_learning_date ON learning_records(created_at);
CREATE INDEX IF NOT EXISTS idx_learning_student_date ON learning_records(student_id, created_at);

-- 错题记录表
CREATE TABLE IF NOT EXISTS mistakes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  topic_id INTEGER NOT NULL,
  question_id TEXT NOT NULL,
  wrong_answer TEXT,
  correct_answer TEXT,
  retry_count INTEGER DEFAULT 0,
  mastered BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_retry_at DATETIME,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE,
  UNIQUE(student_id, topic_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_mistakes_student ON mistakes(student_id);
CREATE INDEX IF NOT EXISTS idx_mistakes_mastered ON mistakes(mastered);
CREATE INDEX IF NOT EXISTS idx_mistakes_student_mastered ON mistakes(student_id, mastered);

-- 创建更新时间触发器
CREATE TRIGGER IF NOT EXISTS update_parents_timestamp
AFTER UPDATE ON parents
BEGIN
  UPDATE parents SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS update_topics_timestamp
AFTER UPDATE ON topics
BEGIN
  UPDATE topics SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
