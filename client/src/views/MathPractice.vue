<template>
  <div class="math-practice">
    <h2>🔢 数学练习 - 20以内应用题</h2>

    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
      <span class="progress-text">完成进度: {{ progress.completed.length }}/{{ problems.length }}</span>
    </div>

    <div class="problem-section">
      <div class="problem-card">
        <p class="problem-text" v-html="highlightKeywords(currentProblem.text)"></p>
        <div class="problem-type">{{ currentProblem.type }}</div>

        <div class="answer-input">
          <input
            v-model.number="userAnswer"
            type="number"
            placeholder="输入答案"
            @keyup.enter="checkAnswer"
          >
          <button @click="checkAnswer">提交</button>
        </div>

        <div v-if="feedback" :class="['feedback', feedback.correct ? 'correct' : 'wrong']">
          {{ feedback.message }}
        </div>
      </div>

      <div class="stats">
        <div class="stat-item">
          <span class="stat-label">正确:</span>
          <span class="stat-value">{{ score }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">错误:</span>
          <span class="stat-value">{{ wrongCount }}</span>
        </div>
      </div>
    </div>

    <div class="wrong-answers" v-if="progress.wrongAnswers.length > 0">
      <h3>📝 错题本</h3>
      <div class="wrong-list">
        <div v-for="(item, idx) in progress.wrongAnswers.slice(-5)" :key="idx" class="wrong-item">
          <p>{{ item.problem }}</p>
          <p class="wrong-detail">你的答案: {{ item.userAnswer }} | 正确答案: {{ item.correctAnswer }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { api } from '../utils/api'

const authStore = useAuthStore()

const problems = ref([
  { id: 1, text: '小明有8个苹果，吃了3个，还剩几个？', answer: 5, type: '减法', keywords: ['吃了', '还剩'] },
  { id: 2, text: '树上有5只鸟，又飞来7只，一共有几只？', answer: 12, type: '加法', keywords: ['又飞来', '一共'] },
  { id: 3, text: '妈妈买了15个橘子，给了弟弟6个，妈妈还有几个？', answer: 9, type: '减法', keywords: ['给了', '还有'] },
  { id: 4, text: '小红有9支铅笔，小明有6支，小红比小明多几支？', answer: 3, type: '求相差', keywords: ['比', '多几'] },
  { id: 5, text: '停车场有12辆车，开走了4辆，还有几辆？', answer: 8, type: '减法', keywords: ['开走', '还有'] },
  { id: 6, text: '花园里有7朵红花，8朵黄花，一共有几朵花？', answer: 15, type: '加法', keywords: ['一共'] },
  { id: 7, text: '小明今年6岁，爸爸今年32岁，爸爸比小明大几岁？', answer: 26, type: '求相差', keywords: ['比', '大几'] }
])

const currentIndex = ref(0)
const userAnswer = ref('')
const feedback = ref(null)
const score = ref(0)
const wrongCount = ref(0)

const progress = ref({
  completed: [],
  scores: [],
  wrongAnswers: []
})

onMounted(() => {
  const saved = localStorage.getItem('math-practice-progress')
  if (saved) progress.value = JSON.parse(saved)
})

const saveProgress = async () => {
  if (!authStore.currentStudent) return
  await api.post('/learning/records', {
    student_id: authStore.currentStudent.id,
    topic_type: 'math',
    topic_id: 'word_problems',
    score: score.value,
    duration: 0
  })
}

const currentProblem = computed(() => problems.value[currentIndex.value])

const progressPercent = computed(() => {
  return Math.round((progress.value.completed.length / problems.value.length) * 100)
})

const highlightKeywords = (text) => {
  let highlighted = text
  currentProblem.value.keywords.forEach(keyword => {
    highlighted = highlighted.replace(keyword, `<span class="keyword">${keyword}</span>`)
  })
  return highlighted
}

const checkAnswer = async () => {
  if (userAnswer.value === '') return

  const correct = userAnswer.value === currentProblem.value.answer

  if (correct) {
    score.value++
    feedback.value = { correct: true, message: '🎉 太棒了！答对了！' }
    if (!progress.value.completed.includes(currentProblem.value.id)) {
      progress.value.completed.push(currentProblem.value.id)
    }
  } else {
    wrongCount.value++
    feedback.value = { correct: false, message: `❌ 答案是 ${currentProblem.value.answer}` }
    await api.post('/learning/mistakes', {
      student_id: authStore.currentStudent.id,
      topic_type: 'math',
      question: currentProblem.value.text,
      correct_answer: String(currentProblem.value.answer),
      user_answer: String(userAnswer.value)
    })
  }

  await saveProgress()

  setTimeout(() => {
    if (currentIndex.value < problems.value.length - 1) {
      currentIndex.value++
      userAnswer.value = ''
      feedback.value = null
    }
  }, 1500)
}
</script>

<style scoped>
.math-practice {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  color: #667eea;
  text-align: center;
  margin-bottom: 20px;
}

.progress-bar {
  position: relative;
  height: 30px;
  background: #f0f0f0;
  border-radius: 15px;
  margin-bottom: 30px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.5s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold;
  color: #333;
}

.problem-card {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  padding: 40px;
  border-radius: 20px;
  margin-bottom: 20px;
}

.problem-text {
  font-size: 1.5rem;
  line-height: 1.8;
  color: #2d3436;
  margin-bottom: 15px;
}

.keyword {
  color: #d63031;
  font-weight: bold;
  background: rgba(255, 255, 255, 0.6);
  padding: 2px 6px;
  border-radius: 4px;
}

.problem-type {
  display: inline-block;
  background: #74b9ff;
  color: white;
  padding: 5px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.answer-input {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.answer-input input {
  flex: 1;
  padding: 15px;
  font-size: 1.3rem;
  border: 3px solid #667eea;
  border-radius: 10px;
  font-family: inherit;
}

.answer-input button {
  padding: 15px 40px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.2rem;
  cursor: pointer;
  font-family: inherit;
}

.answer-input button:hover {
  background: #764ba2;
}

.feedback {
  margin-top: 15px;
  padding: 15px;
  border-radius: 10px;
  font-size: 1.2rem;
  text-align: center;
  font-weight: bold;
}

.feedback.correct {
  background: #00b894;
  color: white;
}

.feedback.wrong {
  background: #ff7675;
  color: white;
}

.stats {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.stat-item {
  background: white;
  padding: 15px 30px;
  border-radius: 15px;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.stat-label {
  color: #636e72;
  margin-right: 10px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #667eea;
}

.wrong-answers {
  margin-top: 40px;
}

.wrong-answers h3 {
  color: #764ba2;
  margin-bottom: 15px;
}

.wrong-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.wrong-item {
  background: #fff5f5;
  padding: 15px;
  border-radius: 10px;
  border-left: 4px solid #ff7675;
}

.wrong-item p {
  margin: 5px 0;
}

.wrong-detail {
  font-size: 0.9rem;
  color: #636e72;
}
</style>
