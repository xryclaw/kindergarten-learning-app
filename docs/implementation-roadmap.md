# 幼儿园学习平台 — 架构结论收敛与模块实施路线图

> 版本：v1.0
> 目标：直接指导下一轮开发排期
> 约束：产品面向 6 岁儿童，所有决策以「护眼+好交互」为第一性原则

---

## 一、目标模块划分与职责边界

将现有「10 个一级 Tab 平铺」收敛为「4 大业务域 + 2 个基础设施域」。

### 1.1 业务域（用户直接感知）

| 业务域 | 代号 | 职责边界 | 内含原子模块 |
|--------|------|----------|-------------|
| **学习广场** | `Learn` | 今日学习任务入口、学科快捷通道、最近学习续播 | 汉字学习 / 拼音练习 / 数学练习 / 故事阅读 |
| **趣味游戏** | `Play` | 以游戏化形式巩固知识，产出可计分的互动行为 | 互动测验 / 学习卡片（记忆游戏） |
| **成长中心** | `Me` | 学习成果展示、错题复习、徽章激励 | 学习成就 / 错题复习 |
| **内容管理** | `Admin` | 家长/教师专用的内容配置入口 | 知识点 CRUD / 题库管理 / 批量导入 |

### 1.2 基础设施域（用户不直接感知，支撑全部业务域）

| 基础设施域 | 代号 | 职责边界 |
|-----------|------|----------|
| **内容中台** | `Content` | 统一承接 Admin 编辑后的内容，向前端各学习模块分发 topics / questions / stories / cards |
| **进度中台** | `Progress` | 统一记录学习时长、答题记录、错题、积分、徽章触发 |

### 1.3 职责边界原则（开发时必须遵守）

```
┌────────────────────────────────────────────────────────────┐
│  视图页面 (Views)                                          │
│  只负责：布局拼装 + 子组件 orchestration + 路由状态切换      │
│  禁止：硬编码学习数据、直接调用 fetch API、监听全局状态      │
├────────────────────────────────────────────────────────────┤
│  业务组件 (Business Components)                            │
│  只负责：纯交互行为 + UI 渲染 + 向父组件 emit 事件           │
│  禁止：知晓后端接口细节、读写 localStorage                  │
├────────────────────────────────────────────────────────────┤
│  Composables / Stores                                      │
│  只负责：数据获取、状态持久化、跨组件共享                    │
│  禁止：操作 DOM、包含 UI 样式                               │
└────────────────────────────────────────────────────────────┘
```

---

## 二、页面/功能与模块的映射关系

### 2.1 映射总表

| 当前页面（.vue） | 归属业务域 | 在新的模块体系中的定位 | 改动方式 |
|-----------------|-----------|----------------------|----------|
| `App.vue` | — | `AppShell.vue`：底部大导航（4 个主入口）+ 全局背景色 | 重构 |
| `Login.vue` | — | 保留，增加「选择学生」步骤 | 局部优化 |
| `CharacterLearning.vue` | Learn | `LearnCharacterView.vue`：调用 `ContentPlayer` + `CardDeck` + `WritingCanvas` | 重构 |
| `PinyinPractice.vue` | Learn | `LearnPinyinView.vue`：调用 `ContentPlayer` + `QuizEngine(match)` | 重构 |
| `MathPractice.vue` | Learn | `LearnMathView.vue`：调用 `QuizEngine(input)` + `KProgressBar` | 重构 |
| `StoryModule.vue` | Learn | `LearnStoryView.vue`：调用 `ContentPlayer` + `QuizEngine(select)` | 重构 |
| `ScratchModule.vue` | Learn | 降级为「故事阅读」下的一个图文 topic，或暂不改动 | 暂缓 |
| `InteractiveQuiz.vue` | Play | `PlayQuizView.vue`：调用 `QuizEngine` 完整能力 | 重构（首批试点） |
| `LearningCards.vue` | Play | `PlayCardsView.vue`：调用 `CardDeck` 完整能力 | 重构（首批试点） |
| `GamificationView.vue` | Me | `MeAchievementView.vue`：调用 `Progress` Store 数据 | 局部优化 |
| `ReviewSystem.vue` | Me | `MeReviewView.vue`：调用 `Progress` Store 数据 | 局部优化 |
| `AdminPanel.vue` | Admin | `AdminTopicsView.vue`：管理 topics / questions / stories | 扩展 |

### 2.2 新增页面/组件清单

