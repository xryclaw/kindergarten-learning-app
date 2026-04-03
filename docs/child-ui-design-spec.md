# 儿童界面改版设计规范与页面布局蓝图

> 适用对象：6岁儿童
> 设计目标：护眼、低认知负担、强反馈、易点击
> 版本：v1.0

---

## 一、设计规范系统

### 1.1 色彩规范（护眼优先）

#### 主色调
```css
:root {
  /* 背景色 */
  --bg-primary: #F8F6F0;        /* 主背景 - 暖米色 */
  --bg-secondary: #FFFFFF;       /* 卡片背景 - 纯白 */
  --bg-tertiary: #F0EDE5;        /* 次级背景 - 浅米 */

  /* 主题色 */
  --theme-primary: #7CB69D;      /* 主色 - 柔和绿 */
  --theme-secondary: #F5C26B;    /* 次色 - 温暖黄 */
  --theme-accent: #E8A87C;       /* 强调 - 柔和橙 */

  /* 状态色 */
  --state-success: #8BC48A;      /* 成功 - 柔和绿 */
  --state-error: #E88B8B;        /* 错误 - 柔和红 */
  --state-warning: #F5D67B;      /* 警告 - 柔和黄 */

  /* 文字色 */
  --text-primary: #3D3D3D;       /* 主文字 - 深灰 */
  --text-secondary: #6B6B6B;     /* 次要文字 - 中灰 */
  --text-tertiary: #999999;      /* 辅助文字 - 浅灰 */
  --text-white: #FFFFFF;         /* 白文字 */

  /* 边框与分割线 */
  --border-light: #E8E4DC;       /* 浅色边框 */
  --border-medium: #D4CFC4;      /* 中色边框 */
}
```

#### 色彩使用规则
| 场景 | 色值 | 用途 |
|------|------|------|
| 页面背景 | `#F8F6F0` | 全局背景，护眼暖色 |
| 卡片背景 | `#FFFFFF` | 内容卡片，纯净白 |
| 主要按钮 | `#7CB69D` | 主操作按钮 |
| 次要按钮 | `#F5C26B` | 次操作/游戏按钮 |
| 成功反馈 | `#8BC48A` | 答对、完成 |
| 错误反馈 | `#E88B8B` | 答错（温和提示） |
| 文字主色 | `#3D3D3D` | 正文，非纯黑更护眼 |
| 高亮文字 | `#E8A87C` | 关键词、数字 |

#### 禁止使用的颜色
- ❌ 高饱和度紫色（`#667eea` / `#764ba2`）
- ❌ 高饱和度渐变背景
- ❌ 纯黑（`#000000`）文字
- ❌ 荧光色、霓虹色

---

### 1.2 字号规范（易读优先）

#### 字号系统
```css
:root {
  /* 标题层级 */
  --text-hero: 2.5rem;       /* 40px - 页面主标题 */
  --text-h1: 2rem;           /* 32px - 模块标题 */
  --text-h2: 1.6rem;         /* 26px - 卡片标题 */
  --text-h3: 1.4rem;         /* 22px - 小标题 */

  /* 正文层级 */
  --text-body: 1.25rem;      /* 20px - 主要内容 */
  --text-body-sm: 1.1rem;    /* 18px - 辅助文字 */
  --text-caption: 1rem;      /* 16px - 提示信息 */

  /* 特殊用途 */
  --text-display: 4rem;      /* 64px - 展示用大字（汉字、拼音） */
  --text-icon: 3rem;         /* 48px - 图标按钮 */
}
```

#### 字号使用规则
| 元素 | 字号 | 字重 | 用途 |
|------|------|------|------|
| 页面标题 | 2.5rem | 700 | 每个页面的顶部标题 |
| 模块标题 | 2rem | 600 | 功能区块标题 |
| 卡片标题 | 1.6rem | 600 | 卡片内标题 |
| 正文内容 | 1.25rem | 400 | 故事、题目文字 |
| 辅助说明 | 1.1rem | 400 | 提示、说明文字 |
| 展示汉字 | 4rem | 500 | 大字展示单个汉字 |
| 展示拼音 | 3rem | 500 | 拼音展示 |
| 按钮文字 | 1.25rem | 600 | 所有按钮 |

