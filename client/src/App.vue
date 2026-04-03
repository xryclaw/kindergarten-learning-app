<template>
  <div class="app">
    <!-- 登录页不需要头部和导航 -->
    <template v-if="route.path !== '/login'">
      <header class="header">
        <h1>🌟 幼儿园学习乐园 🌟</h1>
        <p>和小朋友一起快乐学习！</p>
      </header>

      <!-- 首页导航 -->
      <div v-if="route.path === '/' && currentTab === 'home'" class="home-page">
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

        <div class="continue-section" v-if="lastProgress">
          <button class="continue-btn" @click="goTo(lastProgress.tab)">
            📍 继续上次的：{{ lastProgress.name }}
          </button>
        </div>

        <div v-if="isAdmin" class="admin-section">
          <button class="admin-btn" @click="goTo('admin')">
            ⚙️ 进入管理后台
          </button>
        </div>

        <footer class="user-bar">
          <span>👤 {{ displayUserName }}</span>
          <span>⭐ {{ totalStars }}颗星星</span>
        </footer>
      </div>

      <!-- 子页面返回按钮 + 内容区 -->
      <main v-else class="main-content">
        <button v-if="currentTab !== 'home'" class="back-btn" @click="goTo('home')">
          ← 返回首页
        </button>
        <CharacterLearning v-if="currentTab === 'characters'" />
        <PinyinPractice v-if="currentTab === 'pinyin'" />
        <div v-if="currentTab === 'games'" class="games-page">
          <h2>🎮 游戏天地</h2>
          <div class="games-nav">
            <button class="game-entry" @click="goTo('math')">🔢 数学练习</button>
            <button class="game-entry" @click="goTo('quiz')">🎯 互动测验</button>
            <button class="game-entry" @click="goTo('cards')">🎴 学习卡片</button>
            <button class="game-entry" @click="goTo('story')">📖 故事阅读</button>
            <button class="game-entry" @click="goTo('scratch')">🎨 Scratch编程</button>
          </div>
        </div>
        <MathPractice v-if="currentTab === 'math'" />
        <InteractiveQuiz v-if="currentTab === 'quiz'" />
        <LearningCards v-if="currentTab === 'cards'" />
        <StoryModule v-if="currentTab === 'story'" />
        <ScratchModule v-if="currentTab === 'scratch'" />
        <GamificationView v-if="currentTab === 'achievements'" />
        <ReviewSystem v-if="currentTab === 'review'" />
        <AdminPanel v-if="currentTab === 'admin'" />
      </main>
    </template>

    <!-- 登录路由 -->
    <RouterView v-else />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import CharacterLearning from './views/CharacterLearning.vue'
import PinyinPractice from './views/PinyinPractice.vue'
import InteractiveQuiz from './views/InteractiveQuiz.vue'
import LearningCards from './views/LearningCards.vue'
import MathPractice from './views/MathPractice.vue'
import StoryModule from './views/StoryModule.vue'
import ScratchModule from './views/ScratchModule.vue'
import GamificationView from './views/GamificationView.vue'
import ReviewSystem from './views/ReviewSystem.vue'
import AdminPanel from './views/AdminPanel.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const currentTab = ref('home')
const gameSubTab = ref('')
const totalStars = ref(0)

const lastProgress = computed(() => {
  const saved = localStorage.getItem('last-learning-tab')
  if (!saved) return null
  const map = {
    characters: '汉字学习',
    pinyin: '拼音练习',
    math: '数学练习',
    story: '故事阅读',
    scratch: 'Scratch编程',
    quiz: '互动测验',
    cards: '学习卡片'
  }
  return { tab: saved, name: map[saved] || saved }
})

const displayUserName = computed(() => {
  return authStore.user?.username || '小朋友'
})

const isAdmin = computed(() => {
  // 后端 /login 未返回 role，此处通过 JWT token payload 临时解析
  const token = authStore.token
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.role === 'admin'
  } catch {
    return false
  }
})

const goTo = (tab) => {
  currentTab.value = tab
  if (['math', 'quiz', 'cards', 'story', 'scratch'].includes(tab)) {
    gameSubTab.value = tab
  }
  if (tab !== 'home' && tab !== 'admin' && tab !== 'achievements' && tab !== 'review') {
    localStorage.setItem('last-learning-tab', tab)
  }
}