| 新增文件 | 类型 | 职责 | 依赖 |
|---------|------|------|------|
| `AppShell.vue` | 视图 | 全局壳：底部导航、全局背景、学生切换浮球 | 无 |
| `TabHome.vue` | 视图 | 学习广场：快捷入口卡片、今日推荐、继续学习 | `Content` Store |
| `components/business/KProgressBar.vue` | 业务组件 | 统一进度条 | 无 |
| `components/business/KOptionButton.vue` | 业务组件 | 统一选项按钮（大触控区） | 无 |
| `components/business/KFlipCard.vue` | 业务组件 | 翻转卡片 | 无 |
| `components/business/KMemoryGrid.vue` | 业务组件 | 记忆配对网格 | `KFlipCard` |
| `components/business/QuizEngine.vue` | 业务组件 | 测验容器：支持单选/填空/连线 | `KOptionButton` |
| `components/business/ContentPlayer.vue` | 业务组件 | 内容播放：诗词、故事、课程图文 | 无 |
| `composables/useLearningSession.js` | Composable | 统一封装：计时、进度、错题、积分 | `Progress` Store |
| `composables/useContentStore.js` | Composable | 统一拉取 topics / questions / stories | `Content` Store |
| `stores/content.js` | Pinia Store | 内容中台状态管理 | `utils/api.js` |
| `stores/progress.js` | Pinia Store | 进度中台状态管理 | `utils/api.js` |

---

## 三、P0 / P1 / P2 实施优先级

### P0：必须在其他工作之前完成（阻塞项）

| 序号 | 任务 | 产出物 | 为什么阻塞 |
|------|------|--------|-----------|
| P0-1 | **制定内容 API 契约** | `docs/api-contract-content.md` | 前端所有重构都依赖数据结构；若 API 契约未定，组件无法设计 props |
| P0-2 | **设计蓝图定稿** | `docs/ui-guidelines.md` + Figma/设计稿 | 前端组件库的颜色、尺寸、动效必须对齐设计蓝图，否则返工率极高 |
| P0-3 | **建立进度中台 `stores/progress.js`** | `client/src/stores/progress.js` | 所有学习模块都要接入；先做可避免每个模块各自写 localStorage |
| P0-4 | **建立内容中台 `stores/content.js`** | `client/src/stores/content.js` | 将 Admin 后台数据向前端分发；没有它，学习模块仍只能读死数据 |
| P0-5 | **统一 API 调用** | 所有视图改用 `utils/api.js` | 消除裸 fetch 混用，保证认证头、错误处理、baseURL 一致 |

> **P0 工期预估**：1.5 周
> **并行建议**：P0-1 和 P0-2 由后端开发 + 交互设计师并行推进；P0-3 / P0-4 / P0-5 由前端开发独立完成。

### P1：核心重构，可直接产出用户价值

| 序号 | 任务 | 产出物 | 验收标准 |
|------|------|--------|----------|
| P1-1 | **业务组件库（第一批）** | `KProgressBar` / `KOptionButton` / `KFlipCard` / `KMemoryGrid` | 1）符合设计蓝图尺寸规范；2）在 Storybook 或测试页可交互演示 |
| P1-2 | **重构 `InteractiveQuiz` → `PlayQuizView`** | `client/src/views/PlayQuizView.vue` + `QuizEngine.vue` | 1）题目从后端拉取；2）进度走 `stores/progress.js`；3）UI 使用新组件库 |
| P1-3 | **重构 `LearningCards` → `PlayCardsView`** | `client/src/views/PlayCardsView.vue` + `CardDeck` | 1）卡片数据从后端拉取；2）记忆游戏状态封装到 composable；3）UI 使用新组件库 |
| P1-4 | **重写 `AppShell` 导航** | `AppShell.vue` + `BottomNav.vue` | 1）底部 4 大入口（学习/游戏/成就/管理）；2）按钮 ≥ 72px；3）全局背景色改用护眼色 |
| P1-5 | **搭建 `TabHome` 学习广场** | `TabHome.vue` | 1）展示最近学习入口；2）可跳转各学科；3）空状态时友好引导 |

> **P1 工期预估**：2.5 周
> **并行建议**：P1-1 和 P1-4 可并行；P1-2 和 P1-3 依赖 P1-1 完成后启动。

### P2：体验深化与剩余模块迁移

