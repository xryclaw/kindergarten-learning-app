# 设计规范到前端改版的交付映射

> 用途：前端开发直接执行参考 / QA 测试验收依据
> 版本：v1.0
> 目标：P0 改版快速落地

---

## 一、核心页面改版要点清单

### 1.1 首页（App.vue）

#### 改造前现状
```
❌ 10个横向排列导航按钮
❌ 高饱和度紫色渐变背景
❌ 版本号在页脚显示
```

#### 改造后目标
```
✅ 4宫格大入口导航
✅ 暖米色护眼背景
✅ 移除版本号，显示用户星星数
```

#### 改版检查清单

| 检查项 | 规格 | 验收标准 | 优先级 |
|--------|------|----------|--------|
| 页面背景色 | `#F8F6F0` | 整个页面背景为暖米色 | P0 |
| 导航布局 | 2x2 宫格 | 4个入口等分屏幕 | P0 |
| 导航卡片尺寸 | `min-height: 140px` | 平板显示为正方形 | P0 |
| 导航图标 | `font-size: 3rem` | 48px 大图标 | P0 |
| 导航文字 | `font-size: 1.25rem` | 20px 粗体 | P0 |
| 卡片间距 | `gap: 24px` | 卡片之间 24px 间隙 | P0 |
| 卡片圆角 | `border-radius: 24px` | 圆角卡片 | P0 |
| 卡片边框 | `2px solid #E8E4DC` | 浅色边框 | P0 |
| 页脚信息 | 显示用户名+星星数 | 如：👤 小明 ⭐ 15颗 | P0 |
| 快捷入口 | 继续上次的 | 显示上次学习进度 | P1 |

#### 代码改造点
```vue
<!-- App.vue 改造示意 -->
<template>
  <div class="home-page">
    <h1 class="page-title">🌟 今天学什么 🌟</h1>

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

    <footer class="user-bar">
      <span>👤 {{ user.name }}</span>
      <span>⭐ {{ user.stars }}颗星星</span>
    </footer>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: #F8F6F0;  /* 改造点1：护眼背景 */
  padding: 24px;
}

.page-title {
  font-size: 2.5rem;
  text-align: center;
  color: #3D3D3D;
  margin-bottom: 32px;
}

.main-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;  /* 改造点2：2x2宫格 */
  gap: 24px;
  max-width: 600px;
  margin: 0 auto;
}

.nav-card {
  aspect-ratio: 1;
  min-height: 140px;
  background: white;
  border-radius: 24px;
  border: 2px solid #E8E4DC;  /* 改造点3：浅色边框替代渐变 */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.15s ease;
}

.nav-card:active {
  transform: scale(0.96);  /* 改造点4：点击反馈 */
}

.nav-icon {
  font-size: 3rem;  /* 改造点5：大图标 */
}

.nav-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: #3D3D3D;
}

.user-bar {
  margin-top: 32px;
  padding: 16px;
  background: white;
  border-radius: 16px;
  display: flex;
  justify-content: space-around;
  font-size: 1.1rem;
}
</style>
```

---

### 1.2 汉字学习页（CharacterLearning.vue）

#### 改造前现状
```
❌ 5个模块堆叠在同一页（进度条、测验、故事、卡片、书写）
❌ 田字格 120x120px 过小
❌ 无分步引导
```

#### 改造后目标
```
✅ 分步骤设计：故事 → 认字 → 书写
✅ 田字格增大至 200x200px
✅ 每步清晰标注进度
```

#### 改版检查清单

