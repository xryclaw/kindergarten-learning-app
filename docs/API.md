# API 接口文档

## 基础信息

- **Base URL**: `/api/v1`
- **认证方式**: JWT Token (httpOnly Cookie)
- **响应格式**: JSON

## 通用响应格式

### 成功响应
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

### 错误响应
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": { ... }
  }
}
```

### 错误码列表
| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| VALIDATION_ERROR | 400 | 请求参数验证失败 |
| UNAUTHORIZED | 401 | 未登录或token无效 |
| FORBIDDEN | 403 | 无权限访问 |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 资源冲突（如用户名已存在） |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

## 1. 认证接口

### 1.1 家长注册
```
POST /api/v1/auth/register
```

**请求体：**
```json
{
  "username": "parent123",
  "password": "password123",
  "email": "parent@example.com",
  "phone": "13800138000"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "username": "parent123",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "注册成功"
}
```

**验证规则：**
- username: 3-20字符，字母数字下划线
- password: 最少6字符
- email: 有效邮箱格式（可选）
- phone: 11位手机号（可选）

### 1.2 家长登录
```
POST /api/v1/auth/login
```

**请求体：**
```json
{
  "username": "parent123",
  "password": "password123"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "username": "parent123",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "students": [
      {
        "id": 1,
        "name": "小明",
        "nickname": "明明",
        "avatar": "/avatars/boy1.png"
      }
    ]
  },
  "message": "登录成功"
}
```

**错误情况：**
- 用户名不存在或密码错误: `UNAUTHORIZED`
- 登录失败次数过多: `FORBIDDEN` (5分钟后重试)

### 1.3 登出
```
POST /api/v1/auth/logout
```

**请求头：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
  "success": true,
  "message": "登出成功"
}
```

### 1.4 获取当前用户信息
```
GET /api/v1/auth/me
```

**请求头：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
  "success": true,
  "data": {
    "userId": 1,
    "username": "parent123",
    "email": "parent@example.com",
    "phone": "13800138000",
    "createdAt": "2026-04-01T10:00:00Z"
  }
}
```

## 2. 学生管理接口

### 2.1 获取孩子列表
```
GET /api/v1/students
```

**请求头：**
```
Authorization: Bearer <token>
```

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "小明",
      "nickname": "明明",
      "birthDate": "2020-05-15",
      "avatar": "/avatars/boy1.png",
      "grade": "kindergarten",
      "createdAt": "2026-04-01T10:00:00Z"
    }
  ]
}
```

### 2.2 添加孩子
```
POST /api/v1/students
```

**请求体：**
```json
{
  "name": "小红",
  "nickname": "红红",
  "birthDate": "2020-08-20",
  "avatar": "/avatars/girl1.png",
  "grade": "kindergarten"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "小红",
    "nickname": "红红",
    "birthDate": "2020-08-20",
    "avatar": "/avatars/girl1.png",
    "grade": "kindergarten",
    "createdAt": "2026-04-03T12:00:00Z"
  },
  "message": "添加成功"
}
```

### 2.3 更新孩子信息
```
PUT /api/v1/students/:id
```

**请求体：**
```json
{
  "nickname": "小红红",
  "avatar": "/avatars/girl2.png"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 2,
    "name": "小红",
    "nickname": "小红红",
    "avatar": "/avatars/girl2.png"
  },
  "message": "更新成功"
}
```

### 2.4 删除孩子
```
DELETE /api/v1/students/:id
```

**响应：**
```json
{
  "success": true,
  "message": "删除成功"
}
```

**注意：** 删除孩子会级联删除所有学习记录

### 2.5 获取孩子学习进度
```
GET /api/v1/students/:id/progress
```

**查询参数：**
- `startDate`: 开始日期 (YYYY-MM-DD)
- `endDate`: 结束日期 (YYYY-MM-DD)
- `category`: 知识点类型 (character/pinyin/math/story/scratch)

