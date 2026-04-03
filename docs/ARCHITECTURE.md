# 幼儿园学习应用 - 技术架构设计

## 1. 技术栈选型

### 1.1 后端框架
**选择：Node.js + Fastify**

理由：
- 与前端同语言（JavaScript/TypeScript），降低团队学习成本
- Fastify性能优秀，启动快速
- 生态丰富，插件系统完善
- 单服务器部署简单（pm2/systemd）
- 内存占用小，适合单服务器场景

备选方案对比：
| 方案 | 优点 | 缺点 | 适用性 |
|------|------|------|--------|
| Node.js (Fastify) | 同栈、生态好、部署简单 | 单线程（可用cluster） | ⭐⭐⭐⭐⭐ |
| Go | 性能强、单二进制 | 新语言学习成本 | ⭐⭐⭐⭐ |
| Python (FastAPI) | 简单易学 | 需要虚拟环境管理 | ⭐⭐⭐ |

### 1.2 数据库
**选择：SQLite + 定期备份**

理由：
- 零配置，单文件数据库
- 幼儿园场景数据量小（预计<10GB）
- 备份简单（直接复制.db文件）
- 无需额外数据库服务维护
- 支持并发读，写入性能足够

数据量估算：
- 假设100个家庭，每家2个孩子 = 200学生
- 每个学生每天10条学习记录 × 365天 = 730,000条/年
- 预计数据库大小：< 500MB/年

迁移路径（如需扩展）：
- SQLite → PostgreSQL（使用pgloader工具）
- 数据模型设计时考虑兼容性

### 1.3 认证方案
**选择：JWT + 简化的家长账号系统**

特点：
- 家长账号可管理多个孩子
- JWT无状态，易于扩展
- 使用httpOnly cookie存储token（防XSS）
- 简单的密码哈希（bcrypt）

认证流程：
```
家长登录 → JWT token → 选择孩子 → 学习会话
```

### 1.4 前端路由
**升级：启用 vue-router**

理由：
- 当前tab切换方式不支持URL导航
- 添加账户系统后需要路由守卫
- 支持深度链接（如分享某个练习）
- 更好的用户体验（浏览器前进/后退）

### 1.5 状态管理
**选择：Pinia**

理由：
- Vue 3官方推荐
- 需要管理用户状态、学习进度等全局数据
- TypeScript支持好
- 轻量级

## 2. 整体架构设计

### 2.1 部署架构
**选择：一体化部署（后端serve前端）**

```
┌─────────────────────────────────────────┐
│         Nginx (反向代理 + HTTPS)         │
│              :80 / :443                  │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│      Fastify Server (:3000)             │
│  ┌─────────────────────────────────┐   │
│  │  API Routes (/api/*)            │   │
│  │  - /api/auth/*                  │   │
│  │  - /api/students/*              │   │
│  │  - /api/learning/*              │   │
│  │  - /api/content/*               │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  Static Files (/*) - Vue SPA    │   │
│  └─────────────────────────────────┘   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│         SQLite Database                 │
│    /var/lib/kindergarten/app.db         │
└─────────────────────────────────────────┘
```

优点：
- 单端口部署，配置简单
- 前后端版本一致性
- 减少CORS问题
- 符合现有部署流程

### 2.2 目录结构

```
kindergarten-learning-app/
├── client/                    # 前端代码（Vue 3）
│   ├── src/
│   │   ├── views/            # 页面组件
│   │   ├── components/       # 通用组件
│   │   ├── stores/           # Pinia状态管理
│   │   ├── router/           # Vue Router配置
│   │   ├── api/              # API调用封装
│   │   └── utils/            # 工具函数
│   ├── public/
│   └── vite.config.js
│
├── server/                    # 后端代码（Node.js + Fastify）
│   ├── src/
│   │   ├── routes/           # API路由
│   │   │   ├── auth.js       # 认证相关
│   │   │   ├── students.js   # 学生管理
│   │   │   ├── learning.js   # 学习记录
│   │   │   └── content.js    # 内容管理
│   │   ├── models/           # 数据模型
│   │   ├── services/         # 业务逻辑
│   │   ├── middleware/       # 中间件
│   │   ├── db/               # 数据库配置
│   │   │   ├── schema.sql    # 数据库结构
│   │   │   └── migrations/   # 数据库迁移
│   │   └── app.js            # Fastify应用入口
│   ├── index.js              # 服务器启动文件
│   └── package.json
│
├── shared/                    # 前后端共享代码
│   ├── types/                # TypeScript类型定义
│   └── constants/            # 常量定义
│
├── scripts/                   # 部署脚本（保持现有）
│   ├── deploy.mjs
│   ├── bootstrap-server.sh
│   └── setup-database.sh     # 新增：数据库初始化
│
├── docs/                      # 文档
│   ├── ARCHITECTURE.md       # 本文档
│   ├── API.md                # API文档
│   └── DATABASE.md           # 数据库设计
│
└── package.json              # 根package.json（workspace）
```

### 2.3 构建与部署流程

