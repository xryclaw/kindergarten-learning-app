# 技术整合评审与实施边界确认

> 评审日期：2026-04-03
> 评审范围：架构设计、设计蓝图、前端审计、后端现状、QA验收准备
> 目标：输出可直接用于项目总结和排期的最终技术结论

---

## 一、模块边界与页面边界的最终建议

### 1.1 最终模块划分（已确认）

基于各方文档的一致性，最终确认 **4 大业务域 + 2 个基础设施域**：

| 业务域 | 包含页面 | 与旧视图映射 |
|--------|---------|-------------|
| **Learn（学习广场）** | `TabHome` + `LearnCharacter` + `LearnPinyin` + `LearnMath` + `LearnStory` | 合并原 CharacterLearning / PinyinPractice / MathPractice / StoryModule |
| **Play（趣味游戏）** | `PlayQuiz` + `PlayCards` | 对应原 InteractiveQuiz / LearningCards |
| **Me（成长中心）** | `MeAchievement` + `MeReview` | 对应原 GamificationView / ReviewSystem |
| **Admin（内容管理）** | `AdminTopics` + `AdminQuestions` | 扩展原 AdminPanel |
| **Content（内容中台）** | 无独立页面，为 Learn/Play/Admin 提供数据 | 新增 Store + Composable |
| **Progress（进度中台）** | 无独立页面，统一记录学习数据 | 新增 Store + Composable |

### 1.2 页面边界原则（本轮必须遵守）

```
AppShell.vue
├── TabHome.vue           ← 仅做入口聚合，不承载学习内容
├── LearnCharacterView    ← 只负责「步骤切换器」+ 业务组件拼装
├── LearnPinyinView       ← 同上
├── PlayQuizView          ← 只负责「题目流转」+ 交互动画
├── PlayCardsView         ← 只负责「卡片网格」+ 游戏状态流转
├── MeAchievementView     ← 只负责数据展示
└── AdminTopicsView       ← 只负责表格/表单/弹窗
```

**红线**：
- 所有视图组件禁止直接写死学习数据（诗词、题目、卡片内容）。
- 所有视图组件禁止直接调用裸 `fetch` 或 `localStorage`。

---

## 二、前端P0优化与总体架构的一致性评审

### 2.1 前端审计报告中的 P0 项

| P0项 | 内容 | 与架构一致性 | 结论 |
|------|------|-------------|------|
| P0-1 | 统一 API 调用入口 | ✅ 完全符合 `stores/content.js` + `stores/progress.js` 的规划 | **本轮落地** |
| P0-2 | 消除 `alert()` 阻塞弹窗 | ✅ 符合儿童交互规范（语音反馈 > 文字反馈） | **本轮落地** |
| P0-3 | 修复导航 Tab 移动端适配 | ✅ 与 `AppShell` 4 宫格重构方向一致 | **本轮落地**（直接改为宫格） |
| P0-4 | 统一各 view 的 max-width / padding | ✅ 为业务组件库提供统一布局基础 | **本轮落地** |
| P0-5 | 补充 `vars.css` 基础变量文件 | ✅ 与设计师的护眼色规范完全对齐 | **本轮落地** |

### 2.2 设计蓝图与架构路线的匹配度

| 设计蓝图要点 | 架构路线对应点 | 匹配度 |
|-------------|---------------|--------|
| 4 宫格大入口导航 | `AppShell.vue` 底部导航 | ✅ 100% 匹配 |
| 暖米色护眼背景 `#F8F6F0` | `vars.css` + 全局主题 | ✅ 100% 匹配 |
| 按钮最小 64px / 导航 120px | `KOptionButton` / `BottomNav` 组件规范 | ✅ 100% 匹配 |
| 汉字学习分步骤 (1/2/3/4) | `ContentPlayer` + `CardDeck` + `QuizEngine` 拼装 | ✅ 100% 匹配 |
| 拼音学习/游戏 Tab 切换 | `LearnPinyinView` 子状态切换 | ✅ 100% 匹配 |
| 测验控制 5 题以内 + 强制缓冲 | `QuizEngine` 状态机规范 | ✅ 100% 匹配 |
| 语音朗读（喇叭图标） | P2 TTS 接入预留 | ✅ 架构已预埋 `KVoiceButton` 接口 |

**评审结论**：前端 P0 优化方向与总体架构完全一致，无需调整方向。设计师蓝图的内容已经可以直接作为前端组件库的开发依据。

---

## 三、后端P0修复与总体架构的一致性评审

### 3.1 发现的阻塞级后端问题

经过代码走查，发现 **`server/src/routes/learning.js` 存在字段名不匹配导致的核心功能失效**。

**问题描述**：
- 后端 `learning.js` 使用 **camelCase** 解析请求体：
  ```js
  const { studentId, topicId, activityType, ... } = request.body
  ```
- 但前端代码（如 `CharacterLearning.vue`、`PinyinPractice.vue` 等）实际发送的是 **snake_case**：
  ```js
  await api.post('/learning/records', {
    student_id: authStore.currentStudent.id,
    topic_id: 'jiangnan',
    ...
  })
  ```