| 检查项 | 规格 | 验收标准 | 优先级 |
|--------|------|----------|--------|
| 步骤指示器 | 显示 (1/3) | 顶部显示当前步骤 | P1 |
| 故事卡片 | 配图+诗句 | 大卡片展示 | P1 |
| 朗读按钮 | 🔊 图标 | 点击播放诗句朗读 | P2 |
| 认字卡片网格 | 3x3 布局 | 9个生字卡片 | P1 |
| 认字卡片尺寸 | 100x120px | 足够大的点击热区 | P1 |
| 卡片翻转动画 | 0.6s | 3D翻转展示拼音 | P1 |
| 田字格尺寸 | 200x200px | 增大便于观看 | P1 |
| 田字格网格线 | 淡蓝色 | 清晰可见但不刺眼 | P1 |
| 书写演示按钮 | 看演示 | 播放笔顺动画 | P2 |
| 下一步按钮 | min-height: 64px | 绿色主按钮 | P1 |

#### 步骤流程图
```
┌─────────────────────────────────────┐
│  步骤1：故事引入                      │
│  ─────────────────                  │
│  • 展示古诗配图                      │
│  • 朗读按钮                          │
│  • "我记住了"按钮 → 进入步骤2         │
└─────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────┐
│  步骤2：认字卡片                      │
│  ─────────────────                  │
│  • 3x3 生字卡片网格                   │
│  • 点击翻转显示拼音                   │
│  • "去练习书写"按钮 → 进入步骤3        │
└─────────────────────────────────────┘
                   ↓
┌─────────────────────────────────────┐
│  步骤3：书写练习                      │
│  ─────────────────                  │
│  • 大号田字格 200px                   │
│  • 笔顺演示按钮                      │
│  • "开始测验"按钮 → 进入测验          │
└─────────────────────────────────────┘
```

---

### 1.3 拼音练习页（PinyinPractice.vue）

#### 改造前现状
```
❌ 学习+游戏功能堆叠
❌ 配对卡片 100x60px 过小
❌ 无明确模式切换
```

#### 改造后目标
```
✅ Tab切换：学习模式 / 游戏模式
✅ 配对卡片增大至 120x80px
✅ 配对进度可视化
```

#### 改版检查清单

| 检查项 | 规格 | 验收标准 | 优先级 |
|--------|------|----------|--------|
| 模式切换Tab | 学习/游戏 | 顶部Tab切换 | P1 |
| 学习模式-拼音展示 | `font-size: 3rem` | 大字显示 | P1 |
| 学习模式-四声卡片 | 横向排列 | 4个声调 | P1 |
| 朗读按钮 | 🔊 图标 | 播放拼音读音 | P2 |
| 游戏模式-配对卡片 | 120x80px | 左右两列 | P1 |
| 配对进度指示 | ⚪⚪⚪⚪ | 圆点表示剩余 | P1 |
| 配对成功反馈 | 绿色闪烁+✓ | 视觉反馈 | P1 |
| 全部完成庆祝 | 🎉 动画 | 成功后庆祝 | P2 |

---

### 1.4 互动测验页（InteractiveQuiz.vue）

#### 改造前现状
```
❌ 8题连续测验
❌ 选项按钮间距小
❌ 反馈不够明显
```

#### 改造后目标
```
✅ 单次测验最多5题
✅ 选项按钮垂直排列，间距16px+
✅ 明显的成功/错误反馈
```

#### 改版检查清单

| 检查项 | 规格 | 验收标准 | 优先级 |
|--------|------|----------|--------|
| 题目数量 | 最多5题 | 控制单次时长 | P1 |
| 题目进度 | 第X/Y题 | 顶部明确显示 | P1 |
| 题目文字 | `font-size: 1.4rem` | 25px 大字 | P1 |
| 展示汉字 | `font-size: 4rem` | 64px 超大字 | P1 |
| 选项按钮高度 | min-height: 56px | 足够大 | P1 |
| 选项按钮间距 | margin-bottom: 16px | 防止误触 | P1 |
| 选中反馈 | 边框变色+背景 | #7CB69D 绿色 | P1 |
| 正确反馈 | 🎉 绿色弹窗 | 明显庆祝 | P1 |
| 错误反馈 | 💪 黄色提示 | 温和鼓励 | P1 |
| 下一题按钮 | 必须手动点击 | 给儿童缓冲时间 | P1 |

