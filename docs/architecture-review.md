# 幼儿园学习平台 — 架构梳理与模块重构建议

> 目标读者：项目总监、前端开发、交互设计师、测试工程师
> 核心约束：产品面向 6 岁儿童，必须满足「护眼」与「好交互」两个硬性要求

---

## 一、当前功能全景

### 1.1 已实现的 10 个一级 Tab
| Tab ID | 名称 | 内容概述 |
|--------|------|----------|
| characters | 汉字学习 | 《江南》诗词、认字翻转卡、书写演示动画、内置认字测验 |
| pinyin | 拼音练习 | 整体认读音节、复韵母、拼音-汉字配对游戏 |
| math | 数学练习 | 20 以内应用题（共 7 道）、错题本 |
| story | 故事阅读 | 2 个短篇故事 + 阅读理解题 |
| scratch | Scratch 编程 | 3 节图文课程（无真实 Scratch 编辑器） |
| quiz | 互动测验 | 8 道混合题（汉字/拼音/诗词），含星级奖励 |
| cards | 学习卡片 | 分类翻转卡 + 记忆翻牌游戏 |
| gamification | 学习成就 | 积分/等级/连续天数/徽章/排行榜 |
| review | 错题复习 | 按学生筛选、分类、掌握状态管理、智能复习推荐 |
| admin | 内容管理 | 知识点的 CRUD + 批量导入 |

### 1.2 技术栈
- **前端**：Vue 3（Composition API）+ Vite + Pinia（仅 auth store）
- **后端**：Fastify + SQLite + JWT Cookie 认证
- **导航**：无 vue-router，全部使用 `App.vue` 中的 `currentTab` + `v-if` 条件渲染
- **部署**：GitHub Actions → rsync → Nginx（原子发布，symlink 切换）

---

## 二、架构分层现状

```
┌─────────────────────────────────────────────┐
│  App.vue (导航 + 全局 footer)               │
├─────────────────────────────────────────────┤
│  Views (10 个 .vue 文件)                    │
│  ├─ 数据定义 (硬编码题目/诗词/故事)          │
│  ├─ 业务状态 (quizStarted / gameMode ...)   │
│  ├─ 进度持久化 (localStorage + API fetch)   │
│  ├─ 接口调用 (utils/api 或 裸 fetch 混用)   │
│  └─ UI 样式 (scoped CSS，各自为政)          │
├─────────────────────────────────────────────┤
│  Pinia Store (仅 auth)                      │
├─────────────────────────────────────────────┤
│  Fastify API Routes                         │
│  ├─ /api/v1/auth                            │
│  ├─ /api/v1/students                        │
│  ├─ /api/v1/learning (records / mistakes)   │
│  ├─ /api/v1/content (topics CRUD)           │
│  └─ /api/v1/gamification                    │
└─────────────────────────────────────────────┘
```

### 关键结论：当前没有真正的「业务中间层」
- 10 个视图组件全部直接顶到数据层和 UI 层，形成**厚实的 UI 大单体**。
- 任何跨模块的数据需求（如统一错题统计、统一进度条）都必须侵入式修改每个组件。

---

## 三、发现的 6 大问题

### 问题 1：展示职责不清 —— 一个组件 = 数据集 + 状态机 + API 层 + UI 层
每个 `.vue` 文件都包含了本模块的全部生命周期：
- 硬编码的学习内容（如 `CharacterLearning.vue` 里的 9 个汉字、`InteractiveQuiz.vue` 里的 8 道题）
- 自己的进度结构（`localStorage` key 命名不一致：`character-learning-progress`、`pinyin-practice-progress`…）
- 自己的 API 调用逻辑（有的用 `utils/api.js`，有的用裸 `fetch`）

**后果**：新增一个学科模块时，需要复制 200~400 行代码并改遍细节，极易遗漏。

### 问题 2：模块耦合在 `App.vue` 的导航栏里
`App.vue` 同时做两件事：
1. 维护 `tabs` 数组（导航 UI）
2. 维护 10 个 `v-if` 条件渲染（路由职责）

新增第 11 个模块时，必须同时改 `tabs` 数组 + import 语句 + `v-if` 块。**导航与模块内容未解耦**。

