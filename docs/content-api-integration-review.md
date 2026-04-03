# 内容API接入架构与契约落地评审报告

> 评审日期：2026-04-03
> 评审范围：content API 实现、学习主流程数据流、前后端契约一致性、儿童模式/后台边界
> 评审人：架构师

---

## 一、总体结论

**后端 content API 已实现且功能完整，但前端学习主流程完全未接入。** 当前存在三大核心风险：
1. **数据链路断裂**：AdminPanel 能管理后端内容，但学习模块仍使用组件内硬编码数据。
2. **契约不一致**：前端提交学习记录/错题的字段名、数据类型与后端 API 不匹配，调用会失败。
3. **边界混淆**：后台管理入口（AdminPanel）直接暴露在第10个导航 tab 中，与儿童学习场景混为一体。

**本轮开发若要接入内容API，必须优先解决契约对齐和模块边界问题，否则UI改版会建立在有缺陷的数据层之上。**

---

## 二、后端 content API 现状（已就绪）

`server/src/routes/content.js` 完整实现了以下接口，与 `docs/API.md` 一致：

| 接口 | 状态 | 说明 |
|------|------|------|
| `GET /api/v1/content/topics` | ✅ | 支持 category/difficulty/isActive 筛选 + 分页 |
| `GET /api/v1/content/topics/:id` | ✅ | 返回 topic 详情，`content` 字段自动 JSON.parse |
| `POST /api/v1/content/topics` | ✅ | 管理员权限，完整字段校验 |
| `PUT /api/v1/content/topics/:id` | ✅ | 管理员权限，支持部分更新 |
| `DELETE /api/v1/content/topics/:id` | ✅ | 管理员权限 |
| `POST /api/v1/content/topics/import` | ✅ | 批量导入，事务处理 |

**topics 表 `content` JSON 的当前 Schema（5种类型）**：
- `character`：story + characters[]（汉字学习）
- `pinyin`：syllables + exercises[]（拼音练习）
- `math`：topic + questions[]（数学练习）
- `story`：标题 + 内容 + 问题（故事阅读）
- `scratch`：课程列表（Scratch编程）

数据库层面已就绪，AdminPanel 已能通过 content API 进行内容管理。

---

## 三、前端学习主流程数据流分析（未接入）

### 3.1 各学习模块数据来源现状

| 模块 | 文件 | 数据来源 | content API 接入状态 |
|------|------|----------|----------------------|
| 汉字学习 | `CharacterLearning.vue` | 硬编码 `characters[]`、`writingChars[]`、古诗《江南》 | ❌ 未接入 |
| 拼音练习 | `PinyinPractice.vue` | 硬编码 `wholePinyin[]`、`compoundFinals[]`、`gameItems[]` | ❌ 未接入 |
| 数学练习 | `MathPractice.vue` | 硬编码 `problems[]` | ❌ 未接入 |
| 互动测验 | `InteractiveQuiz.vue` | 硬编码 `questions[]` | ❌ 未接入 |
| 故事阅读 | `StoryModule.vue` | （推断）硬编码 | ❌ 未接入 |
| Scratch编程 | `ScratchModule.vue` | （推断）硬编码 | ❌ 未接入 |
| 内容管理 | `AdminPanel.vue` | 调用 `GET /api/v1/content/topics` | ✅ 已接入 |

**核心问题**：AdminPanel 修改后端知识库后，学习视图不会同步变化。UI 改版若仅改展示层而不打通数据链路，本质问题仍然存在。

### 3.2 学习记录与错题 API 契约不一致（严重）

后端 `server/src/routes/learning.js` 定义的契约：

```javascript
// POST /api/v1/learning/records
{ studentId, topicId, activityType, score, durationSeconds, completed, data }

// POST /api/v1/learning/mistakes
{ studentId, topicId, questionId, wrongAnswer, correctAnswer }
```

但前端实际调用（以 `CharacterLearning.vue`、`PinyinPractice.vue` 为例）：

```javascript
// 错误1：字段名使用 snake_case，后端期望 camelCase
student_id: authStore.currentStudent.id   // ❌ 应为 studentId

// 错误2：topic_id 传字符串，后端期望整数且是 topics 表外键
topic_id: 'jiangnan'   // ❌ 应为整数 topicId

// 错误3：传了不存在的字段 topic_type
topic_type: 'character'   // ❌ 后端无此字段

// 错误4：缺少必填字段 activityType、topicId（整数）

// 错误5：错题记录缺少 questionId，且字段名错乱
topic_type: 'pinyin'   // ❌
question: mistake.pinyin   // ❌ 应为 questionId
user_answer / correct_answer   // ❌ 应为 wrongAnswer / correctAnswer（camelCase）
```