#### 行高规范
```css
:root {
  --leading-tight: 1.3;      /* 标题、短文字 */
  --leading-normal: 1.6;     /* 正文内容 */
  --leading-relaxed: 1.8;    /* 故事、长文本 */
}
```

---

### 1.3 间距规范（呼吸感）

#### 间距系统
```css
:root {
  /* 基础间距单位：8px */
  --space-1: 0.5rem;    /* 8px */
  --space-2: 1rem;      /* 16px */
  --space-3: 1.5rem;    /* 24px */
  --space-4: 2rem;      /* 32px */
  --space-5: 2.5rem;    /* 40px */
  --space-6: 3rem;      /* 48px */
}
```

#### 间距使用规则
| 场景 | 数值 | 用途 |
|------|------|------|
| 页面内边距 | 24px | 主内容区四周 |
| 卡片内边距 | 24px | 卡片内部 |
| 模块间距 | 32px | 大模块之间 |
| 元素间距 | 16px | 相关元素之间 |
| 按钮间距 | 16px | 按钮之间 |
| 卡片间距 | 20px | 卡片网格间距 |
| 列表项间距 | 12px | 列表项之间 |

---

### 1.4 按钮与热区规范（易点击）

#### 按钮尺寸
```css
:root {
  /* 按钮尺寸 */
  --btn-height-lg: 64px;     /* 大按钮 - 主要操作 */
  --btn-height-md: 56px;     /* 中按钮 - 次要操作 */
  --btn-height-sm: 48px;     /* 小按钮 - 辅助操作 */

  /* 热区最小尺寸（触控） */
  --touch-min: 60px;         /* 最小触控区域 */
  --touch-comfort: 80px;     /* 舒适触控区域 */
}
```

#### 按钮样式规范

**主按钮（Primary）**
```css
.btn-primary {
  min-height: 64px;
  padding: 0 40px;
  background: var(--theme-primary);
  color: var(--text-white);
  font-size: 1.25rem;
  font-weight: 600;
  border-radius: 16px;
  border: none;
  /* 点击反馈 */
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.btn-primary:active {
  transform: scale(0.96);
}
```

**次按钮（Secondary）**
```css
.btn-secondary {
  min-height: 56px;
  padding: 0 32px;
  background: var(--theme-secondary);
  color: var(--text-primary);
  font-size: 1.1rem;
  font-weight: 600;
  border-radius: 12px;
  border: none;
}
```

**图标按钮（Icon Button）**
```css
.btn-icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  font-size: 2.5rem;
  /* 宫格导航使用 */
}
```

**游戏卡片按钮**
```css
.game-card {
  min-width: 120px;
  min-height: 80px;
  border-radius: 16px;
  font-size: 1.5rem;
}
```

#### 热区规则
- 所有可点击元素最小尺寸：**60x60px**
- 导航按钮推荐尺寸：**80x80px**
- 卡片按钮推荐尺寸：**120x80px**
- 按钮之间最小间距：**16px**

---

### 1.5 反馈规范（强反馈）

#### 反馈层级
| 类型 | 触发时机 | 反馈方式 |
|------|---------|---------|
| 即时触觉 | 点击按钮 | 按钮缩放 0.96x + 背景变暗 |
| 成功反馈 | 答对/完成 | 绿色闪烁 + 星星动画 + 音效 |
| 错误反馈 | 答错 | 温和震动 + 橙黄提示 + "再试试" |
| 进度反馈 | 进度更新 | 进度条填充 + 数字变化 |
| 成就反馈 | 获得奖励 | 徽章弹窗 + 庆祝动画 |

#### 成功反馈样式
```css
.feedback-success {
  background: var(--state-success);
  color: white;
  padding: 16px 32px;
  border-radius: 16px;
  font-size: 1.4rem;
  font-weight: 600;
  animation: feedbackPop 0.4s ease;
}

@keyframes feedbackPop {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); opacity: 1; }
}
```