### 问题 3：后端 CMS 与前端学习模块数据断裂
- Admin 后台可以动态增删改「知识点」（topics 表）。
- 但 6 个学习模块（characters/pinyin/math/story/scratch/quiz）的数据全部写死在前端代码中。

**后果**：运营/老师通过 admin 修改内容后，前端页面完全无感知。系统存在「两套内容体系」：
- 前端自嗨的静态数据（用户实际看到）
- 后端 topics 表（仅 admin 和错题关联在用）

### 问题 4：进度与错题体系重复实现
以下逻辑在每个学习模块里几乎重写了一遍：
1. `onMounted` 读 `localStorage`
2. 答题后 `api.post('/learning/records', ...)`
3. 答错后 `api.post('/learning/mistakes', ...)`
4. 计算 `progressPercent`

**后果**：统一调整积分规则、增加学习时长统计、接入家长报告，都需要改 6~8 个文件。

### 问题 5：缺乏可复用的交互组件库
以下元素在每个模块中独立 CSS 实现，视觉和交互不一致：
- 进度条（`CharacterLearning`、`MathPractice` 各写了一套）
- 选项按钮（`InteractiveQuiz`、`StoryModule`、`CharacterLearning` 三套 hover/选中态）
- 翻转卡片（`CharacterLearning` 的认字卡 和 `LearningCards` 的记忆卡 结构相似但代码未复用）
- 游戏成功反馈（ medal/star/bounce 动画散落各处）

### 问题 6：UI 明显不符合 6 岁儿童「护眼+好交互」要求
| 维度 | 现状 | 风险 |
|------|------|------|
| 色彩 | 大量使用高饱和紫蓝渐变 `#667eea` → `#764ba2`、亮粉 `#f5576c` | 视觉冲击强，长时间观看易疲劳 |
| 对比度 | 深色文字压在彩色渐变背景上，部分区域对比度过高 | 不符合低龄护眼建议 |
| 字体 | 正文 1.1~1.3rem，选项按钮 1.2rem | 对 6 岁儿童偏小，平板距离下难以辨识 |
| 触控 | 导航按钮间距 15px，记忆卡 grid gap 15px | 幼儿手指粗大，容易误触 |
| 信息密度 | 单屏（CharacterLearning）堆叠了诗词、认字、书写、测验 4 个区块 | 注意力被过度分散 |
| 反馈 | 主要靠文字提示（"太棒了！"），无语音、无震动、无大型动画引导 | 识字量有限的儿童难以理解 |

---

## 四、模块边界重构方案

### 4.1 目标架构（分层解耦）