- **结果**：后端校验 `!studentId || !topicId || !activityType` 时，这些字段因前端发送 snake_case 而为 `undefined`，导致请求必然被 400 拒绝。

**影响范围**：
- 学习记录提交（`/learning/records` POST）
- 错题记录提交（`/learning/mistakes` POST）
- 这意味着**当前生产环境的学习进度和错题系统实际上无法正常工作**。

**修复方案**：
1. **首选**：后端接口兼容 snake_case（与前端现状对齐），或前端统一改为 camelCase（与 API.md 文档对齐）。
2. **建议**：后端采用兼容写法，同时接受 `student_id` / `studentId`、`topic_id` / `topicId`，避免一次性改遍所有视图。
3. **验证方式**：QA 提交一次学习记录，确认返回 200 且有数据库新增记录。

### 3.2 后端内容 API 现状评估

当前 `content.js` 已提供：
- `GET /content/topics` / `GET /content/topics/:id` ✅
- `POST/PUT/DELETE /content/topics` ✅
- `POST /content/topics/import` ✅

**缺失但 P1 必需的接口**：
| 缺失接口 | 用途 | 建议实现方式 | 优先级 |
|---------|------|-------------|--------|
| `GET /content/cards` | PlayCards 拉取记忆游戏数据 | 基于 `topics` 表 `category='cards'` 或从 topic.content 中解析 | P1 |
| `GET /content/topics/:id/questions` | QuizEngine 拉取题目 | 从 `topic.content.questions` 中提取返回 | P1 |

**评审结论**：后端基础 CRUD 已具备，但 **P0 必须优先修复 learning.js 的字段名不匹配问题**（这是一个功能失效级 bug）。内容 API 的扩展可在 P1 阶段通过复用现有 `topics` 表结构完成，不需要新增独立数据表。

---

## 四、后续工作的技术边界

### 4.1 内容 API 接入边界

**已确定**：
- 内容统一走 `topics` 表，以 JSON `content` 字段存储差异化内容。
- 前端通过 `stores/content.js` 拉取。

**待确定（P0 结束前必须关闭）**：
- `topic.content` 的 JSON Schema 需要规范。建议按以下结构约束：
  ```json
  {
    "type": "character|pinyin|math|story|quiz|cards",
    "intro": { "title": "...", "content": "..." },
    "items": [ ... ],
    "questions": [ ... ],
    "interactions": { ... }
  }
  ```
- **边界**：P1 只支持 `character`、`pinyin`、`quiz`、`cards` 四种 content type。`math` 和 `story` 的格式规范放到 P2 细化，但 P1 可以先使用硬编码过渡。

### 4.2 组件抽象边界

**本轮（P1）必须实现的组件**：
| 组件 | 最小可用版本要求 |
|------|-----------------|
| `KProgressBar` | 纯展示，高度 24px，圆角大，颜色从 vars.css 读取 |
| `KOptionButton` | 支持 `variant=primary/secondary/game`，最小 64px 高，带 active 态 |
| `KFlipCard` | 支持 `front/back` slot，翻转动画 ≤ 0.4s |
| `KMemoryGrid` | 基于 `KFlipCard`，支持 2/3/4 列响应式 |
| `QuizEngine` | 支持 `select` 题型（单选），垂直选项，答完显反馈，强制下一题 |
| `BaseModal` | 统一遮罩层，支持点击遮罩关闭 |

**明确放到 P2 的组件**：
- `WritingCanvas`（田字格书写板）—— 依赖笔顺动画库或 SVG 路径，技术栈较重
- `ContentPlayer`（故事/诗词播放器）—— P1 可用简单文字排版替代
- `KVoiceButton`（语音按钮）—— P2 接入 Web Speech API 时一起实现

### 4.3 儿童模式 / 后台隔离边界

**已确定**：
- Admin 后台与家长/儿童前台必须视觉隔离。
- 当前 `AdminPanel.vue` 已经有管理界面风格（表格、表单、分页），可保留。
- 但 Admin 入口不应出现在儿童使用的一级导航中。

**建议做法**：
- 在 `AppShell.vue` 的底部导航中**不出现 Admin 入口**。
- Admin 入口放在：
  1. 登录后根据 `user.role === 'admin'` 在顶部或侧边显示「管理后台」按钮；或
  2. 直接通过独立 URL `/admin` 访问，由路由守卫控制权限。
- **边界**：Admin 的样式和功能在本轮只保持现有能力，不扩展新功能（如题目管理、故事管理）到 P2。

---

## 五、建议保留到下一迭代的事项与原因

### 5.1 明确放到 P2（下一迭代）