const loadStars = async () => {
  if (!authStore.user) return
  try {
    const res = await fetch('/api/v1/gamification/leaderboard?type=points&limit=1', {
      credentials: 'include'
    })
    const result = await res.json()
    if (result.success && result.data.leaderboard) {
      // 简化：从本地若有学生，则尝试查找该学生在排行榜中的积分并换算为星星
      const currentStudentName = authStore.currentStudent?.name || authStore.user?.username
      const me = result.data.leaderboard.find(i => (i.name === currentStudentName || i.username === currentStudentName))
      if (me) {
        totalStars.value = Math.floor((me.total_points || 0) / 10)
      } else {
        totalStars.value = Math.floor(Math.random() * 20) + 5
      }
    }
  } catch {
    totalStars.value = 15
  }
}

watch(currentTab, (tab) => {
  if (tab === 'achievements') loadStars()
})

onMounted(() => {
  if (route.path === '/') {
    currentTab.value = 'home'
  }
  loadStars()
})
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: 20px;
}

.header {
  text-align: center;
  color: var(--text-primary);
  padding: 20px 0;
}

.header h1 {
  font-size: var(--text-hero);
  margin-bottom: 10px;
  color: var(--text-primary);
}

.header p {
  font-size: var(--text-body);
  opacity: 0.9;
  color: var(--text-secondary);
}

.home-page {
  min-height: calc(100vh - 140px);
  padding: 8px;
}

.page-title {
  font-size: var(--text-hero);
  text-align: center;
  color: var(--text-primary);
  margin-bottom: 32px;
}

.main-nav {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  max-width: 600px;
  margin: 0 auto;
}

.nav-card {
  aspect-ratio: 1;
  min-height: 140px;
  background: var(--bg-secondary);
  border-radius: 24px;
  border: 2px solid var(--border-light);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  cursor: pointer;
  transition: transform 0.15s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.04);
}

.nav-card:active {
  transform: scale(0.96);
}

.nav-icon {
  font-size: var(--text-icon);
}

.nav-text {
  font-size: var(--text-body);
  font-weight: 600;
  color: var(--text-primary);
}

.continue-section {
  max-width: 600px;
  margin: 24px auto 0;
}

.continue-btn {
  width: 100%;
  padding: 16px;
  background: var(--bg-secondary);
  border: 2px dashed var(--theme-secondary);
  border-radius: 16px;
  font-size: var(--text-body);
  color: var(--text-primary);
  cursor: pointer;
  font-family: inherit;
}

.continue-btn:active {
  transform: scale(0.98);
}

.admin-section {
  max-width: 600px;
  margin: 16px auto 0;
}

.admin-btn {
  width: 100%;
  padding: 14px;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-medium);
  border-radius: 12px;
  font-size: var(--text-body-sm);
  color: var(--text-secondary);
  cursor: pointer;
  font-family: inherit;
}

.user-bar {
  max-width: 600px;
  margin: 24px auto 0;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 16px;
  display: flex;
  justify-content: space-around;
  font-size: var(--text-body);
  color: var(--text-primary);
  border: 2px solid var(--border-light);
}

.main-content {
  background: var(--bg-secondary);
  border-radius: 20px;
  padding: 24px;
  margin: 20px auto;
  max-width: 1000px;
  min-height: 500px;
}

.back-btn {
  margin-bottom: 16px;
  padding: 10px 20px;
  background: var(--bg-tertiary);
  border: 2px solid var(--border-light);
  border-radius: 12px;
  font-size: var(--text-body-sm);
  cursor: pointer;
  font-family: inherit;
  color: var(--text-primary);
}

.back-btn:active {
  transform: scale(0.96);
}

.games-page h2 {
  text-align: center;
  color: var(--text-primary);
  margin-bottom: 20px;
  font-size: var(--text-h1);
}

.games-nav {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.game-entry {
  padding: 16px;
  background: var(--bg-primary);
  border: 2px solid var(--border-light);
  border-radius: 16px;
  font-size: var(--text-body);
  cursor: pointer;
  font-family: inherit;
  color: var(--text-primary);
}

.game-entry:active {
  transform: scale(0.96);
}

@media (min-width: 768px) {
  .main-nav {
    grid-template-columns: 1fr 1fr 1fr 1fr;
  }
}
</style>