```
┌─────────────────────────────────────────────────────────────┐
│  展现层 (Presentation)                                      │
│  ├─ AppShell.vue           ← 只负责布局壳+全局路由出口      │
│  ├─ BottomNav.vue          ← 底部大按钮导航（幼儿版）        │
│  ├─ TabHome.vue            ← 学习广场：快捷入口+今日任务     │
│  └─ 各学习模块页面（只负责拼装业务组件）                     │
├─────────────────────────────────────────────────────────────┤
│  业务组件层 (Business Components)                           │
│  ├─ ContentPlayer/          ← 内容播放器（诗词、故事、课程） │
│  ├─ QuizEngine/             ← 测验引擎（单选、连线、排序）   │
│  ├─ CardDeck/               ← 卡片组（翻转、记忆配对）       │
│  ├─ WritingCanvas/          ← 书写板（田字格+笔顺）         │
│  ├─ ProgressBar/            ← 统一进度条                   │
│  └─ RewardOverlay/          ← 奖励弹层（星星、徽章、语音）   │
├─────────────────────────────────────────────────────────────┤
│  业务逻辑层 (Domain/Composables)                            │
│  ├─ useLearningProgress(topicId)  ← 统一进度读写           │
│  ├─ useMistakeTracker()           ← 统一错题记录           │
│  ├─ useSessionTimer()             ← 学习时长统计           │
│  ├─ useGamification()             ← 积分/徽章触发          │
│  └─ useContentStore()             ← 从后端拉取学习内容     │
├─────────────────────────────────────────────────────────────┤
│  数据服务层 (API/Store)                                     │
│  ├─ stores/content.js        ← topics / questions / stories│
│  ├─ stores/progress.js       ← records / mistakes          │
│  ├─ stores/gamification.js   ← points / badges / leaderboard│
│  └─ utils/api.js             ← 已存在，需统一使用          │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 模块重组建议：把 10 个 Tab 归并为 4 大场景

目前 10 个 Tab 对幼儿认知负荷过重，建议前端导航收敛为 **4 大核心入口 + 2 个辅助入口**：

| 新入口 | 包含的原模块 | 幼儿认知模型 |
|--------|-------------|-------------|
| **今日学习** | 汉字学习、拼音练习、数学练习、故事阅读 | "今天要学什么" |
| **趣味游戏** | 互动测验、学习卡片（记忆游戏） | "玩一玩" |
| **我的成就** | 学习成就、错题复习 | "我得到了什么" |
| **内容管理** | AdminPanel（家长/教师专用） | 独立入口或隐藏 |

> **Scratch 编程** 当前仅 3 节图文介绍、无真实编辑器，建议暂并入「故事阅读」作为科普小课，或独立为「探索发现」二级入口，避免占据一级导航。

### 4.3 路由改造建议

- **短期**：继续使用 `currentTab` 模式，但把 `App.vue` 拆成 `AppShell + RouterView` 的概念：
  - `App.vue` 只 import 6 个入口组件（Home / Games / Achievements / Admin / CharacterDetail / QuizDetail...）
  - 各学习模块内部再用子状态（`subView`）切换，避免 App.vue 膨胀。
- **中期**：一旦需要 URL 分享/刷新定位，再引入 vue-router（已安装但未使用）。

---

## 五、职责混乱点的具体优化清单

### 5.1 数据与展示解耦（高优先级）

| 原位置 | 硬编码内容 | 优化动作 |
|--------|-----------|----------|
| `CharacterLearning.vue:118-128` | 9 个汉字数据 | 迁移到 `topics` 表或独立 `characters.json`，前端用 `useContentStore` 拉取 |
| `InteractiveQuiz.vue:104-171` | 8 道测验题 | 建立 `questions` 表（关联 topic_id），由 Admin 后台动态配置 |
| `PinyinPractice.vue:89-115` | 拼音卡片 + 配对游戏数据 | 同上，配对游戏从 topic_content 中解析生成 |
| `MathPractice.vue:61-69` | 7 道应用题 | 同上，应用题结构化存储 |
| `StoryModule.vue:54-82` | 2 个故事 + 题目 | 建立 `stories` + `story_questions` 表 |
| `ScratchModule.vue:50-93` | 3 节课程 | 暂时保留静态 JSON 文件，但统一走 `useContentStore` 加载 |

### 5.2 统一进度与错题逻辑（高优先级）

新建 `composables/useLearningSession.js`：

```js
// 伪代码
export function useLearningSession(topicId, activityType) {
  const { start, stop, duration } = useSessionTimer()
  const progress = useLearningProgress(topicId)
  const tracker = useMistakeTracker(topicId)

  const submit = async (score, completed = false) => {
    await progress.save({ score, duration: duration.value, completed })
    await gamification.sync(score, activityType)
  }

  return { start, submit, recordMistake: tracker.add }
}
```

所有学习模块只调用此 composable，不再各自写 `localStorage` + `fetch`。

### 5.3 建立业务组件库（中优先级）

| 组件 | 覆盖场景 | 设计约束（幼儿版） |
|------|---------|-------------------|
| `KProgressBar` | 所有学习模块 | 高度 ≥ 24px，圆角大，配色用柔和绿/黄 |
| `KOptionButton` | 测验/故事答题 | 按钮高度 ≥ 64px，字体 ≥ 1.5rem，间距 ≥ 16px |
| `KFlipCard` | 认字卡、学习卡片 | 尺寸统一 160×200px，翻转动画 0.4s 以内 |
| `KMemoryGrid` | 记忆配对游戏 | 卡片 ≥ 80×80px，网格 gap ≥ 20px |
| `KVoiceButton` | 拼音、诗词朗读 | 大喇叭图标 + 点击振动/语音反馈 |
| `KRewardModal` | 答题正确、完成关卡 | 全屏遮罩，大星星/徽章动画，语音播报 |

### 5.4 护眼与交互优化专项（高优先级）

建议制定《幼儿 UI 设计规范》并写入 `docs/ui-guidelines.md`：

1. **色彩规范**
   - 背景色：米白 `#FDF8F0` 或淡绿 `#F0F7F4`（替代纯白/高饱和渐变）
   - 主色：柔和蓝 `#7EB5A6`、暖黄 `#F4D03F`、柔粉 `#E8A0BF`
   - 禁用：#667eea 高饱和紫蓝、#d63031 亮红大面使用