**影响**：前端调用学习记录和错题接口时，后端会返回 `VALIDATION_ERROR`（400）或直接写入脏数据，导致学习进度、错题本等功能无法正常工作。联调前必须先把契约对齐。

---

## 四、儿童模式 / 后台边界影响分析

### 4.1 当前问题

`App.vue` 中 `AdminPanel`（内容管理后台）直接作为第10个 tab 暴露在主导航中，与儿童学习模块并列：

```javascript
{ id: 'admin', name: '内容管理', icon: '⚙️' }
```

这造成以下边界问题：
1. **用户体验冲突**：6岁儿童会看到"内容管理"入口，不理解其含义，增加认知负担。
2. **权限模型弱化**：AdminPanel 虽然内部有管理员权限校验，但入口本身没有隔离，儿童可以点击进入（虽然后续操作会被后端拒绝）。
3. **导航过载**：设计规范要求导航入口不超过5个，当前10个 tab 已严重超载。

### 4.2 对本轮开发的影响

本轮 UI 改版的核心目标之一是"4宫格大入口"（P0）。如果仅把 10 tab 缩成 4 tab，但继续保留 AdminPanel 在主界面，会导致：
- 要么 AdminPanel 也必须被塞进 4 宫格，进一步混淆儿童/家长/管理员边界；
- 要么必须先把 AdminPanel 从主学习流程中剥离，这就涉及权限路由和入口架构的调整。

**技术决策建议**：AdminPanel 不应属于儿童学习主流程的一部分，应迁移到独立路由/admin或登录后的角色分流页面中。

---

## 五、本轮实施边界建议

### 5.1 建议纳入本轮范围（内容API接入相关）

1. **契约修复（P0，1人日）**
   - 统一前端 `utils/api.js` 和各个 view 中 `learning/records`、`learning/mistakes` 的字段名与类型，严格与 API.md + 后端实现对齐。
   - 建立 `studentId`、`topicId`（整数）的正确传递链路。

2. **内容API接入试点（P1，2-3人日）**
   - 选择 **一个** 学习模块作为 content API 接入试点（建议 `InteractiveQuiz` 或 `CharacterLearning`）。
   - 前端在 `onMounted` 中调用 `GET /api/v1/content/topics?category=xxx` 获取内容，替代硬编码数据。
   - 验证 `content` JSON Schema 到 Vue 组件Props的映射是否可行。

3. **AdminPanel 入口剥离（P1，1人日）**
   - 从 `App.vue` 的 4 宫格导航中移除 AdminPanel。
   - 在登录后增加简单角色判断：若用户 role=admin，显示"进入管理后台"入口；否则不显示。

### 5.2 建议暂不纳入本轮范围

1. **全模块同时接入 content API**：工作量大（5个模块数据格式各异），且需要先通过单一试点验证 JSON Schema 的适配性，否则返工风险高。
2. **前端内容配置化渲染（动态组件）**：属于架构升级，需要在试点验证 JSON Schema 映射后，再设计统一的 `TopicRenderer` 组件体系。
3. **大规模后端 Schema 变更**：当前 `content` JSON 结构已能覆盖 5 种类型，短期内无需调整数据库表结构。

### 5.3 与UI改版的协调边界

本轮 P0 UI 改版（4宫格导航、配色、按钮尺寸）可以**与契约修复并行**，但内容API接入试点**应在 UI 基础组件（BaseButton/BaseCard）稳定之后再做**，避免数据层和展示层同时变动带来的联调复杂度。

建议的并行策略：
- **前端开发**：Week 1 做 P0 UI 改版 + 契约修复；Week 2 选一个模块做 content API 接入试点。
- **后端开发**：仅需配合联调，本轮后端本身无需新增代码（content API 已就绪）；若有 JSON Schema 返回格式调整需求，在试点中快速迭代。

---

## 六、关键风险与规避策略

| 风险 | 等级 | 说明 | 规避策略 |
|------|------|------|----------|
| **契约调用已静默失败** | 🔴 高 | 前端学习记录/错题接口调用字段不匹配，可能一直在抛错但没有被用户感知 | 前端立即修复字段名；联调时抓包确认 200 返回；增加 API 错误提示 |
| **硬编码数据与后台内容长期脱节** | 🔴 高 | AdminPanel沦为摆设，运营人员修改内容不生效 | 锁定一个模块做 API 接入试点，跑通"后台改→前端生效"的闭环 |
| **JSON Schema 适配复杂度被低估** | 🟡 中 | 5种 content 类型格式差异大，统一渲染困难 | 不追求一次性统一，先通过手动映射跑通试点，再抽象通用组件 |
| **AdminPanel 剥离影响现有路由** | 🟡 中 | 从主导航移除 AdminPanel 可能需要增加独立路由/登录分流 | 最简单的方案：在登录后的首页用条件渲染显示"管理后台"按钮，href="#/admin" |
| **UI改版与数据层改造叠加** | 🟡 中 | 如果同时进行大规模UI重构和内容API接入，联调面过广 | 严格分优先级：P0 UI 和契约修复先行，API 接入试点紧随其后 |

