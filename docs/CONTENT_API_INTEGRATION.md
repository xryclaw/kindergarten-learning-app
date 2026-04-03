# 内容API对接手册（前端版）

> 目标：将学习模块从静态硬编码数据迁移到后端内容管理API。

---

## 1. 学习内容相关 Endpoint 清单

| 方法 | 路径 | 说明 | 认证 |
|------|------|------|------|
| `GET` | `/api/v1/content/topics?category=character&isActive=true&limit=100` | 按分类获取知识点列表 | 公开 |
| `GET` | `/api/v1/content/topics/:id` | 获取单个知识点详情（含 content JSON） | 公开 |
| `POST` | `/api/v1/content/topics` | 创建知识点（仅管理员） | JWT |
| `PUT` | `/api/v1/content/topics/:id` | 更新知识点（仅管理员） | JWT |
| `POST` | `/api/v1/content/topics/import` | 批量导入知识点（仅管理员） | JWT |
| `GET` | `/api/v1/learning/records?studentId=1` | 获取学生学习记录 | JWT |
| `POST` | `/api/v1/learning/records` | 提交学习记录 | JWT |
| `GET` | `/api/v1/learning/mistakes?studentId=1` | 获取错题集 | JWT |
| `POST` | `/api/v1/learning/mistakes` | 记录错题 | JWT |
| `GET` | `/api/v1/gamification/students/:studentId` | 获取积分/徽章/连续天数 | JWT |
| `POST` | `/api/v1/gamification/students/:studentId/points` | 增加积分（一般由学习记录触发） | JWT |

---

## 2. 关键字段说明与示例响应