#### 反馈组件规格
```vue
<!-- 正确反馈 -->
<div class="feedback success">
  <span class="icon">🎉</span>
  <span class="text">答对了！太棒了！</span>
  <button class="next-btn">下一题</button>
</div>

<style>
.feedback.success {
  background: #8BC48A;
  color: white;
  padding: 24px;
  border-radius: 20px;
  text-align: center;
  animation: feedbackPop 0.4s ease;
}

/* 错误反馈使用温和黄色 */
.feedback.error {
  background: #F5D67B;
  color: #3D3D3D;
  /* 不使用红色，避免挫败感 */
}
</style>
```

---

### 1.5 学习卡片页（LearningCards.vue）

#### 改造前现状
```
❌ 4列记忆卡片布局
❌ 卡片过小
```

#### 改造后目标
```
✅ 3列布局
✅ 卡片增大
```

#### 改版检查清单

| 检查项 | 规格 | 验收标准 | 优先级 |
|--------|------|----------|--------|
| 记忆游戏列数 | 3列 | grid-template-columns: repeat(3, 1fr) | P1 |
| 卡片最小尺寸 | 100x100px | 足够大的点击热区 | P1 |
| 卡片间距 | gap: 16px | 防止误触相邻卡片 | P1 |
| 翻转动画时长 | 0.6s | 足够观察 | P1 |
| 配对成功样式 | 绿色边框+✓ | 清晰可见 | P1 |

---

### 1.6 成就页（GamificationView.vue）

#### 改造前现状
```
❌ 数据密集型（积分、等级、连续、徽章、排行榜）
❌ 信息过载
```

#### 改造后目标
```
✅ 信息简化
✅ 徽章大图展示
✅ 排行榜可选显示
```

#### 改版检查清单

| 检查项 | 规格 | 验收标准 | 优先级 |
|--------|------|----------|--------|
| 用户信息卡片 | 头像+名字+等级 | 顶部整合展示 | P1 |
| 等级显示 | Lv.3 ⭐⭐⭐ | 视觉化展示 | P1 |
| 积分进度条 | 视觉化进度 | 56% + 文字说明 | P1 |
| 升级提示 | "再得44分升级！" | 口语化提示 | P1 |
| 徽章墙 | 80x80px 大图 | 已获得徽章展示 | P1 |
| 待解锁徽章 | 灰度显示 | 灰色+解锁条件 | P2 |
| 排行榜 | 默认折叠 | 点击展开 | P2 |

---

## 二、关键组件设计规则与使用边界

### 2.1 按钮组件（BaseButton）

#### 规格定义
```typescript
interface ButtonProps {
  type: 'primary' | 'secondary' | 'game' | 'icon'
  size: 'lg' | 'md' | 'sm'
  block?: boolean  // 是否块级（宽度100%）
  disabled?: boolean
}
```

#### 样式规格表

| 类型 | 高度 | 内边距 | 背景色 | 文字色 | 使用场景 |
|------|------|--------|--------|--------|----------|
| primary | 64px | 0 40px | #7CB69D | 白色 | 主操作（下一步、提交） |
| secondary | 56px | 0 32px | #F5C26B | #3D3D3D | 次操作（返回、跳过） |
| game | 80px | 16px | 白色 | #3D3D3D | 游戏卡片（配对、记忆） |
| icon | 80x80px | - | 白色 | - | 宫格导航 |

#### 使用边界
```
✅ 必须：
  • 所有按钮 min-height >= 56px
  • 点击有视觉反馈（scale 0.96）
  • 圆角 >= 12px

❌ 禁止：
  • 使用小于 48px 的按钮
  • 纯文字链接（6岁儿童难以理解）
  • 多个主按钮并列（决策困难）
```