---

## 七、技术决策建议

### 决策1：学习记录/错题字段名统一采用 camelCase（已确定）

**结论**：前端所有调用统一改为 `studentId`、`topicId`、`activityType`、`wrongAnswer`、`correctAnswer`、`questionId`。

**Why**：后端 API 和 API.md 均使用 camelCase，且 `topic_type` 不是后端 schema 中的字段。当前前端的 snake_case 属于历史残留，必须修正。

### 决策2：topicId 统一使用 topics 表主键整数ID

**结论**：前端学习模块在调用 `learning/records` 和 `learning/mistakes` 时，必须传入从 content API 获取到的整数 `topic.id`，而不是自定义字符串（如 `'jiangnan'`、`'matching'`）。

**Why**：后端数据库有严格的外键约束（`topic_id INTEGER NOT NULL`，关联 `topics.id`），传入字符串会导致写入失败或数据库报错。

### 决策3：AdminPanel 从儿童主界面剥离

**结论**：AdminPanel 不应出现在 4 宫格或底部导航中。管理员入口迁移到登录后首页的条件渲染区域，普通家长/儿童不可见。

**Why**：儿童模式和后台管理是两种完全不同的用户场景，混在一起会造成严重的信息架构和权限边界问题。

### 决策4：内容API接入采用"单模块试点"策略

**结论**：本轮不追求5个模块全部接入，先选择 `InteractiveQuiz` 作为试点（原因：structure相对统一，只有questions数组），验证从 `GET /topics?category=quiz` 到组件渲染的全链路。

**Why**：降低并行风险；JSON Schema 到组件的映射需要先跑通一个完整闭环，再向其他模块推广。InteractiveQuiz 的题目格式最接近通用 `questions[]` 结构，迁移成本最低。

### 决策5：content JSON 的 Schema 版本控制

**结论**：在 topics.content 中增加可选的 `schemaVersion` 字段（如 `"schemaVersion": "1.0"`），为未来扩展预留空间。

**Why**：当前 JSON 结构虽然没有问题，但5种类型各自演进后可能出现格式不兼容。通过版本号可以在不修改数据库表结构的情况下支持增量升级。

---

## 八、前后端联调阶段评审支持清单

联调时，请前后端开发按以下清单逐项确认，架构师将参与重点项复核：

### 8.1 契约对齐检查
- [ ] 前端 `POST /learning/records` 参数：`studentId`（整数）、`topicId`（整数）、`activityType`（enum）、`score`、`durationSeconds`
- [ ] 前端 `POST /learning/mistakes` 参数：`studentId`（整数）、`topicId`（整数）、`questionId`（字符串）、`wrongAnswer`、`correctAnswer`
- [ ] 后端返回 400 时，前端有非 `alert` 的用户友好错误提示
- [ ] 后端 `learning_records` 和 `mistakes` 表成功写入数据且无 NULL `topic_id`

### 8.2 内容API接入检查（试点模块）
- [ ] 试点模块 `onMounted` 正确调用 `GET /api/v1/content/topics?category=xxx`
- [ ] `topic.content` JSON 能正确解析并映射到组件状态
- [ ] AdminPanel 修改知识点后，刷新试点模块页面，内容实时生效
- [ ] 空内容/网络异常时有兜底 Loading / EmptyState 展示

### 8.3 边界与权限检查
- [ ] 普通家长账号登录后，看不到 AdminPanel 入口
- [ ] admin 账号登录后，有独立入口进入内容管理
- [ ] 非 admin 用户直接访问 `/admin` 路由时，被后端返回 403 或被前端路由拦截

---

## 九、附：相关文件索引

- 后端 content API：`server/src/routes/content.js`
- 后端 learning API：`server/src/routes/learning.js`
- 前端 API 封装：`client/src/utils/api.js`
- 前端学习模块（待接入）：
  - `client/src/views/CharacterLearning.vue`
  - `client/src/views/PinyinPractice.vue`
  - `client/src/views/MathPractice.vue`
  - `client/src/views/InteractiveQuiz.vue`
  - `client/src/views/StoryModule.vue`
  - `client/src/views/ScratchModule.vue`
- 前端管理面板（已接入）：`client/src/views/AdminPanel.vue`
- 接口文档：`docs/API.md`
- 架构文档：`docs/ARCHITECTURE.md`
- 数据库设计：`docs/DATABASE.md`
- UI 改版交付映射：`docs/design-to-frontend-delivery.md`
- 前端审计报告：`docs/frontend-audit-report.md`

---

*评审完成，建议尽快召开前后端联调启动会，确认试点模块和联调排期。*
