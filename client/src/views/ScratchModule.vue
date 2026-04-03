<template>
  <div class="scratch-module">
    <h2>🎨 Scratch编程入门</h2>

    <div class="intro-section">
      <p class="intro-text">Scratch是一个图形化编程工具，让我们通过拖拽积木块来创作动画和游戏！</p>
    </div>

    <div class="lessons">
      <div
        v-for="lesson in lessons"
        :key="lesson.id"
        @click="selectLesson(lesson)"
        :class="['lesson-card', { completed: progress.completed.includes(lesson.id) }]"
      >
        <div class="lesson-icon">{{ lesson.icon }}</div>
        <h3>{{ lesson.title }}</h3>
        <p>{{ lesson.description }}</p>
      </div>
    </div>

    <div v-if="currentLesson" class="lesson-detail">
      <h3>{{ currentLesson.title }}</h3>
      <div class="lesson-content">
        <div v-for="(step, idx) in currentLesson.steps" :key="idx" class="step">
          <div class="step-number">{{ idx + 1 }}</div>
          <div class="step-content">
            <h4>{{ step.title }}</h4>
            <p>{{ step.description }}</p>
            <div v-if="step.blocks" class="blocks">
              <div v-for="(block, bidx) in step.blocks" :key="bidx" :class="['block', block.type]">
                {{ block.text }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <button @click="completeLesson" class="complete-btn">完成课程</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { api } from '../utils/api'

const authStore = useAuthStore()

const lessons = ref([
  {
    id: 1,
    icon: '🐱',
    title: '认识Scratch',
    description: '了解Scratch界面和基本概念',
    steps: [
      { title: '什么是Scratch', description: 'Scratch是用积木块编程，就像搭积木一样简单！' },
      { title: '角色和舞台', description: '角色是会动的小精灵，舞台是它们表演的地方。' }
    ]
  },
  {
    id: 2,
    icon: '🚶',
    title: '让角色动起来',
    description: '学习移动和转向指令',
    steps: [
      {
        title: '移动指令',
        description: '使用移动积木让角色走动',
        blocks: [
          { type: 'motion', text: '移动 10 步' },
          { type: 'motion', text: '右转 15 度' }
        ]
      }
    ]
  },
  {
    id: 3,
    icon: '🎨',
    title: '改变外观',
    description: '学习改变角色的样子',
    steps: [
      {
        title: '外观积木',
        description: '让角色说话、改变颜色',
        blocks: [
          { type: 'looks', text: '说 你好！持续 2 秒' },
          { type: 'looks', text: '将颜色特效增加 25' }
        ]
      }
    ]
  }
])

const currentLesson = ref(null)

const progress = ref({
  completed: [],
  scores: []
})

onMounted(() => {
  const saved = localStorage.getItem('scratch-module-progress')
  if (saved) progress.value = JSON.parse(saved)
})

const saveProgress = () => {
  localStorage.setItem('scratch-module-progress', JSON.stringify(progress.value))
}

const selectLesson = (lesson) => {
  currentLesson.value = lesson
}

const completeLesson = async () => {
  if (!progress.value.completed.includes(currentLesson.value.id)) {
    progress.value.completed.push(currentLesson.value.id)
    await api.post('/learning/records', {
      student_id: authStore.currentStudent.id,
      topic_type: 'scratch',
      topic_id: String(currentLesson.value.id),
      score: 1,
      duration: 0
    })
  }
  currentLesson.value = null
}
</script>

<style scoped>
.scratch-module {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

h2 {
  color: #667eea;
  text-align: center;
  margin-bottom: 20px;
}

.intro-section {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  padding: 30px;
  border-radius: 20px;
  margin-bottom: 30px;
}

.intro-text {
  font-size: 1.3rem;
  text-align: center;
  color: #2d3436;
}

.lessons {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.lesson-card {
  background: white;
  padding: 25px;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
  border: 3px solid transparent;
}

.lesson-card:hover {
  transform: translateY(-5px);
  border-color: #667eea;
}

.lesson-card.completed {
  background: #d5f4e6;
  border-color: #00b894;
}

.lesson-icon {
  font-size: 3rem;
  text-align: center;
  margin-bottom: 15px;
}

.lesson-card h3 {
  color: #2d3436;
  margin-bottom: 10px;
  font-size: 1.3rem;
}

.lesson-card p {
  color: #636e72;
  font-size: 1rem;
}

.lesson-detail {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  padding: 40px;
  border-radius: 20px;
}

.lesson-detail h3 {
  color: #d63031;
  text-align: center;
  margin-bottom: 30px;
  font-size: 1.8rem;
}

.step {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  background: white;
  padding: 20px;
  border-radius: 15px;
}

.step-number {
  width: 40px;
  height: 40px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content h4 {
  color: #2d3436;
  margin-bottom: 10px;
}

.step-content p {
  color: #636e72;
  margin-bottom: 15px;
}

.blocks {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.block {
  padding: 12px 20px;
  border-radius: 8px;
  color: white;
  font-size: 1.1rem;
  display: inline-block;
  max-width: fit-content;
}

.block.motion {
  background: #4a90e2;
}

.block.looks {
  background: #9b59b6;
}

.complete-btn {
  display: block;
  margin: 30px auto 0;
  padding: 15px 40px;
  background: #00b894;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 1.2rem;
  cursor: pointer;
  font-family: inherit;
}

.complete-btn:hover {
  background: #00a383;
}
</style>