#### 实现代码
```vue
<!-- components/BaseButton.vue -->
<template>
  <button
    :class="[
      'btn',
      `btn--${type}`,
      `btn--${size}`,
      { 'btn--block': block }
    ]"
    :disabled="disabled"
    @click="$emit('click')"
  >
    <slot />
  </button>
</template>

<script setup>
defineProps({
  type: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  block: Boolean,
  disabled: Boolean
})
defineEmits(['click'])
</script>

<style scoped>
.btn {
  border: none;
  border-radius: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn:active:not(:disabled) {
  transform: scale(0.96);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 类型样式 */
.btn--primary {
  background: #7CB69D;
  color: white;
}

.btn--secondary {
  background: #F5C26B;
  color: #3D3D3D;
}

.btn--game {
  background: white;
  border: 2px solid #E8E4DC;
  color: #3D3D3D;
}

.btn--icon {
  background: white;
  border: 2px solid #E8E4DC;
}

/* 尺寸样式 */
.btn--lg {
  min-height: 64px;
  padding: 0 40px;
  font-size: 1.25rem;
}

.btn--md {
  min-height: 56px;
  padding: 0 32px;
  font-size: 1.1rem;
}

.btn--sm {
  min-height: 48px;
  padding: 0 24px;
  font-size: 1rem;
}

.btn--block {
  width: 100%;
}
</style>
```

---

### 2.2 卡片组件（BaseCard）

#### 规格定义
```typescript
interface CardProps {
  type: 'default' | 'learning' | 'game' | 'story'
  padding?: 'lg' | 'md' | 'sm'
  clickable?: boolean
}
```

#### 样式规格表

| 类型 | 背景色 | 边框色 | 用途 |
|------|--------|--------|------|
| default | #FFFFFF | #E8E4DC | 通用卡片 |
| learning | #F0F9F5 | #7CB69D | 学习内容 |
| game | #FFF8E7 | #F5C26B | 游戏区域 |
| story | #FDF2ED | #E8A87C | 故事内容 |

#### 使用边界
```
✅ 必须：
  • 内边距 >= 20px
  • 圆角 >= 16px
  • 有明确的内容边界

❌ 禁止：
  • 使用渐变背景
  • 过重的阴影（> 10px blur）
  • 纯装饰性卡片（干扰注意力）
```

---

### 2.3 导航组件（MainNav）

#### 规格定义
```typescript
interface NavItem {
  id: string
  icon: string      // emoji 或图标名
  text: string      // 简短文字，<= 4字
  route: string
}

// 限制：最多 5 个入口
const MAX_NAV_ITEMS = 5
```

#### 布局规则
```
┌─────────────────────────┐
│  ┌────┐  ┌────┐        │  ← 2列布局（移动端）
│  │    │  │    │        │
│  └────┘  └────┘        │
│  ┌────┐  ┌────┐        │
│  │    │  │    │        │
│  └────┘  └────┘        │
└─────────────────────────┘

┌─────────────────────────┐
│  ┌────┐┌────┐┌────┐   │  ← 3列布局（平板）
│  │    ││    ││    │   │
│  └────┘└────┘└────┘   │
│  ┌────┐┌────┐          │
│  │    ││    │          │
│  └────┘└────┘          │
└─────────────────────────┘
```

#### 使用边界
```
✅ 必须：
  • 图标 >= 48px
  • 文字 >= 20px
  • 点击热区 >= 120x120px

❌ 禁止：
  • 超过 5 个入口
  • 使用纯文字导航
  • 使用小图标（< 32px）
```

---

### 2.4 反馈组件（FeedbackToast）

#### 规格定义
```typescript
interface FeedbackProps {
  type: 'success' | 'error' | 'info'
  message: string
  duration?: number  // 自动关闭时间，默认 2000ms
  showNextButton?: boolean  // 是否显示下一步按钮
}
```

#### 样式规格表