#### 错误反馈样式（温和）
```css
.feedback-error {
  background: var(--state-warning);
  color: var(--text-primary);
  padding: 16px 32px;
  border-radius: 16px;
  font-size: 1.25rem;
  /* 不使用红色，避免挫败感 */
}
```

#### 过渡动画时长
```css
:root {
  --duration-fast: 150ms;    /* 点击反馈 */
  --duration-normal: 300ms;  /* 切换动画 */
  --duration-slow: 500ms;    /* 成功动画 */
}
```

---

## 二、核心页面布局蓝图

### 2.1 首页（导航中心）

#### 布局结构
```
┌─────────────────────────────┐
│      🌟 今天学什么 🌟        │  ← 页面标题（居中，2.5rem）
├─────────────────────────────┤
│                             │
│   ┌─────┐   ┌─────┐        │
│   │ 📝  │   │ 🔤  │        │  ← 2x2 宫格导航
│   │汉字 │   │拼音 │        │     图标 48px + 文字
│   └─────┘   └─────┘        │     卡片 120x120px
│                             │     间距 24px
│   ┌─────┐   ┌─────┐        │
│   │ 🎮  │   │ 🏆  │        │
│   │游戏 │   │成就 │        │
│   └─────┘   └─────┘        │
│                             │
├─────────────────────────────┤
│  📍 继续上次的：汉字学习 →   │  ← 快捷入口（可选）
├─────────────────────────────┤
│  👤 小明  |  ⭐ 15颗星星     │  ← 底部个人信息
└─────────────────────────────┘
```

#### 改造要点
1. **移除**原有 10 个横向导航按钮
2. **改为** 4 宫格大入口（汉字、拼音、游戏、成就）
3. **每个入口**：图标 + 文字，点击热区 120x120px
4. **增加**"继续学习"快捷入口（上次未完成的）
5. **底部**显示当前用户和累计星星数

#### 代码结构
```vue
<template>
  <div class="home-page">
    <h1 class="page-title">🌟 今天学什么 🌟</h1>

    <nav class="main-nav">
      <button class="nav-card" @click="goTo('characters')">
        <span class="nav-icon">📝</span>
        <span class="nav-text">学汉字</span>
      </button>
      <!-- 其他 3 个... -->
    </nav>

    <div class="continue-section" v-if="lastProgress">
      <button class="continue-btn">
        📍 继续上次的：{{ lastProgress.name }}
      </button>
    </div>

    <footer class="user-bar">
      <span>👤 {{ user.name }}</span>
      <span>⭐ {{ user.stars }}颗星星</span>
    </footer>
  </div>
</template>
```

---

### 2.2 汉字学习页（分步骤流程）

#### 布局结构（三步流程）

**步骤 1：故事引入**
```
┌─────────────────────────────┐
│ ← 返回        汉字学习 (1/3) │
├─────────────────────────────┤
│                             │
│        📖 江南              │  ← 故事标题
│                             │
│    ╔═══════════════════╗   │
│    ║                   ║   │  ← 故事卡片
│    ║  江南可采莲       ║   │     配图 + 诗句
│    ║  莲叶何田田       ║   │
│    ║                   ║   │
│    ╚═══════════════════╝   │
│                             │
│      🔊 点我听朗读          │  ← 朗读按钮
│                             │
│      ┌─────────────┐       │
│      │  我记住了   │       │  ← 下一步按钮
│      └─────────────┘       │     64px 高
│                             │
└─────────────────────────────┘
```

**步骤 2：认字卡片**
```
┌─────────────────────────────┐
│ ←        认字学习 (2/3)     │
├─────────────────────────────┤
│  进度：████░░░░░░ 3/9       │  ← 进度条
├─────────────────────────────┤
│                             │
│   ┌────┐ ┌────┐ ┌────┐     │
│   │ 江 │ │ 南 │ │ 可 │     │  ← 3x3 卡片网格
│   │jiāng│ │nán │ │ kě │     │     100x120px
│   └────┘ └────┘ └────┘     │     点击翻转
│   ┌────┐ ┌────┐ ┌────┐     │     显示拼音
│   │ 采 │ │ 莲 │ │ 戏 │     │
│   └────┘ └────┘ └────┘     │
│   ┌────┐ ┌────┐ ┌────┐     │
│   │ 间 │ │ 东 │ │ 北 │     │
│   └────┘ └────┘ └────┘     │
│                             │
│      ┌─────────────┐       │
│      │  去练习书写  │       │
│      └─────────────┘       │
│                             │
└─────────────────────────────┘
```