**响应：**
```json
{
  "success": true,
  "data": {
    "studentId": 1,
    "studentName": "小明",
    "period": {
      "start": "2026-04-01",
      "end": "2026-04-03"
    },
    "summary": {
      "totalRecords": 45,
      "totalDuration": 3600,
      "averageScore": 85,
      "completedTopics": 12
    },
    "byCategory": {
      "character": {
        "records": 15,
        "avgScore": 88,
        "duration": 1200
      },
      "pinyin": {
        "records": 10,
        "avgScore": 82,
        "duration": 800
      }
    },
    "recentActivities": [
      {
        "date": "2026-04-03",
        "topicTitle": "《江南》识字",
        "score": 90,
        "duration": 300
      }
    ]
  }
}
```

## 3. 学习记录接口

### 3.1 提交学习记录
```
POST /api/v1/learning/records
```

**请求体：**
```json
{
  "studentId": 1,
  "topicId": 5,
  "activityType": "quiz",
  "score": 85,
  "durationSeconds": 300,
  "completed": true,
  "data": {
    "questions": [
      {
        "questionId": "q1",
        "answer": "江",
        "correct": true,
        "timeSpent": 15
      }
    ]
  }
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "recordId": 123,
    "studentId": 1,
    "topicId": 5,
    "score": 85,
    "createdAt": "2026-04-03T14:30:00Z"
  },
  "message": "记录成功"
}
```

### 3.2 获取学习记录
```
GET /api/v1/learning/records
```

**查询参数：**
- `studentId`: 学生ID（必填）
- `topicId`: 知识点ID（可选）
- `activityType`: 活动类型（可选）
- `startDate`: 开始日期（可选）
- `endDate`: 结束日期（可选）
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）

**响应：**
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": 123,
        "studentId": 1,
        "topicId": 5,
        "topicTitle": "《江南》识字",
        "activityType": "quiz",
        "score": 85,
        "durationSeconds": 300,
        "completed": true,
        "createdAt": "2026-04-03T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

### 3.3 获取学习统计
```
GET /api/v1/learning/stats
```

**查询参数：**
- `studentId`: 学生ID（必填）
- `period`: 统计周期 (today/week/month/all)

**响应：**
```json
{
  "success": true,
  "data": {
    "period": "week",
    "totalRecords": 35,
    "totalDuration": 2800,
    "averageScore": 86,
    "completedTopics": 10,
    "dailyStats": [
      {
        "date": "2026-04-03",
        "records": 8,
        "duration": 600,
        "avgScore": 88
      }
    ],
    "categoryStats": {
      "character": { "count": 12, "avgScore": 85 },
      "pinyin": { "count": 10, "avgScore": 87 }
    }
  }
}
```

### 3.4 记录错题
```
POST /api/v1/learning/mistakes
```

**请求体：**
```json
{
  "studentId": 1,
  "topicId": 5,
  "questionId": "q1",
  "wrongAnswer": "河",
  "correctAnswer": "江"
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "mistakeId": 45,
    "studentId": 1,
    "topicId": 5,
    "questionId": "q1",
    "retryCount": 0,
    "mastered": false
  },
  "message": "错题已记录"
}
```

### 3.5 获取错题集
```
GET /api/v1/learning/mistakes
```

**查询参数：**
- `studentId`: 学生ID（必填）
- `topicId`: 知识点ID（可选）
- `mastered`: 是否已掌握 (true/false，可选)
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）

**响应：**
```json
{
  "success": true,
  "data": {
    "mistakes": [
      {
        "id": 45,
        "studentId": 1,
        "topicId": 5,
        "topicTitle": "《江南》识字",
        "questionId": "q1",
        "wrongAnswer": "河",
        "correctAnswer": "江",
        "retryCount": 2,
        "mastered": false,
        "createdAt": "2026-04-02T10:00:00Z",
        "lastRetryAt": "2026-04-03T11:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 8,
      "totalPages": 1
    }
  }
}
```