| 类型 | 背景色 | 文字色 | 图标 | 使用场景 |
|------|--------|--------|------|----------|
| success | #8BC48A | 白色 | 🎉 | 答对、完成 |
| error | #F5D67B | #3D3D3D | 💪 | 答错（温和） |
| info | #7CB69D | 白色 | 💡 | 提示信息 |

#### 使用边界
```
✅ 必须：
  • 动画时长 0.3-0.5s
  • 文字 >= 22px
  • 居中显示

❌ 禁止：
  • 使用红色表示错误（挫败感）
  • 自动跳转（给儿童反应时间）
  • 同时使用音效和震动（过度刺激）
```

---

### 2.5 进度组件（ProgressBar）

#### 规格定义
```typescript
interface ProgressProps {
  current: number
  total: number
  showText?: boolean
  size?: 'lg' | 'md' | 'sm'
}
```

#### 样式规格
```css
.progress-bar {
  height: 24px;  /* 高度足够可见 */
  background: #E8E4DC;
  border-radius: 12px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #7CB69D;
  border-radius: 12px;
  transition: width 0.5s ease;
}

.progress-text {
  font-size: 1rem;
  color: #6B6B6B;
  margin-top: 8px;
}
```

#### 儿童友好替代（可选）
```
星星收集版：
⭐⭐⭐⚪⚪⚪ （3/6）

糖果罐版：
🍬🍬🍬🍬⚪⚪ （4/6）
```

---

## 三、P0 可立即落地项与迭代推进项

### 3.1 P0 - 立即落地（本周完成）

#### 全局样式
| 任务 | 文件 | 改造点 | 预估工时 |
|------|------|--------|----------|
| 更换全局背景色 | `index.html` | body背景 `#F8F6F0` | 0.5h |
| 更新 CSS 变量 | `style.css` 或全局 | 定义色彩/字号/间距变量 | 1h |
| 移除版本号 | `App.vue` | 删除 footer 版本显示 | 0.5h |

#### 首页改造
| 任务 | 文件 | 改造点 | 预估工时 |
|------|------|--------|----------|
| 导航改为4宫格 | `App.vue` | 2x2网格布局 | 2h |
| 增大导航点击热区 | `App.vue` | 140x140px卡片 | 1h |
| 更新页脚信息 | `App.vue` | 显示用户+星星 | 0.5h |

#### 按钮组件
| 任务 | 文件 | 改造点 | 预估工时 |
|------|------|--------|----------|
| 创建 BaseButton | `components/BaseButton.vue` | 统一按钮组件 | 2h |
| 替换现有按钮 | 多个文件 | 使用新组件 | 3h |

**P0 总计：约 10.5 工时**

---

### 3.2 P1 - 短期迭代（下周完成）

#### 汉字学习页
| 任务 | 文件 | 改造点 | 预估工时 |
|------|------|--------|----------|
| 分步骤设计 | `CharacterLearning.vue` | 故事→认字→书写 | 4h |
| 田字格放大 | `CharacterLearning.vue` | 200x200px | 1h |
| 步骤指示器 | `CharacterLearning.vue` | (1/3) 步骤显示 | 1h |

#### 测验页
| 任务 | 文件 | 改造点 | 预估工时 |
|------|------|--------|----------|
| 减少题目数量 | `InteractiveQuiz.vue` | 最多5题 | 0.5h |
| 增大选项按钮 | `InteractiveQuiz.vue` | 56px高，16px间距 | 1h |
| 增强反馈 | `InteractiveQuiz.vue` | 成功/错误弹窗 | 2h |

#### 拼音页
| 任务 | 文件 | 改造点 | 预估工时 |
|------|------|--------|----------|
| Tab切换 | `PinyinPractice.vue` | 学习/游戏模式 | 2h |
| 配对卡片增大 | `PinyinPractice.vue` | 120x80px | 1h |

**P1 总计：约 12.5 工时**

---

### 3.3 P2 - 中期优化（下下周完成）

