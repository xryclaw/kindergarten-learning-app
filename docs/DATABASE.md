# 数据库设计文档

## 1. 数据库选型

**选择：SQLite 3**

### 选型理由
- 零配置，单文件数据库
- 适合中小规模应用（预计<10GB）
- 备份简单（直接复制.db文件）
- 无需额外数据库服务维护
- 支持并发读，写入性能足够
- 事务支持完整（ACID）

### 数据量估算
- 假设：100个家庭，每家2个孩子 = 200学生
- 每个学生每天10条学习记录 × 365天 = 730,000条/年
- 预计数据库大小：< 500MB/年
- 5年数据：< 2.5GB

### 迁移路径
如需扩展到PostgreSQL：
```bash
# 使用pgloader工具
pgloader sqlite:///path/to/app.db postgresql://user:pass@host/dbname
```

## 2. 数据库结构

### 2.1 ER图

```
┌─────────────┐         ┌──────────────┐
│   parents   │1      *│   students   │
│             ├─────────┤              │
│ - id        │         │ - id         │
│ - username  │         │ - parent_id  │
│ - password  │         │ - name       │
└─────────────┘         └──────┬───────┘
                               │1
                               │
                               │*
                        ┌──────┴────────────┐
                        │                   │
                ┌───────┴────────┐  ┌───────┴────────┐
                │ learning_      │  │   mistakes     │
                │   records      │  │                │
                │ - id           │  │ - id           │
                │ - student_id   │  │ - student_id   │
                │ - topic_id     │  │ - topic_id     │
                │ - score        │  │ - question_id  │
                └────────┬───────┘  └────────┬───────┘
                         │*                  │*
                         │                   │
                         │1                  │1
                    ┌────┴──────┐            │
                    │  topics   │────────────┘
                    │           │
                    │ - id      │
                    │ - category│
                    │ - title   │
                    │ - content │
                    └───────────┘
```

## 3. 表结构定义

### 3.1 parents（家长表）

存储家长账户信息。

```sql
CREATE TABLE parents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  role TEXT DEFAULT 'parent' CHECK(role IN ('parent', 'admin')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parents_username ON parents(username);
CREATE INDEX idx_parents_email ON parents(email);
```

**字段说明：**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| username | TEXT | 用户名，唯一，3-20字符 |
| password_hash | TEXT | 密码哈希（bcrypt） |
| email | TEXT | 邮箱，唯一，可选 |
| phone | TEXT | 手机号，可选 |
| role | TEXT | 角色：parent/admin |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

**约束：**
- username: UNIQUE, NOT NULL
- password_hash: NOT NULL
- role: CHECK约束，只能是parent或admin

### 3.2 students（学生表）

存储孩子信息。

```sql
CREATE TABLE students (
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

CREATE INDEX idx_students_parent ON students(parent_id);
```

**字段说明：**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| parent_id | INTEGER | 外键，关联parents.id |
| name | TEXT | 姓名 |
| nickname | TEXT | 昵称，可选 |
| birth_date | DATE | 出生日期，可选 |
| avatar | TEXT | 头像路径 |
| grade | TEXT | 年级，默认kindergarten |
| created_at | DATETIME | 创建时间 |

**约束：**
- parent_id: FOREIGN KEY, ON DELETE CASCADE
- name: NOT NULL

### 3.3 topics（知识点表）

存储学习内容。

```sql
CREATE TABLE topics (
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

CREATE INDEX idx_topics_category ON topics(category);
CREATE INDEX idx_topics_active ON topics(is_active);
CREATE INDEX idx_topics_order ON topics(category, order_index);
```

**字段说明：**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| category | TEXT | 类型：character/pinyin/math/story/scratch |
| title | TEXT | 标题 |
| content | JSON | 内容（JSON格式） |
| difficulty | INTEGER | 难度等级 1-5 |
| order_index | INTEGER | 排序索引 |
| is_active | BOOLEAN | 是否启用 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

**约束：**
- category: CHECK约束，限定5种类型
- difficulty: CHECK约束，1-5之间
- title, content: NOT NULL

**content字段格式示例：**

汉字学习：
```json
{
  "type": "character",
  "characters": [
    {
      "char": "江",
      "pinyin": "jiāng",
      "meaning": "大河",
      "strokes": 6,
      "radical": "氵"
    }
  ],
  "story": {
    "title": "《江南》",
    "content": "江南可采莲，莲叶何田田..."
  }
}
```

拼音练习：
```json
{
  "type": "pinyin",
  "syllables": ["zhi", "chi", "shi", "ri"],
  "exercises": [
    {
      "question": "选出正确的拼音",
      "word": "知道",
      "options": ["zhidao", "zidao", "chidao"],
      "answer": "zhidao"
    }
  ]
}
```

