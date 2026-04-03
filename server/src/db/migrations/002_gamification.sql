-- 游戏化功能扩展

-- 学生积分和徽章表
CREATE TABLE IF NOT EXISTS student_gamification (
  student_id INTEGER PRIMARY KEY,
  total_points INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  level INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 徽章定义表
CREATE TABLE IF NOT EXISTS badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  requirement_type TEXT NOT NULL, -- 'points', 'streak', 'topics', 'perfect_score'
  requirement_value INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 学生获得的徽章
CREATE TABLE IF NOT EXISTS student_badges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  badge_id INTEGER NOT NULL,
  earned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
  UNIQUE(student_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_student_badges_student ON student_badges(student_id);
CREATE INDEX IF NOT EXISTS idx_student_badges_badge ON student_badges(badge_id);

-- 插入默认徽章
INSERT OR IGNORE INTO badges (code, name, description, icon, requirement_type, requirement_value) VALUES
('first_step', '初学者', '完成第一个学习任务', '🌱', 'topics', 1),
('explorer', '小探险家', '完成10个学习任务', '🔍', 'topics', 10),
('scholar', '小学者', '完成50个学习任务', '📚', 'topics', 50),
('master', '学习大师', '完成100个学习任务', '🎓', 'topics', 100),
('streak_3', '三天连续', '连续学习3天', '🔥', 'streak', 3),
('streak_7', '一周坚持', '连续学习7天', '⭐', 'streak', 7),
('streak_30', '月度冠军', '连续学习30天', '👑', 'streak', 30),
('points_100', '百分达人', '累计获得100积分', '💯', 'points', 100),
('points_500', '积分高手', '累计获得500积分', '💎', 'points', 500),
('points_1000', '积分大师', '累计获得1000积分', '🏆', 'points', 1000),
('perfect_10', '完美十次', '获得10次满分', '✨', 'perfect_score', 10),
('perfect_50', '完美五十', '获得50次满分', '🌟', 'perfect_score', 50);

-- 更新触发器
CREATE TRIGGER IF NOT EXISTS update_gamification_timestamp
AFTER UPDATE ON student_gamification
BEGIN
  UPDATE student_gamification SET updated_at = CURRENT_TIMESTAMP WHERE student_id = NEW.student_id;
END;