| 模块 | 任务 | 预估工时 |
|------|------|----------|
| 学习卡片 | 改为3列布局 | 2h |
| 数学练习 | 题目配图 | 4h |
| 故事阅读 | 增加朗读按钮 | 2h |
| 成就页 | 信息简化，徽章墙放大 | 3h |
| 全局 | 增加护眼模式切换 | 4h |

**P2 总计：约 15 工时**

---

### 3.4 迭代路线图

```
Week 1 (P0)
├── Day 1-2: 全局样式 + 首页改造
├── Day 3-4: 按钮组件开发
└── Day 5: 集成测试

Week 2 (P1)
├── Day 1-2: 汉字学习分步骤
├── Day 3: 测验页优化
└── Day 4-5: 拼音页改造

Week 3 (P2)
├── Day 1-2: 学习卡片 + 数学练习
├── Day 3-4: 成就页 + 护眼模式
└── Day 5: 整体测试
```

---

## 四、前端实现时需避免的儿童体验风险

### 4.1 视觉风险

| 风险 | 危害 | 预防措施 |
|------|------|----------|
| 高饱和度颜色 | 视觉疲劳、注意力分散 | 使用柔和色系，饱和度 < 60% |
| 高对比度文字 | 眼睛不适 | 文字使用深灰 #3D3D3D，非纯黑 |
| 闪烁动画 | 光敏性癫痫风险 | 避免闪烁频率 > 3Hz |
| 过小字体 | 阅读困难、近视风险 | 正文 >= 22px |
| 过亮背景 | 眩光、不适 | 使用暖色背景 #F8F6F0 |

**检查方法**：
```css
/* 使用此工具检查对比度 */
/* https://webaim.org/resources/contrastchecker/ */
/* 目标：对比度 4.5:1 - 7:1 之间 */
```

---

### 4.2 交互风险

| 风险 | 危害 | 预防措施 |
|------|------|----------|
| 点击热区过小 | 误触、挫败感 | 所有可点击 >= 60x60px |
| 按钮间距过小 | 误触相邻按钮 | 按钮间距 >= 16px |
| 无点击反馈 | 不确定是否点击成功 | 必须有点击视觉反馈 |
| 自动跳转 | 儿童反应不过来 | 必须手动点击下一步 |
| 长按操作 | 6岁儿童难以掌握 | 避免使用长按 |
| 滑动操作 | 精确度要求高 | 优先使用点击 |

**检查方法**：
```javascript
// 检查点击热区尺寸
const element = document.querySelector('.btn')
const rect = element.getBoundingClientRect()
console.assert(rect.width >= 60, '宽度不足60px')
console.assert(rect.height >= 60, '高度不足60px')
```

---

### 4.3 认知风险

| 风险 | 危害 | 预防措施 |
|------|------|----------|
| 选择过多 | 决策困难、焦虑 | 每页选择 <= 4个 |
| 信息过载 | 无法理解、放弃 | 每页核心信息 <= 3个 |
| 抽象图标 | 无法理解含义 | 使用具象图标或emoji |
| 纯文字说明 | 阅读能力有限 | 图文结合，增加语音 |
| 进度不清晰 | 失去耐心 | 明确的进度指示 |
| 无奖励反馈 | 缺乏动力 | 每步完成都有反馈 |

**检查方法**：
```
页面复杂度检查清单：
□ 本页是否有超过 4 个可选项？
□ 本页是否有超过 3 个核心功能？
□ 是否有纯文字无图标的说明？
□ 是否有抽象的隐喻或比喻？
□ 儿童能否在 10 秒内理解要做什么？
```

---

### 4.4 情感风险

| 风险 | 危害 | 预防措施 |
|------|------|----------|
| 红色错误提示 | 挫败感、恐惧 | 错误使用黄色/橙色 |
| 排行榜压力 | 焦虑、自卑 | 排行榜可选，强调自我进步 |
| 失败惩罚 | 抗拒学习 | 错误时鼓励"再试试" |
| 时间压力 | 焦虑 | 不显示倒计时 |
| 强制流程 | 失去控制感 | 允许跳过/返回 |
| 成人化语言 | 难以理解 | 使用儿童口语 |