### 3.4 learning_records（学习记录表）

存储学习活动记录。

```sql
CREATE TABLE learning_records (
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

CREATE INDEX idx_learning_student ON learning_records(student_id);
CREATE INDEX idx_learning_topic ON learning_records(topic_id);
CREATE INDEX idx_learning_date ON learning_records(created_at);
CREATE INDEX idx_learning_student_date ON learning_records(student_id, created_at);
```

**字段说明：**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| student_id | INTEGER | 外键，关联students.id |
| topic_id | INTEGER | 外键，关联topics.id |
| activity_type | TEXT | 活动类型：quiz/practice/game |
| score | INTEGER | 得分 0-100 |
| duration_seconds | INTEGER | 用时（秒） |
| completed | BOOLEAN | 是否完成 |
| data | JSON | 详细数据（答题情况等） |
| created_at | DATETIME | 创建时间 |

**约束：**
- student_id, topic_id: FOREIGN KEY, ON DELETE CASCADE
- activity_type: CHECK约束
- score: CHECK约束，0-100之间

**data字段格式示例：**
```json
{
  "questions": [
    {
      "questionId": "q1",
      "question": "选出正确的字",
      "answer": "江",
      "correct": true,
      "timeSpent": 15
    },
    {
      "questionId": "q2",
      "question": "选出正确的拼音",
      "answer": "jiāng",
      "correct": false,
      "timeSpent": 20
    }
  ],
  "totalQuestions": 10,
  "correctCount": 8
}
```

### 3.5 mistakes（错题记录表）

存储错题信息，用于重复练习。

```sql
CREATE TABLE mistakes (
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

CREATE INDEX idx_mistakes_student ON mistakes(student_id);
CREATE INDEX idx_mistakes_mastered ON mistakes(mastered);
CREATE INDEX idx_mistakes_student_mastered ON mistakes(student_id, mastered);
```

**字段说明：**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | INTEGER | 主键，自增 |
| student_id | INTEGER | 外键，关联students.id |
| topic_id | INTEGER | 外键，关联topics.id |
| question_id | TEXT | 题目ID |
| wrong_answer | TEXT | 错误答案 |
| correct_answer | TEXT | 正确答案 |
| retry_count | INTEGER | 重试次数 |
| mastered | BOOLEAN | 是否已掌握 |
| created_at | DATETIME | 创建时间 |
| last_retry_at | DATETIME | 最后重试时间 |

**约束：**
- student_id, topic_id: FOREIGN KEY, ON DELETE CASCADE
- UNIQUE(student_id, topic_id, question_id): 同一学生同一题目只记录一次

## 4. 初始化脚本

### 4.1 schema.sql

```sql
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
```

### 4.2 seed.sql（测试数据）

```sql
-- 插入测试家长账户
-- 密码: password123 (需要在应用中用bcrypt哈希)
INSERT INTO parents (username, password_hash, email, phone, role) VALUES
('parent1', '$2b$10$...', 'parent1@example.com', '13800138001', 'parent'),
('admin', '$2b$10$...', 'admin@example.com', '13800138000', 'admin');

-- 插入测试学生
INSERT INTO students (parent_id, name, nickname, birth_date, avatar, grade) VALUES
(1, '小明', '明明', '2020-05-15', '/avatars/boy1.png', 'kindergarten'),
(1, '小红', '红红', '2020-08-20', '/avatars/girl1.png', 'kindergarten');

-- 插入测试知识点
INSERT INTO topics (category, title, content, difficulty, order_index, is_active) VALUES
('character', '《江南》识字', '{"type":"character","characters":[{"char":"江","pinyin":"jiāng","meaning":"大河","strokes":6,"radical":"氵"}],"story":{"title":"《江南》","content":"江南可采莲，莲叶何田田..."}}', 2, 1, 1),
('pinyin', '整体认读音节', '{"type":"pinyin","syllables":["zhi","chi","shi","ri"],"exercises":[]}', 1, 1, 1),
('math', '10以内加法', '{"type":"math","topic":"10以内加法","questions":[{"question":"3 + 5 = ?","answer":8,"visual":"apple"}]}', 1, 1, 1);
```

## 5. 数据库维护

### 5.1 备份策略

**每日自动备份：**
```bash
#!/bin/bash
# /usr/local/bin/backup-db.sh

DB_PATH=/var/www/kindergarten-learning-app/data/app.db
BACKUP_DIR=/var/www/kindergarten-learning-app/data/backups
DATE=$(date +%Y%m%d_%H%M%S)

# 创建备份目录
mkdir -p $BACKUP_DIR

# 使用SQLite的.backup命令
sqlite3 $DB_PATH ".backup $BACKUP_DIR/app_$DATE.db"

# 压缩备份
gzip $BACKUP_DIR/app_$DATE.db

# 保留最近30天的备份
find $BACKUP_DIR -name "app_*.db.gz" -mtime +30 -delete

echo "Backup completed: app_$DATE.db.gz"
```