**步骤 3：书写练习**
```
┌─────────────────────────────┐
│ ←        书写练习 (3/3)     │
├─────────────────────────────┤
│                             │
│         跟着写              │
│                             │
│    ╔═══════════════════╗   │
│    ║    ┌───┐         ║   │  ← 大号田字格
│    ║    │ 江 │         ║   │     200x200px
│    ║    └───┘         ║   │     虚线汉字
│    ║   /  │  \        ║   │     网格线
│    ║  ────┼────       ║   │
│    ║   \  │  /        ║   │
│    ╚═══════════════════╝   │
│                             │
│      🔊 jiāng 江            │  ← 读音
│                             │
│   [看演示]  [下一个]         │  ← 操作按钮
│                             │
│      ┌─────────────┐       │
│      │  开始测验   │       │  ← 完成按钮
│      └─────────────┘       │
│                             │
└─────────────────────────────┘
```

#### 改造要点
1. **分步骤**：故事 → 认字 → 书写，每步清晰标注 (1/3)
2. **进度可视化**：顶部进度条显示学习进度
3. **卡片网格**：3x3 布局，单个卡片 100x120px
4. **田字格放大**：从 120px 增至 200px
5. **语音辅助**：每个汉字配有读音按钮

---

### 2.3 拼音练习页（游戏化改造）

#### 布局结构

**学习模式**
```
┌─────────────────────────────┐
│ ← 返回    拼音学习    [游戏] │  ← Tab 切换
├─────────────────────────────┤
│                             │
│     ┌─────────────────┐    │
│     │                 │    │
│     │       ye        │    │  ← 大字展示
│     │      叶子       │    │     拼音 + 例词
│     │                 │    │
│     └─────────────────┘    │
│                             │
│    🔊 读音  👄 口型演示      │  ← 辅助按钮
│                             │
│    ┌────┐ ┌────┐ ┌────┐   │
│    │ yē │ │ yé │ │ yě │   │  ← 四声卡片
│    └────┘ └────┘ └────┘   │     80x60px
│    ┌────┐                 │
│    │ yè │                 │
│    └────┘                 │
│                             │
│       ←  ●○○○○  →          │  ← 分页指示器
│                             │
└─────────────────────────────┘
```

**游戏模式（配对游戏）**
```
┌─────────────────────────────┐
│ ← 返回    拼音配对    [学习] │
├─────────────────────────────┤
│                             │
│    找到拼音对应的汉字！      │  ← 游戏提示
│                             │
│    ┌────────┐    ┌────────┐│
│    │  kě    │    │   叶   ││  ← 配对区域
│    └────────┘    └────────┘│     左右两列
│    ┌────────┐    ┌────────┐│     卡片 120x80px
│    │  yè    │    │   可   ││     间距 20px
│    └────────┘    └────────┘│
│    ┌────────┐    ┌────────┐│
│    │  dōng  │    │   东   ││
│    └────────┘    └────────┘│
│                             │
│    配对：⚪⚪⚪⚪⚪⚪        │  ← 进度指示
│                             │
└─────────────────────────────┘
```

#### 改造要点
1. **Tab 切换**：学习模式 / 游戏模式
2. **学习模式**：大图展示 + 四声卡片
3. **游戏模式**：配对卡片增大至 120x80px
4. **配对进度**：使用圆点表示剩余配对数
5. **成功反馈**：配对成功显示 ✓ 和绿色闪烁

---

### 2.4 互动测验页（节奏控制）