**正确 vs 错误示例**：
```
❌ 错误提示：
"回答错误！"
"你真笨！"
"别人都答对了"

✅ 正确提示：
"差一点就对了！"
"再试试看 💪"
"加油，你可以的！"
```

---

### 4.5 技术实现风险

| 风险 | 危害 | 预防措施 |
|------|------|----------|
| 动画卡顿 | 体验差、眩晕 | 使用 transform 而非 position |
| 加载过慢 | 失去耐心 | 骨架屏 + 加载动画 |
| 音效突然 | 惊吓 | 音量控制，渐强播放 |
| 震动过强 | 不适 | 轻微震动或关闭选项 |
| 无网络提示 | 困惑 | 友好的离线提示 |

**性能检查清单**：
```css
/* 动画性能优化 */
.animated-element {
  will-change: transform;
  transform: translateZ(0);  /* 开启硬件加速 */
}

/* 避免 */
.animated-element {
  left: 0;  /* 避免改变布局属性 */
  width: 100px;
}
```

---

### 4.6 安全与隐私风险

| 风险 | 危害 | 预防措施 |
|------|------|----------|
| 儿童信息泄露 | 隐私问题 | 不收集真实姓名、位置 |
| 外部链接 | 跳出应用 | 避免或确认提示 |
| 广告内容 | 不适合儿童 | 严格控制广告内容 |
| 社交功能 | 陌生人接触 | 限制或家长控制 |

---

## 五、验收检查清单（QA用）

### 5.1 首页验收

- [ ] 页面背景色为 #F8F6F0（暖米色）
- [ ] 导航为 4宫格布局
- [ ] 导航卡片点击热区 >= 140x140px
- [ ] 导航图标 >= 48px
- [ ] 导航文字 >= 20px
- [ ] 点击导航有视觉反馈
- [ ] 页脚显示用户名和星星数
- [ ] 无版本号显示

### 5.2 按钮验收

- [ ] 主按钮高度 >= 64px
- [ ] 次按钮高度 >= 56px
- [ ] 所有按钮圆角 >= 12px
- [ ] 点击按钮有 scale(0.96) 反馈
- [ ] 按钮文字 >= 18px
- [ ] 按钮间距 >= 16px

### 5.3 文字验收

- [ ] 页面标题 >= 40px
- [ ] 模块标题 >= 32px
- [ ] 正文内容 >= 22px
- [ ] 辅助文字 >= 18px
- [ ] 展示汉字 >= 64px
- [ ] 行高 >= 1.6

### 5.4 交互验收

- [ ] 所有可点击元素 >= 60x60px
- [ ] 有明确的点击反馈
- [ ] 测验有成功/错误反馈
- [ ] 进度有可视化指示
- [ ] 无自动跳转（必须手动）
- [ ] 错误提示使用黄色而非红色

### 5.5 性能验收

- [ ] 页面加载时间 < 3s
- [ ] 动画流畅无卡顿
- [ ] 无内存泄漏
- [ ] 离线状态有提示

---

## 六、参考资源

### 色彩参考
- 主背景：`#F8F6F0`
- 主色：`#7CB69D`
- 次色：`#F5C26B`
- 成功：`#8BC48A`
- 错误（温和）：`#F5D67B`
- 文字：`#3D3D3D`

### 尺寸参考
- 导航卡片：140x140px
- 主按钮：64px 高
- 次按钮：56px 高
- 游戏卡片：120x80px
- 田字格：200x200px

### 间距参考
- 页面内边距：24px
- 模块间距：32px
- 元素间距：16px
- 卡片间距：20px

---

*交付映射文档 v1.0 - 前端可直接执行*