**Cron配置：**
```cron
# 每天凌晨2点备份
0 2 * * * /usr/local/bin/backup-db.sh >> /var/log/db-backup.log 2>&1
```

### 5.2 数据库优化

**定期VACUUM：**
```bash
# 每周执行一次VACUUM，回收空间
sqlite3 /var/www/kindergarten-learning-app/data/app.db "VACUUM;"
```

**分析统计信息：**
```sql
-- 更新统计信息，优化查询计划
ANALYZE;
```

### 5.3 数据库监控

**检查数据库大小：**
```bash
du -h /var/www/kindergarten-learning-app/data/app.db
```

**检查表行数：**
```sql
SELECT 
  'parents' as table_name, COUNT(*) as row_count FROM parents
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'topics', COUNT(*) FROM topics
UNION ALL
SELECT 'learning_records', COUNT(*) FROM learning_records
UNION ALL
SELECT 'mistakes', COUNT(*) FROM mistakes;
```

## 6. 常用查询

### 6.1 学生学习统计

```sql
-- 获取学生最近7天的学习统计
SELECT 
  DATE(created_at) as date,
  COUNT(*) as record_count,
  AVG(score) as avg_score,
  SUM(duration_seconds) as total_duration
FROM learning_records
WHERE student_id = ? 
  AND created_at >= datetime('now', '-7 days')
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### 6.2 错题统计

```sql
-- 获取学生未掌握的错题数量（按类型）
SELECT 
  t.category,
  COUNT(*) as mistake_count
FROM mistakes m
JOIN topics t ON m.topic_id = t.id
WHERE m.student_id = ? 
  AND m.mastered = 0
GROUP BY t.category;
```

### 6.3 学习进度

```sql
-- 获取学生完成的知识点数量
SELECT 
  t.category,
  COUNT(DISTINCT lr.topic_id) as completed_topics,
  (SELECT COUNT(*) FROM topics WHERE category = t.category AND is_active = 1) as total_topics
FROM learning_records lr
JOIN topics t ON lr.topic_id = t.id
WHERE lr.student_id = ? 
  AND lr.completed = 1
GROUP BY t.category;
```

## 7. 迁移管理

### 7.1 迁移文件结构

```
server/src/db/migrations/
├── 001_initial_schema.sql
├── 002_add_avatar_field.sql
└── 003_add_difficulty_index.sql
```

### 7.2 迁移脚本示例

```javascript
// server/src/db/migrate.js
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

function runMigrations(dbPath) {
  const db = new Database(dbPath);
  
  // 创建迁移记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
  
  // 获取已应用的迁移
  const applied = db.prepare('SELECT name FROM migrations').all();
  const appliedNames = new Set(applied.map(m => m.name));
  
  // 读取迁移文件
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir).sort();
  
  for (const file of files) {
    if (!file.endsWith('.sql')) continue;
    if (appliedNames.has(file)) continue;
    
    console.log(`Applying migration: ${file}`);
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    
    db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);
    })();
    
    console.log(`✓ Applied: ${file}`);
  }
  
  db.close();
  console.log('All migrations applied successfully');
}

module.exports = { runMigrations };
```

## 8. 性能考虑

### 8.1 索引策略

已创建的索引：
- `parents`: username, email
- `students`: parent_id
- `topics`: category, is_active, (category, order_index)
- `learning_records`: student_id, topic_id, created_at, (student_id, created_at)
- `mistakes`: student_id, mastered, (student_id, mastered)

### 8.2 查询优化建议

1. **使用参数化查询**：防止SQL注入，提高性能
2. **限制返回行数**：使用LIMIT和OFFSET分页
3. **避免SELECT ***：只查询需要的字段
4. **使用事务**：批量操作时使用事务
5. **定期ANALYZE**：更新统计信息

### 8.3 性能监控

```sql
-- 查看查询计划
EXPLAIN QUERY PLAN
SELECT * FROM learning_records 
WHERE student_id = 1 
ORDER BY created_at DESC 
LIMIT 20;
```

## 9. 数据安全

### 9.1 敏感数据处理

- 密码：使用bcrypt哈希（cost=10）
- 个人信息：遵守数据保护法规
- 备份：加密存储

### 9.2 访问控制

- 应用层权限检查
- 家长只能访问自己孩子的数据
- 管理员可以管理所有数据

### 9.3 数据保留策略

- 学习记录：永久保留
- 错题记录：掌握后保留1年
- 备份文件：保留30天