#### 布局结构
```
┌─────────────────────────────┐
│ ← 返回    小测验    第1/5题 │
├─────────────────────────────┤
│                             │
│         这个字的拼音是？      │  ← 题目
│                             │
│           ┌─────┐          │
│           │  江  │          │  ← 大字展示
│           └─────┘          │     64px 汉字
│                             │
│    ┌─────────────────────┐ │
│    │    A. jiāng         │ │  ← 选项按钮
│    └─────────────────────┘ │     垂直排列
│    ┌─────────────────────┐ │     56px 高
│    │    B. nán           │ │     间距 16px
│    └─────────────────────┘ │
│    ┌─────────────────────┐ │
│    │    C. kě            │ │
│    └─────────────────────┘ │
│                             │
│  ╔═══════════════════════╗ │
│  ║   🎉 答对了！+10分    ║ │  ← 反馈区域
│  ║   ┌─────────────┐     ║ │     答对后显示
│  ║   │   下一题    │     ║ │     绿色背景
│  ║   └─────────────┘     ║ │
│  ╚═══════════════════════╝ │
│                             │
└─────────────────────────────┘
```

#### 改造要点
1. **题数控制**：单次测验最多 5 题
2. **明确进度**：顶部显示"第 X/Y 题"
3. **选项按钮**：垂直排列，高度 56px+
4. **即时反馈**：答对/答错后立即显示反馈区
5. **强制缓冲**：必须点击"下一题"才能继续

---

### 2.5 学习成就页（可视化改造）

#### 布局结构
```
┌─────────────────────────────┐
│ ← 返回      我的成就         │
├─────────────────────────────┤
│                             │
│     ┌─────────────────┐    │
│     │   👤            │    │
│     │   小明          │    │  ← 用户信息卡
│     │   ⭐⭐⭐  3级   │    │     头像 + 等级
│     │                 │    │
│     │ 积分：156      │    │
│     │ 连续：🔥 5天   │    │
│     └─────────────────┘    │
│                             │
│  升级进度：                 │
│  ┌─────────────────────┐   │
│  │████████░░░░░░░░░░░░│   │  ← 视觉进度条
│  └─────────────────────┘   │     56% → 3级
│  再得44分升级！             │
│                             │
│  我的徽章 🏅 (3/12)         │
│  ┌────┐ ┌────┐ ┌────┐     │
│  │ 🌟 │ │ 📚 │ │ 🔥 │     │  ← 徽章墙
│  └────┘ └────┘ └────┘     │     大图展示
│                             │     80x80px
│  待解锁 🎯                 │
│  ┌────┐ ┌────┐            │
│  │ 🔒 │ │ 🔒 │            │  ← 灰度显示
│  └────┘ └────┘            │
│                             │
└─────────────────────────────┘
```

#### 改造要点
1. **信息简化**：只展示头像、等级、积分、连续天数
2. **进度可视化**：进度条 + 文字说明"再得 XX 分升级"
3. **徽章墙**：大图展示已获得徽章，80x80px
4. **待解锁**：灰度显示 + 解锁条件提示
5. **移除**：复杂的排行榜（可选显示）

---

## 三、高优先级问题替代方案

### 3.1 问题：高饱和度紫色背景

**原方案**：
```css
body {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
```

**替代方案**：
```css
/* 方案 A：暖米色（推荐） */
body {
  background: #F8F6F0;
}

/* 方案 B：淡薄荷 */
body {
  background: #F0F7F4;
}

/* 方案 C：极淡渐变（如需保留渐变感） */
body {
  background: linear-gradient(180deg, #F8F6F0 0%, #F0EDE5 100%);
}
```

---

### 3.2 问题：导航按钮过密

**原方案**：
```vue
<nav class="nav">
  <button v-for="tab in 10tabs" class="nav-btn">
    {{ tab.name }}
  </button>
</nav>
```

**替代方案**：
```vue
<!-- 简化导航：4 宫格大入口 -->
<nav class="main-nav">
  <button class="nav-card" @click="goTo('characters')">
    <span class="nav-icon">📝</span>
    <span class="nav-text">学汉字</span>
  </button>
  <button class="nav-card" @click="goTo('pinyin')">
    <span class="nav-icon">🔤</span>
    <span class="nav-text">学拼音</span>
  </button>
  <button class="nav-card" @click="goTo('games')">
    <span class="nav-icon">🎮</span>
    <span class="nav-text">玩游戏</span>
  </button>
  <button class="nav-card" @click="goTo('achievements')">
    <span class="nav-icon">🏆</span>
    <span class="nav-text">看成就</span>
  </button>
</nav>

<style>
.main-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 24px;
}
.nav-card {
  aspect-ratio: 1;
  min-height: 140px;
  background: white;
  border-radius: 24px;
  border: 2px solid var(--border-light);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
.nav-icon {
  font-size: 3rem;
}
.nav-text {
  font-size: 1.25rem;
  font-weight: 600;
}
</style>
```