2. **字体规范**
   - 标题：≥ 2rem（32px）
   - 正文/题目：≥ 1.5rem（24px）
   - 按钮文字：≥ 1.4rem（22px）
   - 优先使用圆体/黑体，避免细体

3. **触控规范**
   - 可点击元素最小尺寸：64×64px
   - 相邻可点击元素间距：≥ 16px
   - 底部导航按钮：单个宽度 ≥ 80px，高度 ≥ 72px

4. **交互反馈规范**
   - 正确答案：绿色高亮 + 欢快音效（预留 Web Audio/TTS 接口）
   - 错误答案：橙色提示 + 鼓励语音（避免红色叉号打击自信）
   - 完成关卡：3 秒全屏庆祝动画 + 徽章飞入

---

## 六、依赖关系与实施路线

### Phase 1：筑基（1~2 周）—— 必须先完成
1. 统一 API 调用方式：所有视图改用 `utils/api.js`（或升级为 axios/fetch wrapper）
2. 提取 `composables/useLearningSession.js` 和 `useContentStore.js`
3. 制定并落地 `docs/ui-guidelines.md`
4. 将 Admin 后台与前端学习模块的数据打通：学习模块开始从 `topics` 表拉数据

### Phase 2：组件化（2~3 周）
1. 创建 `components/business/` 目录，实现 `KProgressBar`、`KOptionButton`、`KFlipCard`、`KMemoryGrid`
2. 用新组件重写 `InteractiveQuiz`（作为 QuizEngine 试点）
3. 用新组件重写 `LearningCards`（作为 CardDeck 试点）
4. 同步把硬编码数据迁移到后端/JSON 文件

### Phase 3：重构导航与布局（1~2 周）
1. 将 10 个 Tab 收敛为 4 大入口（今日学习 / 趣味游戏 / 我的成就 / 内容管理）
2. `App.vue` 瘦身，只负责底部大按钮导航 + 路由状态
3. 引入 `subView` 机制，各模块内部独立完成二级页面切换

### Phase 4：体验优化（持续）
1. 接入 Web Speech API 实现 TTS 朗读
2. 增加触摸/手势优化（如防连点、长按提示）
3. 家长端数据报告页面（基于 `/api/v1/learning/stats`）

---

## 七、对后续需求扩展的预留建议

| 未来需求 | 架构预留点 |
|----------|-----------|
| 新增学科（英语/科学） | 只需新增 topic category + 一个学习模块页面，进度和错题体系完全复用 |
| 家长微信分享学习报告 | 已有 `/learning/stats` 接口，只需新增一个 Report 视图 |
| 接入 AI 语音评测 | 在 `QuizEngine` 中新增 `voice-answer` 题型，其余不变 |
| 多学生切换 | `auth store` 已支持，只需在 `AppShell` 增加全局切换器 |
| 离线缓存 | 在 `useContentStore` 中增加 Service Worker / IndexedDB 层 |
| 多端适配（平板/电视） | 统一业务组件的响应式断点，避免在每个视图写 media query |

---

## 八、总结：最关键的三件事

1. **把数据从组件里抽出来**。现在 6 个学习模块的数据全部写死在前端，后端 CMS 形同虚设。必须先打通「Admin 后台编辑 → 前端动态渲染」这条主线。
2. **建立统一的进度/错题/激励中间层**。 stop 在每个文件里复制粘贴 `localStorage + fetch`。
3. **为 6 岁儿童重新设计交互规范**。当前 UI 是成人审美（高饱和、小字、高密度），需要一套专门的护眼色板、大触控区、强语音反馈规范。

以上三件事做好，后续新增模块、接入家长端、扩展学科都会非常顺畅；反之，系统将持续陷入「复制-修改-遗漏」的泥潭。
