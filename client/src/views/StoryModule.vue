<template>
  <div class="story-module">
    <h2>📖 故事阅读</h2>

    <div class="story-selector">
      <button
        v-for="story in stories"
        :key="story.id"
        @click="selectStory(story)"
        :class="['story-btn', { active: currentStory?.id === story.id }]"
      >
        {{ story.title }}
      </button>
    </div>

    <div v-if="currentStory" class="story-content">
      <h3>{{ currentStory.title }}</h3>
      <div class="story-text">
        <p v-for="(para, idx) in currentStory.content" :key="idx">{{ para }}</p>
      </div>

      <div class="comprehension-quiz" v-if="showQuiz">
        <h4>🤔 理解问题</h4>
        <div class="question-card">
          <p class="question">{{ currentQuestion.question }}</p>
          <div class="options">
            <button
              v-for="(option, idx) in currentQuestion.options"
              :key="idx"
              @click="answerQuestion(option)"
              class="option-btn"
            >
              {{ option }}
            </button>
          </div>
        </div>
        <div v-if="quizFeedback" :class="['feedback', quizFeedback.correct ? 'correct' : 'wrong']">
          {{ quizFeedback.message }}
        </div>
      </div>

      <button v-else @click="startQuiz" class="start-quiz-btn">开始答题</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { api } from '../utils/api'

const authStore = useAuthStore()

const stories = ref([
  {
    id: 1,
    title: '小兔子找萝卜',
    content: [
      '小兔子饿了，想找萝卜吃。',
      '它来到菜园，看到了很多萝卜。',
      '小兔子高兴地拔了一个大萝卜，开心地吃了起来。'
    ],
    questions: [
      { question: '小兔子想找什么？', options: ['萝卜', '白菜', '苹果'], answer: '萝卜' },
      { question: '小兔子在哪里找到萝卜？', options: ['森林', '菜园', '河边'], answer: '菜园' }
    ]
  },
  {
    id: 2,
    title: '小猫钓鱼',
    content: [
      '小猫和妈妈去钓鱼。',
      '小猫一会儿捉蝴蝶，一会儿捉蜻蜓，什么也没钓到。',
      '妈妈专心钓鱼，钓到了很多鱼。',
      '小猫明白了：做事要专心，不能三心二意。'
    ],
    questions: [
      { question: '小猫为什么没钓到鱼？', options: ['不专心', '没有鱼竿', '天气不好'], answer: '不专心' },
      { question: '这个故事告诉我们什么？', options: ['做事要专心', '要多玩耍', '要多休息'], answer: '做事要专心' }
    ]
  }
])

const currentStory = ref(null)
const showQuiz = ref(false)
const currentQuestionIndex = ref(0)
const quizFeedback = ref(null)
const score = ref(0)

const progress = ref({
  completed: [],
  scores: [],
  wrongAnswers: []
})

onMounted(() => {
  const saved = localStorage.getItem('story-module-progress')
  if (saved) progress.value = JSON.parse(saved)
})

const saveProgress = () => {
  localStorage.setItem('story-module-progress', JSON.stringify(progress.value))
}

const selectStory = (story) => {
  currentStory.value = story
  showQuiz.value = false
  currentQuestionIndex.value = 0
  quizFeedback.value = null
  score.value = 0
}

const currentQuestion = ref(null)

const startQuiz = () => {
  showQuiz.value = true
  currentQuestion.value = currentStory.value.questions[0]
}

const answerQuestion = async (option) => {
  const correct = option === currentQuestion.value.answer

  if (correct) {
    score.value++
    quizFeedback.value = { correct: true, message: '✅ 答对了！' }
  } else {
    quizFeedback.value = { correct: false, message: `❌ 正确答案是：${currentQuestion.value.answer}` }
    await api.post('/learning/mistakes', {
      student_id: authStore.currentStudent.id,
      topic_type: 'story',
      question: currentQuestion.value.question,
      correct_answer: currentQuestion.value.answer,
      user_answer: option
    })
  }

  setTimeout(async () => {
    if (currentQuestionIndex.value < currentStory.value.questions.length - 1) {
      currentQuestionIndex.value++
      currentQuestion.value = currentStory.value.questions[currentQuestionIndex.value]
      quizFeedback.value = null
    } else {
      if (!progress.value.completed.includes(currentStory.value.id)) {
        progress.value.completed.push(currentStory.value.id)
      }
      await api.post('/learning/records', {
        student_id: authStore.currentStudent.id,
        topic_type: 'story',
        topic_id: String(currentStory.value.id),
        score: score.value,
        duration: 0
      })
    }
  }, 1500)
}
</script>

<style scoped>
.story-module {
  padding: 20px;
  max-width: 900px;
  margin: 0 auto;
}

h2 {
  color: #667eea;
  text-align: center;
  margin-bottom: 30px;
}

.story-selector {
  display: flex;
  gap: 15px;
  justify-content: center;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.story-btn {
  padding: 12px 25px;
  background: #f0f0f0;
  border: 2px solid #667eea;
  border-radius: 20px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.3s;
  font-family: inherit;
}

.story-btn:hover, .story-btn.active {
  background: #667eea;
  color: white;
}

.story-content {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  padding: 40px;
  border-radius: 20px;
}

.story-content h3 {
  color: #d63031;
  text-align: center;
  margin-bottom: 25px;
  font-size: 1.8rem;
}

.story-text p {
  font-size: 1.4rem;
  line-height: 2;
  color: #2d3436;
  margin-bottom: 15px;
  text-indent: 2em;
}

.comprehension-quiz {
  margin-top: 30px;
  padding-top: 30px;
  border-top: 3px dashed #fab1a0;
}

.comprehension-quiz h4 {
  color: #764ba2;
  margin-bottom: 20px;
}

.question-card {
  background: white;
  padding: 25px;
  border-radius: 15px;
}

.question {
  font-size: 1.3rem;
  color: #2d3436;
  margin-bottom: 20px;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option-btn {
  padding: 15px;
  background: #74b9ff;
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1.1rem;
  cursor: pointer;
  transition: all 0.3s;
  font-family: inherit;
}

.option-btn:hover {
  background: #0984e3;
  transform: translateX(5px);
}

.feedback {
  margin-top: 15px;
  padding: 15px;
  border-radius: 10px;
  text-align: center;
  font-size: 1.2rem;
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

.start-quiz-btn {
  display: block;
  margin: 30px auto 0;
  padding: 15px 40px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 1.2rem;
  cursor: pointer;
  font-family: inherit;
}

.start-quiz-btn:hover {
  background: #764ba2;
}
</style>