| 序号 | 任务 | 产出物 | 验收标准 |
|------|------|--------|----------|
| P2-1 | **重构汉字学习模块** | `LearnCharacterView.vue` | 诗词、认字卡、书写演示全部走新架构 |
| P2-2 | **重构拼音练习模块** | `LearnPinyinView.vue` | 拼音卡片、配对游戏走新架构 |
| P2-3 | **重构数学练习模块** | `LearnMathView.vue` | 应用题走 `QuizEngine` 输入模式 |
| P2-4 | **重构故事阅读模块** | `LearnStoryView.vue` | 故事内容 + 阅读理解题走新架构 |
| P2-5 | **成长中心整合** | `MeAchievementView.vue` + `MeReviewView.vue` | 1）统一视觉风格；2）数据全部来自 `stores/progress.js` |
| P2-6 | **Admin 扩展题库管理** | AdminPanel 增加 questions / stories 管理 | 可直接配置测验题和故事题 |
| P2-7 | **Web Speech / TTS 接入** | 拼音朗读、题目朗读、奖励语音 | 至少覆盖拼音练习和互动测验 |

> **P2 工期预估**：3 周
> **并行建议**：P2-1~P2-4 模块化程度高，可由不同前端开发并行负责；P2-5 依赖 P2-1~P2-4 的数据稳定后做最终联调。

---

## 四、与设计蓝图、内容 API 的依赖关系

### 4.1 依赖关系图

```
            ┌─────────────────┐
            │  设计蓝图定稿   │
            │   (P0-2)        │
            └────────┬────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
┌──────────────┐ ┌────────────┐ ┌──────────────┐
│ 内容API契约   │ │ 业务组件库 │ │ AppShell重写 │
│  (P0-1)      │ │  (P1-1)    │ │   (P1-4)     │
└──────┬───────┘ └──────┬─────┘ └──────┬───────┘
       │                │              │
       └────────────────┴──────────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   P1 核心重构         │
              │  PlayQuiz / PlayCards │
              │   TabHome 学习广场    │
              └───────────┬───────────┘
                          │
                          ▼
              ┌───────────────────────┐
              │   P2 全面迁移         │
              │ Learn* / Me* / Admin* │
              │   + TTS 体验优化      │
              └───────────────────────┘
```

### 4.2 关键依赖说明

| 依赖链 | 说明 | 若被阻塞怎么办 |
|--------|------|---------------|
| **设计蓝图 → 业务组件库** | 组件库的颜色、圆角、尺寸、动效必须按图施工 | 设计蓝图未定稿前，组件库可先按「最小可用规范」实现（米白背景 + 64px 按钮），后续只做 CSS token 替换 |
| **内容 API 契约 → 所有重构视图** | 数据字段名、嵌套结构、分页方式决定组件 props | 契约未定前，各视图不要写死 props，先用 `content: any` 透传 + 内部做兼容解析 |
| **进度中台 → 所有学习视图** | 统一进度是重构的核心收益 | 进度中台未完成前，允许视图保留旧的 localStorage 回退逻辑，但必须在代码中标记 `TODO: migrate to progress store` |
| **业务组件库 → PlayQuiz / PlayCards** | 两个模块是组件库的首批用户 | 组件库可先实现 3 个最基础组件（KProgressBar / KOptionButton / KFlipCard），满足这两个模块即可 |

---

## 五、内容 API 契约草案（供 P0-1 讨论）

> 以下草案用于加速 P0-1 的落地，后端开发可基于此直接细化。

### 5.1 Topic 统一结构

```json
{
  "id": "topic-char-001",
  "category": "character",
  "title": "《江南》汉字学习",
  "difficulty": 1,
  "orderIndex": 1,
  "content": {
    "type": "character",
    "poem": {
      "title": "江南",
      "lines": ["江南可采莲", "莲叶何田田", "鱼戏莲叶间"]
    },
    "characters": [
      { "char": "江", "pinyin": "jiāng", "meaning": "大河" }
    ],
    "writing": ["可", "叶", "东", "西"]
  },
  "questions": [
    {
      "id": "q-001",
      "type": "select",
      "question": "这个字的拼音是什么？",
      "meta": { "char": "江" },
      "options": ["jiāng", "nán", "kě", "cǎi"],
      "correctIndex": 0
    }
  ]
}
```

### 5.2 建议新增的后端接口

| 接口 | 作用 | 优先级 |
|------|------|--------|
| `GET /api/v1/content/topics?category=xxx` | 按分类拉取学习内容列表 | P0 |
| `GET /api/v1/content/topics/:id` | 拉取单个 topic 完整内容（含 questions） | P0 |
| `GET /api/v1/content/cards?category=xxx` | 拉取学习卡片数据（用于 PlayCards） | P0 |
| `POST /api/v1/content/questions/bulk` | Admin 批量导入题目 | P1 |

