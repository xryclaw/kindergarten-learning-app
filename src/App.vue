<template>
  <div class="app">
    <header class="header">
      <h1>🌟 幼儿园学习乐园 🌟</h1>
      <p>和小朋友一起快乐学习！</p>
    </header>
    
    <nav class="nav">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        :class="['nav-btn', { active: currentTab === tab.id }]"
        @click="currentTab = tab.id"
      >
        {{ tab.icon }} {{ tab.name }}
      </button>
    </nav>
    
    <main class="main-content">
      <CharacterLearning v-if="currentTab === 'characters'" />
      <PinyinPractice v-if="currentTab === 'pinyin'" />
      <InteractiveQuiz v-if="currentTab === 'quiz'" />
      <LearningCards v-if="currentTab === 'cards'" />
    </main>
    
    <footer class="footer">
      <p>📚 今日学习：汉字 + 拼音 | 加油！💪</p>
    </footer>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import CharacterLearning from './views/CharacterLearning.vue'
import PinyinPractice from './views/PinyinPractice.vue'
import InteractiveQuiz from './views/InteractiveQuiz.vue'
import LearningCards from './views/LearningCards.vue'

const currentTab = ref('characters')

const tabs = [
  { id: 'characters', name: '汉字学习', icon: '✍️' },
  { id: 'pinyin', name: '拼音练习', icon: '🔤' },
  { id: 'quiz', name: '互动测验', icon: '🎯' },
  { id: 'cards', name: '学习卡片', icon: '🎴' }
]
</script>

<style scoped>
.app {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  min-height: 100vh;
}

.header {
  text-align: center;
  color: white;
  padding: 30px 0;
}

.header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}

.header p {
  font-size: 1.2rem;
  opacity: 0.9;
}

.nav {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.nav-btn {
  padding: 15px 25px;
  border: none;
  border-radius: 50px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: white;
  color: #667eea;
  font-family: inherit;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.nav-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
}

.nav-btn.active {
  background: #ffd93d;
  color: #333;
  transform: scale(1.05);
}

.main-content {
  background: white;
  border-radius: 20px;
  padding: 30px;
  margin: 20px 0;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  min-height: 500px;
}

.footer {
  text-align: center;
  color: white;
  padding: 20px;
  font-size: 1.1rem;
}

@media (max-width: 768px) {
  .header h1 {
    font-size: 1.8rem;
  }
  
  .nav-btn {
    padding: 12px 20px;
    font-size: 1rem;
  }
}
</style>