**开发环境：**
```bash
# 启动后端（端口3000）
npm run server:dev

# 启动前端（端口5173，代理API到3000）
npm run client:dev
```

**生产构建：**
```bash
# 1. 构建前端
npm run client:build  # 输出到 client/dist/

# 2. 构建后端（可选，如使用TypeScript）
npm run server:build  # 输出到 server/dist/

# 3. 打包部署
npm run build         # 统一构建命令
```

**部署到服务器：**
```bash
# 保持现有atomic release模式
npm run deploy

# 服务器上的目录结构：
/var/www/kindergarten-learning-app/
├── releases/
│   └── 20260403T120000Z-abc1234/
│       ├── client/           # 前端静态文件
│       ├── server/           # 后端代码
│       ├── node_modules/     # 生产依赖
│       └── package.json
├── current -> releases/20260403T120000Z-abc1234
└── data/
    ├── app.db               # SQLite数据库
    └── backups/             # 数据库备份
```

**服务管理（systemd）：**
```ini
# /etc/systemd/system/kindergarten-app.service
[Unit]
Description=Kindergarten Learning App
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/kindergarten-learning-app/current
Environment=NODE_ENV=production
Environment=DB_PATH=/var/www/kindergarten-learning-app/data/app.db
ExecStart=/usr/bin/node server/index.js
Restart=always

[Install]
WantedBy=multi-user.target
```

## 3. API设计

### 3.1 API结构

**基础路径：** `/api/v1`

**认证相关：**
```
POST   /api/v1/auth/register          # 家长注册
POST   /api/v1/auth/login             # 家长登录
POST   /api/v1/auth/logout            # 登出
GET    /api/v1/auth/me                # 获取当前用户信息
```

**学生管理：**
```
GET    /api/v1/students               # 获取当前家长的孩子列表
POST   /api/v1/students               # 添加孩子
PUT    /api/v1/students/:id           # 更新孩子信息
DELETE /api/v1/students/:id           # 删除孩子
GET    /api/v1/students/:id/progress  # 获取孩子学习进度
```

**学习记录：**
```
POST   /api/v1/learning/records       # 提交学习记录
GET    /api/v1/learning/records       # 获取学习记录（分页）
GET    /api/v1/learning/stats         # 获取学习统计
POST   /api/v1/learning/mistakes      # 记录错题
GET    /api/v1/learning/mistakes      # 获取错题集
```

**内容管理：**
```
GET    /api/v1/content/topics         # 获取知识点列表
GET    /api/v1/content/topics/:id     # 获取知识点详情
POST   /api/v1/content/topics         # 创建知识点（管理员）
PUT    /api/v1/content/topics/:id     # 更新知识点（管理员）
```

### 3.2 API响应格式

**成功响应：**
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

**错误响应：**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "用户名已存在",
    "details": { ... }
  }
}
```

### 3.3 认证机制

**JWT Token结构：**
```json
{
  "userId": 123,
  "role": "parent",
  "iat": 1234567890,
  "exp": 1234654290
}
```

**请求头：**
```
Authorization: Bearer <token>
```

或使用httpOnly cookie（推荐）：
```
Cookie: token=<jwt_token>
```

## 4. 数据模型设计

### 4.1 核心表结构

**用户表（parents）：**
```sql
CREATE TABLE parents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**学生表（students）：**
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
```

**知识点表（topics）：**
```sql
CREATE TABLE topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL,  -- 'character', 'pinyin', 'math', 'story', 'scratch'
  title TEXT NOT NULL,
  content JSON NOT NULL,   -- 知识点内容（JSON格式）
  difficulty INTEGER DEFAULT 1,  -- 难度等级 1-5
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**学习记录表（learning_records）：**
```sql
CREATE TABLE learning_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  student_id INTEGER NOT NULL,
  topic_id INTEGER NOT NULL,
  activity_type TEXT NOT NULL,  -- 'quiz', 'practice', 'game'
  score INTEGER,
  duration_seconds INTEGER,
  completed BOOLEAN DEFAULT 0,
  data JSON,  -- 详细数据（答题情况等）
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

CREATE INDEX idx_learning_student ON learning_records(student_id);
CREATE INDEX idx_learning_topic ON learning_records(topic_id);
CREATE INDEX idx_learning_date ON learning_records(created_at);
```

**错题记录表（mistakes）：**
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
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);

CREATE INDEX idx_mistakes_student ON mistakes(student_id);
CREATE INDEX idx_mistakes_mastered ON mistakes(mastered);
```

### 4.2 知识点内容格式（JSON）

**汉字学习：**
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
    "content": "江南可采莲..."
  }
}
```

**拼音练习：**
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

**数学题：**
```json
{
  "type": "math",
  "topic": "10以内加法",
  "questions": [
    {
      "question": "3 + 5 = ?",
      "answer": 8,
      "visual": "apple"
    }
  ]
}
```

## 5. 幼儿园场景特殊设计

### 5.1 简化的UI/UX
- 大按钮、大字体
- 图标 + 文字双重提示
- 语音提示（可选）
- 动画反馈（正确/错误）