### 2.1 知识点列表 `GET /api/v1/content/topics?category=character`
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": 1,
        "category": "character",
        "title": "《江南》识字",
        "difficulty": 2,
        "order_index": 1,
        "is_active": true,
        "createdAt": "2026-04-03T10:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 5, "totalPages": 1 }
  }
}
```

### 2.2 知识点详情 `GET /api/v1/content/topics/1`
核心字段是 `content`，不同 `category` 对应不同 JSON Schema（见下文映射）。
```json
{
  "success": true,
  "data": {
    "id": 1,
    "category": "character",
    "title": "《江南》识字",
    "content": {
      "type": "character",
      "characters": [
        { "char": "江", "pinyin": "jiāng", "meaning": "大河", "strokes": 6, "radical": "氵" }
      ],
      "story": { "title": "《江南》", "content": "江南可采莲，莲叶何田田..." },
      "writingChars": ["可", "叶", "东", "西"]
    },
    "difficulty": 2,
    "order_index": 1,
    "is_active": true
  }
}
```

### 2.3 提交学习记录 `POST /api/v1/learning/records`
```json
{
  "studentId": 1,
  "topicId": 1,
  "activityType": "quiz",
  "score": 85,
  "durationSeconds": 300,
  "completed": true,
  "data": { "correctCount": 4, "totalQuestions": 5 }
}
```
- `activityType` 枚举：`quiz` | `practice` | `game`
- `score` 范围：0-100（可选）

### 2.4 记录错题 `POST /api/v1/learning/mistakes`
```json
{
  "studentId": 1,
  "topicId": 1,
  "questionId": "q1",
  "wrongAnswer": "河",
  "correctAnswer": "江"
}
```

---

## 3. 前端静态数据 → API 数据迁移映射

当前各学习视图的数据均为 `<script setup>` 内硬编码。迁移时，应把对应数据整体放入 `topics.content` 字段，按 `category` 约定 Schema。

### 3.1 汉字学习 `category = "character"`
对应视图：`CharacterLearning.vue`

建议 `content` 结构：
```json
{
  "type": "character",
  "characters": [
    { "id": 1, "char": "江", "pinyin": "jiāng", "meaning": "大河", "strokes": 6, "radical": "氵" }
  ],
  "story": {
    "title": "《江南》",
    "content": "江南可采莲，莲叶何田田。\n鱼戏莲叶间。\n鱼戏莲叶东，\n鱼戏莲叶西，\n鱼戏莲叶南，\n鱼戏莲叶北。"
  },
  "writingChars": ["可", "叶", "东", "西"]
}
```

**前端改造点**：
- `onMounted` 中调用 `GET /api/v1/content/topics?category=character&isActive=true&limit=100`
- 列表页渲染：用 `title` 作为课程标题，点击进入详情（或直接用首条）。
- 原先 `characters` 取 `topic.content.characters`
- 原先 `writingChars` 取 `topic.content.writingChars`
- `quizQuestion/quizOptions` 逻辑不变，数据源换成 `content.characters`。

### 3.2 拼音练习 `category = "pinyin"`
对应视图：`PinyinPractice.vue`

建议 `content` 结构：
```json
{
  "type": "pinyin",
  "wholePinyin": [
    { "pinyin": "ye", "example": "叶子", "tones": ["yē", "yé", "yě", "yè"] }
  ],
  "compoundFinals": ["üe", "ie", "üan", "ün", "ing", "ong", "eng", "ang"],
  "gameItems": [
    { "id": 1, "pinyin": "kě", "char": "可" }
  ]
}
```

**前端改造点**：
- 用 `GET /api/v1/content/topics?category=pinyin` 拉取数据。
- `wholePinyin`、`compoundFinals`、`gameItems` 全部来自 `topic.content`。
- 配对游戏逻辑无需改动，仅替换数据源。

### 3.3 数学练习 `category = "math"`
对应视图：`MathPractice.vue`

建议 `content` 结构：
```json
{
  "type": "math",
  "problems": [
    {
      "id": 1,
      "text": "小明有8个苹果，吃了3个，还剩几个？",
      "answer": 5,
      "type": "减法",
      "keywords": ["吃了", "还剩"]
    }
  ]
}
```

**前端改造点**：
- 拉取 `category=math` 的知识点，取 `content.problems` 替代本地 `problems`。
- 答题提交时：`POST /learning/records` + 若答错 `POST /learning/mistakes`。

### 3.4 故事阅读 `category = "story"`
对应视图：`StoryModule.vue`

建议 `content` 结构：
```json
{
  "type": "story",
  "content": [
    "小兔子饿了，想找萝卜吃。",
    "它来到菜园，看到了很多萝卜。",
    "小兔子高兴地拔了一个大萝卜，开心地吃了起来。"
  ],
  "questions": [
    {
      "question": "小兔子想找什么？",
      "options": ["萝卜", "白菜", "苹果"],
      "answer": "萝卜"
    }
  ]
}
```

**前端改造点**：
- 故事列表直接用 `GET /api/v1/content/topics?category=story`，用 `title` 作故事名。
- 当前故事正文和题目取 `topic.content.content` 与 `topic.content.questions`。
- 答题结束后提交 `learning/records`。

### 3.5 Scratch编程 `category = "scratch"`
对应视图：`ScratchModule.vue`

建议 `content` 结构：
```json
{
  "type": "scratch",
  "icon": "🐱",
  "description": "了解Scratch界面和基本概念",
  "steps": [
    {
      "title": "什么是Scratch",
      "description": "Scratch是用积木块编程，就像搭积木一样简单！",
      "blocks": [
        { "type": "motion", "text": "移动 10 步" }
      ]
    }
  ]
}
```

**前端改造点**：
- 列表渲染：`title` + `content.icon` + `content.description`
- 详情渲染：`content.steps` 与 `blocks`
- 点击"完成课程"后提交 `learning/records`。

---

## 4. 初始化 / Seed / 迁移注意事项

### 4.1 数据库迁移缺口（阻塞项）
- `server/src/db/index.js` **仅加载 `schema.sql`**，**
不会自动执行** `server/src/db/migrations/002_gamification.sql`。
- 后果：在新环境（或删除 `data/app.db` 后）启动服务，`gamification` 相关表（`student_gamification`、`badges`、`student_badges`）**不存在**，调用积分/徽章接口会直接报错。

**修复建议**：
在 `initDatabase()` 中增加按文件名顺序执行 `migrations/*.sql` 的逻辑，并记录已执行版本（如 internal migrations 表或简单的执行标记），确保 `002_gamification.sql` 被正确执行。

### 4.2 Seed 数据缺口（阻塞项）
- 当前数据库初始化后是**完全空白**的，`topics` 表为空。
- 前端若直接对接 API，首屏会没有任何学习内容。
- 且 `auth/register` 已被永久关闭，没有默认账户就无法登录 AdminPanel 去录入内容。

**修复建议**：
新建 `server/src/db/seed.js`，在 `initDatabase()` 完成后幂等执行：
1. 插入默认管理员账户（`admin` / `password123` 等，便于首次登录）。
2. 插入各 `category` 的示例 `topic`（至少 1 条），保证首屏有内容。
3. 插入默认 `badges`（如果迁移文件未覆盖）。

> 注意：seed 应使用 `INSERT OR IGNORE` 或先查后插，保证幂等，不会重复写入。

### 4.3 API 字段名一致性注意
- 后端 `learningRoutes.js` 接收的请求体字段名为 **驼峰**：`studentId`、`topicId`、`activityType`、`durationSeconds`。
- 但当前部分前端视图（如 `CharacterLearning.vue`、`PinyinPractice.vue`）在调用时写成了下划线：`student_id`、`topic_type`、`topic_id`、`duration`。
- **风险**：这些调用参数与后端实际校验不匹配，会导致请求失败或数据未落库。

**对接前必须先统一字段命名**：前端调用 `api.post('/learning/records', {...})` 时必须使用后端约定的驼峰字段名。

---

## 5. 对接优先级

| 优先级 | 事项 | 阻塞关系 | 负责方建议 |
|--------|------|----------|------------|
| **P0** | 修复 `db/index.js` 自动加载 migrations（含 `002_gamification.sql`） | 不修复则游戏化/错题/徽章全不可用 | 后端 |
| **P0** | 补充默认 seed（admin 账户 + 各学科示例 topic） | 无 seed 则前端首屏空白、无法登录管理后台 | 后端 |
| **P1** | 统一前端 `learning/records` 与 `learning/mistakes` 调用的字段名 | 不统一则学习记录保存失败 | 前端 |
| **P1** | 改造学习视图：从静态数据切到 `GET /api/v1/content/topics` | 依赖 P0 seed 完成；可与 P1 字段统一并行 | 前端 |
| **P2** | 补充后端 API 单元测试（内容 CRUD、学习记录链路） | 不影响功能上线，但影响稳定性 | 后端 |
| **P2** | AdminPanel 优化（可视化表单替代裸 JSON 编辑） | 提升运营效率，非阻塞 | 前端/设计 |

### 推荐实施顺序
```
后端：修复迁移加载 → 补充 seed 脚本
前端：统一 API 字段命名 → 按需替换静态数据为 content API
后端（并行）：编写 API 测试覆盖
```

---

## 附录：快速验证命令

```bash
# 1. 安装后端依赖并启动
npm run server:install
npm run server:dev

# 2. 验证内容API（列表）
curl "http://localhost:3000/api/v1/content/topics?category=character"

# 3. 验证内容API（详情）
curl "http://localhost:3000/api/v1/content/topics/1"

# 4. 验证健康检查（含 database 状态）
curl "http://localhost:3000/api/health"
```