---

### 3.3 问题：渐变色泛滥

**原方案**：
```css
.card {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}
```

**替代方案**：
```css
/* 纯色替代 */
.card {
  background: #FFFFFF;
  border: 2px solid var(--border-light);
  border-radius: 16px;
}

/* 如需区分类型，使用淡色背景 */
.card-learning {
  background: #F0F9F5;  /* 淡绿 - 学习 */
  border-color: #7CB69D;
}

.card-game {
  background: #FFF8E7;  /* 淡黄 - 游戏 */
  border-color: #F5C26B;
}

.card-story {
  background: #FDF2ED;  /* 淡橙 - 故事 */
  border-color: #E8A87C;
}
```

---

### 3.4 问题：点击热区过小

**原方案**：
```css
.quiz-option {
  padding: 15px 30px;
  font-size: 1.5rem;
}
```

**替代方案**：
```css
.quiz-option {
  min-height: 64px;        /* 明确最小高度 */
  padding: 16px 24px;      /* 增加内边距 */
  font-size: 1.4rem;       /* 适当字号 */
  margin-bottom: 16px;     /* 增加间距 */
  border-radius: 16px;     /* 圆角 */
  /* 触摸友好的尺寸 */
}

/* 游戏卡片特别处理 */
.game-card {
  min-width: 120px;
  min-height: 80px;
  padding: 16px;
  margin: 10px;
}
```

---

### 3.5 问题：字号偏小

**原方案**：
```css
body {
  font-size: 16px;
}
.poem {
  font-size: 1.3rem;  /* ~21px */
}
```

**替代方案**：
```css
/* 基础字号提升 */
html {
  font-size: 18px;    /* 从 16px 提升 */
}

/* 内容文字 */
.content-text {
  font-size: 1.25rem;  /* 22.5px */
  line-height: 1.8;
}

/* 故事文字 */
.story-text {
  font-size: 1.4rem;   /* 25px */
  line-height: 2;
}

/* 展示大字 */
.display-char {
  font-size: 4rem;     /* 72px */
}
```

---

## 四、页面级改造实施原则

### 4.1 改造优先级

```
P0（立即实施）
├── 全局背景色更换
├── 导航改为4宫格
├── 按钮尺寸统一增大
└── 正文字号提升

P1（短期实施）
├── 汉字学习分步骤
├── 测验增加明显反馈
├── 记忆游戏改为3列
└── 移除冗余版本号显示

P2（中期实施）
├── 增加护眼模式
├── 增加语音朗读
├── 书写田字格放大
└── 成就页面简化
```

### 4.2 文件改造清单

| 文件 | 改造内容 | 优先级 |
|------|---------|--------|
| `index.html` | 更换 body 背景色 | P0 |
| `App.vue` | 导航改为4宫格，移除版本号 | P0 |
| `CharacterLearning.vue` | 分步骤设计，田字格放大 | P1 |
| `PinyinPractice.vue` | Tab切换，卡片增大 | P1 |
| `InteractiveQuiz.vue` | 选项按钮增大，反馈增强 | P1 |
| `LearningCards.vue` | 改为3列布局 | P1 |
| `MathPractice.vue` | 题目配图，关键词放大 | P2 |
| `StoryModule.vue` | 增加朗读按钮 | P2 |
| `GamificationView.vue` | 信息简化，徽章墙放大 | P2 |

### 4.3 实施检查清单

#### 色彩检查
- [ ] 背景色已更换为护眼暖色
- [ ] 移除所有高饱和度紫色渐变
- [ ] 文字颜色使用深灰而非纯黑
- [ ] 状态色使用柔和版本