### 5.2 家长控制面板
- 查看孩子学习进度
- 设置每日学习目标
- 查看错题集
- 导出学习报告

### 5.3 内容管理
- 学校可以批量导入知识点
- 支持CSV/JSON格式
- 按日期/周次组织内容

### 5.4 离线支持（可选）
- Service Worker缓存
- IndexedDB本地存储
- 在线时同步数据

## 6. 部署简便性设计

### 6.1 一键部署脚本
```bash
# 保持现有deploy.mjs，增强功能：
npm run deploy

# 自动执行：
# 1. 构建前后端
# 2. 上传到服务器
# 3. 安装依赖
# 4. 数据库迁移
# 5. 重启服务
# 6. 健康检查
```

### 6.2 数据库备份
```bash
# 每日自动备份（cron）
0 2 * * * /usr/local/bin/backup-db.sh

# backup-db.sh:
#!/bin/bash
DB_PATH=/var/www/kindergarten-learning-app/data/app.db
BACKUP_DIR=/var/www/kindergarten-learning-app/data/backups
DATE=$(date +%Y%m%d_%H%M%S)
sqlite3 $DB_PATH ".backup $BACKUP_DIR/app_$DATE.db"
# 保留最近30天的备份
find $BACKUP_DIR -name "app_*.db" -mtime +30 -delete
```

### 6.3 监控与日志
- 使用pm2管理进程（自动重启）
- 日志输出到文件（按日期轮转）
- 简单的健康检查端点：`GET /api/health`

## 7. 扩展性设计

### 7.1 模块化内容
- 每个知识点类型独立模块
- 插件式架构，易于添加新类型
- 统一的内容接口

### 7.2 数据库迁移路径
- 使用迁移脚本管理schema变更
- 支持从SQLite迁移到PostgreSQL
- 数据导出/导入工具

### 7.3 多租户支持（未来）
- 当前设计支持单个幼儿园
- 可扩展为多幼儿园SaaS
- 添加tenant_id字段即可

## 8. 安全考虑

### 8.1 认证安全
- 密码使用bcrypt哈希（cost=10）
- JWT token有效期：7天
- Refresh token机制
- 防暴力破解（登录限流）

### 8.2 数据安全
- SQL注入防护（使用参数化查询）
- XSS防护（前端输出转义）
- CSRF防护（SameSite cookie）
- 敏感数据加密存储

### 8.3 访问控制
- 家长只能访问自己孩子的数据
- 管理员角色（内容管理）
- API级别的权限检查

## 9. 性能优化

### 9.1 前端优化
- 代码分割（按路由）
- 图片懒加载
- 静态资源CDN（可选）
- Service Worker缓存

### 9.2 后端优化
- 数据库查询优化（索引）
- API响应缓存（Redis可选）
- 静态文件gzip压缩
- 连接池管理

### 9.3 数据库优化
- 合理的索引设计
- 定期VACUUM（SQLite）
- 查询性能监控

## 10. 实施计划

### Phase 1: 基础架构（1-2周）
- [ ] 搭建后端框架（Fastify）
- [ ] 设计并创建数据库schema
- [ ] 实现认证系统（JWT）
- [ ] 前端启用vue-router
- [ ] 集成Pinia状态管理

### Phase 2: 核心功能（2-3周）
- [ ] 学生管理API
- [ ] 学习记录API
- [ ] 错题记录功能
- [ ] 前端用户界面改造
- [ ] 数据持久化集成

### Phase 3: 内容管理（1-2周）
- [ ] 知识点管理API
- [ ] 内容导入工具
- [ ] 管理员界面
- [ ] 现有内容迁移

### Phase 4: 部署与测试（1周）
- [ ] 更新部署脚本
- [ ] 数据库备份脚本
- [ ] systemd服务配置
- [ ] 端到端测试
- [ ] 生产环境部署

### Phase 5: 优化与扩展（持续）
- [ ] 性能优化
- [ ] 用户反馈收集
- [ ] 新功能开发
- [ ] 文档完善

## 11. 风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| SQLite性能瓶颈 | 中 | 监控性能，准备PostgreSQL迁移方案 |
| 单服务器故障 | 高 | 定期备份，准备快速恢复流程 |
| 数据丢失 | 高 | 每日自动备份 + 异地备份 |
| 用户数据隐私 | 高 | 严格的访问控制 + 数据加密 |
| 部署复杂度增加 | 中 | 自动化脚本 + 详细文档 |

## 12. 总结

本架构设计在保持现有部署简便性的基础上，引入了必要的后端和数据库支持，满足了账户系统、数据存储和内容管理的需求。主要特点：

1. **技术栈统一**：前后端都使用JavaScript/Node.js
2. **部署简单**：一体化部署，单服务器友好
3. **数据安全**：SQLite + 定期备份
4. **易于扩展**：模块化设计，支持新功能
5. **幼儿友好**：简化UI，家长控制

下一步建议先实施Phase 1，搭建基础架构并验证可行性。