---

## 六、适合儿童学习产品的演进原则

### 原则 1：内容可配 > 代码写死
- 所有学习内容（诗词、题目、故事、卡片）必须通过 Admin 或 JSON 配置化。
- 禁止在 `.vue` 文件中新增硬编码数据。
- **红线**：若某学习数据需要改代码才能上线，视为架构缺陷。

### 原则 2：触控优先 > 鼠标优先
- 最小可点击区域 64×64px。
- 相邻可点击元素间距 ≥ 16px。
- 所有 hover 效果必须有对应的 touch/active 态。
- **红线**：出现小于 44×44px 的触控目标，直接打回。

### 原则 3：语音反馈 > 文字反馈
- 所有关键状态转移（答对/答错/完成/获得徽章）必须有非文字反馈。
- 优先顺序：语音播报 > 大动画 > 图标变化 > 纯文字。
- **红线**：对 6 岁儿童仅用一行文字提示重要结果，视为体验缺陷。

### 原则 4：统一组件 > 各写各的 CSS
- 同类型的交互元素（选项按钮、进度条、卡片）必须复用业务组件库。
- 如需新变体，应在组件库中增加 variant，而非在视图里覆盖样式。
- **红线**：在 `views/*.vue` 的 `scoped style` 中新增与已有组件功能重复的 CSS，视为代码债务。

### 原则 5：渐进收敛 > 大爆炸重构
- 允许新旧架构短期共存。
- 新模块严格按新架构开发；旧模块按「先试点、后迁移」的节奏重构。
- **红线**：不要为了统一而一次性冻结全部功能开发。

---

## 七、排期参考（总工期约 7 周）

```
Week 1-2  │  P0：API契约 + 设计蓝图 + 中台搭建
Week 3-4  │  P1：组件库 + PlayQuiz/PlayCards 重构 + AppShell/TabHome
Week 5-6  │  P2：Learn* 模块迁移 + Me* 整合 + Admin 扩展
Week 7    │  联调 + TTS 体验优化 + 测试验收
```

### 本轮可立即启动的最小闭环（MVP）
如果资源受限，建议先把以下 5 项做成一个**可演示的闭环**：
1. `stores/content.js` + 后端 topic 接口（P0）
2. `KProgressBar` + `KOptionButton`（P1-1）
3. `PlayQuizView` 重构（P1-2）
4. `AppShell` 底部 4 入口导航（P1-4）
5. `TabHome` 学习广场首页（P1-5）

这个闭环可在 **2 周内**跑通，直接验证「新架构 + 新交互 + 新导航」的可行性。

---

## 八、风险与规避策略

| 风险 | 影响 | 规避策略 |
|------|------|----------|
| 设计蓝图延迟 | P1 组件库返工 | 先用「最小可用规范」开发组件库，设计图到位后只做 token 替换 |
| 后端 SQLite 结构改动大 | 历史数据迁移困难 | 新表/新字段采用扩展方式，不删除旧字段，保证旧视图仍可运行 |
| 儿童产品无真实用户测试 | 交互假设可能不成立 | 每完成一个 P1 模块，立即在平板设备上让目标年龄段儿童试用 15 分钟 |
| 多模块并行开发冲突 | 代码合并困难 | 各模块基于同一份 `stores/progress.js` 和 `stores/content.js` 开发，禁止在视图层互相依赖 |

---

## 九、总结：开发团队下一步该做什么？

### 立即开始（本周）
- **后端开发**：基于 5.2 节接口草案，细化并落地内容 API 契约；扩展 topics 表结构以支持 questions。
- **交互设计师**：输出 `docs/ui-guidelines.md` + 至少 3 张核心页面设计稿（TabHome / PlayQuiz / PlayCards）。
- **前端开发**：搭建 `stores/progress.js` + `stores/content.js`；提取 `useLearningSession` composable。

### 等待以上完成后启动
- **前端开发**：按 P1 清单开发业务组件库并重构 PlayQuiz / PlayCards。
- **测试工程师**：基于 P1 的 PlayQuiz 编写组件级和端到端测试用例，验证进度中台数据一致性。

### 暂缓（P2 再议）
- 汉字/拼音/数学/故事的详细重构设计（等 PlayQuiz 跑通后复制模式即可）。
- TTS / Web Speech 深度集成（等核心模块稳定后作为体验增强）。