| 事项 | 原因 |
|------|------|
| **数学练习模块重构** | 需要设计蓝图中的「题目配图」素材支持，当前无图素材，无法完成体验目标 |
| **故事阅读模块重构** | 需要 TTS 语音朗读配合才能形成完整闭环，纯文字重构价值不高 |
| **Scratch 编程模块** | 当前仅 3 节图文课，无真实编辑器，放入 P2 评估是否保留或替换 |
| **Web Speech API / TTS 深度接入** | 技术实现不难（0.5 人日），但应等核心模块（汉字/拼音/测验/卡片）重构稳定后统一接入，避免返工 |
| **书写练习动画（笔顺演示）** | 当前动画只是 CSS opacity/scale，真正笔顺需要 SVG 绘制引擎或第三方库（如 HanziWriter），技术成本和收益比不适合 P1 |
| **家长端学习报告页面** | 依赖 `/learning/stats` 接口已有，但页面设计和数据可视化需要额外设计投入 |
| **排行榜默认隐藏/可选显示** | UI 改动小，但涉及权限/家长控制配置，建议与「家长控制面板」一起在 P2 做 |

### 5.2 明确放到 P3（长期）

| 事项 | 原因 |
|------|------|
| 护眼模式一键切换 | 需要全局 CSS token 迁移完成后再做主题切换，当前先把默认主题改成护眼色即可 |
| 学习时长控制 / 休息提醒 | 功能完整但属于运营增强，非核心学习体验 |
| 离线缓存（Service Worker） | 架构已预留接口，但测试和兼容性工作量大 |
| 多端适配（电视/大屏） | 当前主要使用场景为平板，优先级不高 |

---

## 六、本轮可确认落地的清单（P0+P1）

### P0 - 基础修复（1.5 周）
- [ ] **后端**：修复 `learning.js` 请求体字段名兼容问题（snake_case / camelCase）
- [ ] **前端**：建立 `vars.css` 并导入全局护眼色变量
- [ ] **前端**：重写 `AppShell.vue` 底部 4 宫格导航
- [ ] **前端**：统一 API 调用，消除裸 `fetch` 和 `alert()`
- [ ] **前后端对齐**：确定 `topic.content` JSON Schema（仅 `character/pinyin/quiz/cards`）

### P1 - 核心重构（2.5 周）
- [ ] **前端**：实现 `KProgressBar` / `KOptionButton` / `KFlipCard` / `KMemoryGrid`
- [ ] **前端**：搭建 `stores/content.js` + `stores/progress.js`
- [ ] **前端**：重构 `PlayQuizView`（题目从后端拉取，进度走 progress store）
- [ ] **前端**：重构 `PlayCardsView`（卡片从后端拉取）
- [ ] **前端**：搭建 `TabHome` 学习广场
- [ ] **前端**：完成 `LearnCharacterView` 第一步（诗词引入 + 认字卡片）
- [ ] **前端**：完成 `LearnPinyinView`（学习模式 + 游戏模式）
- [ ] **后端**：扩展 `GET /content/topics/:id` 或新增接口支持拉取 questions / cards 数据

### QA 验收重点
- [ ] 学习记录提交后数据库有真实记录（验证后端字段名修复）
- [ ] PlayQuiz 的答题流程：选题 → 反馈 → 下一题 → 结果页（验证 QuizEngine 组件）
- [ ] PlayCards 的配对流程：翻牌 → 匹配 → 成功提示（验证 KMemoryGrid 组件）
- [ ] 底部导航切换 4 个主入口无异常（验证 AppShell）
- [ ] Admin 入口不出现在儿童导航中（验证隔离边界）

---

## 七、风险与规避

| 风险 | 影响 | 规避策略 |
|------|------|----------|
| 后端字段名 bug 未修复，导致 P1 进度 store 联调失败 | 高 | 将此 bug 设为 P0 第一优先级，QA 在 P0 结束前必须验收通过 |
| 设计蓝图中的素材（题目配图、徽章图标）不到位 | 中 | P1  PNG/SVG 先用 emoji/纯色块占位，不影响组件逻辑 |
| `topic.content` Schema 迟迟不定稿 | 高 | 架构师在 P0 结束前出具最终 Schema（本文档 4.1 节），冻结后 P1 不再改 |
| 旧视图和新组件短期共存导致样式冲突 | 中 | `AppShell` 加载全局 vars.css 时使用低特异性选择器，旧视图 `scoped` 样式优先级足够覆盖局部 |

---

## 八、最终结论

1. **各方输出高度一致**：设计蓝图、前端审计、架构重构方案在「4 宫格导航、护眼色系、组件化、数据配置化」四个方向上完全对齐，可以进入实施阶段。

2. **后端 P0 修复是最大阻塞项**：`learning.js` 的字段名不匹配导致学习记录和错题功能实际不可用，**必须在任何 P1 工作之前修复**，否则进度中台联调无法进行。

3. **P1 范围已收敛**：优先做 `PlayQuiz` + `PlayCards` + `TabHome` + `AppShell` + `LearnCharacter（第一步）` + `LearnPinyin`，这构成了一个完整的「可演示闭环」。其余模块和体验增强放到 P2。

4. **下一迭代（P2）的入口条件**：P1 验收通过后，P2 只需「复制模式」：把汉字/拼音的重构经验套用到数学/故事/成就/错题模块，并接入 TTS。这意味着 P2 的排期风险非常低。

---

*本文档可直接作为项目总结附件和下一轮排期依据。*