#### 尺寸检查
- [ ] 所有按钮最小高度 56px
- [ ] 导航按钮 120x120px 以上
- [ ] 正文字号 1.25rem (22.5px) 以上
- [ ] 标题字号 2rem (36px) 以上

#### 布局检查
- [ ] 导航入口不超过 5 个
- [ ] 每页核心功能不超过 3 个
- [ ] 按钮间距 16px 以上
- [ ] 卡片间距 20px 以上

#### 反馈检查
- [ ] 点击有视觉反馈（缩放/变色）
- [ ] 成功有庆祝动画
- [ ] 错误使用温和提示
- [ ] 进度可视化展示

### 4.4 响应式断点

```css
/* 平板（推荐主要使用场景） */
@media (min-width: 768px) {
  :root {
    --grid-cols: 3;
    --card-size: 140px;
  }
}

/* 大平板 */
@media (min-width: 1024px) {
  :root {
    --grid-cols: 4;
    --card-size: 160px;
    --max-content-width: 800px;
  }
}

/* 手机 */
@media (max-width: 767px) {
  :root {
    --grid-cols: 2;
    --card-size: 120px;
  }
}
```

---

## 五、实施示例代码

### 5.1 按钮组件规范

```vue
<!-- BaseButton.vue -->
<template>
  <button
    :class="['btn', `btn-${type}`, { 'btn-block': block }]"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'primary' }, // primary / secondary / game
  block: { type: Boolean, default: false }
})
defineEmits(['click'])
</script>

<style scoped>
.btn {
  border: none;
  border-radius: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease;
  font-family: inherit;
}
.btn:active {
  transform: scale(0.96);
}
.btn-primary {
  min-height: 64px;
  padding: 0 40px;
  background: #7CB69D;
  color: white;
  font-size: 1.25rem;
}
.btn-secondary {
  min-height: 56px;
  padding: 0 32px;
  background: #F5C26B;
  color: #3D3D3D;
  font-size: 1.1rem;
}
.btn-game {
  min-width: 120px;
  min-height: 80px;
  background: white;
  border: 2px solid #E8E4DC;
  font-size: 1.5rem;
}
.btn-block {
  width: 100%;
}
</style>
```

### 5.2 反馈组件规范

```vue
<!-- FeedbackToast.vue -->
<template>
  <Transition name="feedback">
    <div v-if="show" :class="['feedback', type]">
      <span class="feedback-icon">{{ icon }}</span>
      <span class="feedback-text">{{ message }}</span>
    </div>
  </Transition>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  show: Boolean,
  type: { type: String, default: 'success' }, // success / error
  message: String
})

const icon = computed(() => props.type === 'success' ? '🎉' : '💪')
</script>

<style scoped>
.feedback {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  padding: 24px 48px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 1.4rem;
  font-weight: 600;
  z-index: 1000;
}
.feedback.success {
  background: #8BC48A;
  color: white;
}
.feedback.error {
  background: #F5D67B;
  color: #3D3D3D;
}
.feedback-icon {
  font-size: 2rem;
}

.feedback-enter-active,
.feedback-leave-active {
  transition: all 0.3s ease;
}
.feedback-enter-from,
.feedback-leave-to {
  opacity: 0;
  transform: translate(-50%, -50%) scale(0.8);
}
</style>
```

---

## 六、总结

本设计规范围绕 **护眼、低认知负担、强反馈、易点击** 四个核心目标，为6岁儿童学习应用提供了可直接实施的设计标准。

### 核心变更点
1. **色彩**：高饱和度紫色 → 暖米色护眼色系
2. **导航**：10个密集按钮 → 4宫格大入口
3. **字号**：16px基准 → 18px基准，正文22px+
4. **热区**：40px按钮 → 64px+ 大按钮
5. **流程**：单页堆叠 → 分步骤引导

### 实施建议
1. 按 P0/P1/P2 优先级逐步实施
2. 优先改造高频页面（首页、汉字学习）
3. 改造后进行儿童可用性测试
4. 收集反馈持续优化

---

*设计规范 v1.0 - 可直接指导前端开发*