### 3.6 更新错题状态
```
PUT /api/v1/learning/mistakes/:id
```

**请求体：**
```json
{
  "mastered": true
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 45,
    "mastered": true,
    "retryCount": 3
  },
  "message": "更新成功"
}
```

## 4. 内容管理接口

### 4.1 获取知识点列表
```
GET /api/v1/content/topics
```

**查询参数：**
- `category`: 类型 (character/pinyin/math/story/scratch)
- `difficulty`: 难度 (1-5)
- `isActive`: 是否启用 (true/false)
- `page`: 页码（默认1）
- `limit`: 每页数量（默认20）

**响应：**
```json
{
  "success": true,
  "data": {
    "topics": [
      {
        "id": 5,
        "category": "character",
        "title": "《江南》识字",
        "difficulty": 2,
        "orderIndex": 1,
        "isActive": true,
        "createdAt": "2026-04-01T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

### 4.2 获取知识点详情
```
GET /api/v1/content/topics/:id
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "category": "character",
    "title": "《江南》识字",
    "content": {
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
    },
    "difficulty": 2,
    "orderIndex": 1,
    "isActive": true,
    "createdAt": "2026-04-01T10:00:00Z",
    "updatedAt": "2026-04-01T10:00:00Z"
  }
}
```

### 4.3 创建知识点（管理员）
```
POST /api/v1/content/topics
```

**请求头：**
```
Authorization: Bearer <admin_token>
```

**请求体：**
```json
{
  "category": "character",
  "title": "《春晓》识字",
  "content": {
    "type": "character",
    "characters": [
      {
        "char": "春",
        "pinyin": "chūn",
        "meaning": "春天",
        "strokes": 9,
        "radical": "日"
      }
    ]
  },
  "difficulty": 2,
  "orderIndex": 2,
  "isActive": true
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "category": "character",
    "title": "《春晓》识字",
    "createdAt": "2026-04-03T15:00:00Z"
  },
  "message": "创建成功"
}
```

### 4.4 更新知识点（管理员）
```
PUT /api/v1/content/topics/:id
```

**请求体：**
```json
{
  "title": "《春晓》识字（更新版）",
  "difficulty": 3,
  "isActive": false
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "title": "《春晓》识字（更新版）",
    "difficulty": 3,
    "isActive": false,
    "updatedAt": "2026-04-03T16:00:00Z"
  },
  "message": "更新成功"
}
```

### 4.5 批量导入知识点（管理员）
```
POST /api/v1/content/topics/import
```

**请求体：**
```json
{
  "topics": [
    {
      "category": "character",
      "title": "识字1",
      "content": { ... }
    },
    {
      "category": "pinyin",
      "title": "拼音1",
      "content": { ... }
    }
  ]
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "imported": 2,
    "failed": 0,
    "errors": []
  },
  "message": "导入成功"
}
```

## 5. 健康检查接口

### 5.1 健康检查
```
GET /api/health
```

**响应：**
```json
{
  "status": "ok",
  "timestamp": "2026-04-03T16:00:00Z",
  "database": "connected",
  "uptime": 86400
}
```

## 6. 速率限制

为防止滥用，API实施以下速率限制：

| 端点类型 | 限制 |
|---------|------|
| 认证接口 | 5次/分钟/IP |
| 读取接口 | 100次/分钟/用户 |
| 写入接口 | 30次/分钟/用户 |

超出限制返回：
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "请求过于频繁，请稍后再试",
    "retryAfter": 60
  }
}
```

## 7. 分页规范

所有列表接口支持分页，使用以下参数：
- `page`: 页码（从1开始）
- `limit`: 每页数量（默认20，最大100）

响应包含pagination对象：
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## 8. 日期时间格式

- 所有日期时间使用ISO 8601格式：`2026-04-03T16:00:00Z`
- 日期使用：`YYYY-MM-DD`
- 时区：UTC
