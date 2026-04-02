<template>
  <div class="interactive-quiz">
    <h2>🎯 互动测验</h2>
    
    <div v-if="!quizStarted" class="start-screen">
      <div class="start-card">
        <h3>准备好挑战了吗？</h3>
        <p>本测验包含 {{ questions.length }} 道题目</p>
        <p>测试你对汉字和拼音的掌握程度！</p>
        <button @click="startQuiz" class="start-btn">开始测验 🚀</button>
      </div>
    </div>

    <div v-else-if="!quizFinished" class="quiz-container">
      <div class="progress-bar">
        <div class="progress" :style="{ width: progressPercent + '%' }"></div>
      </div>
      
      <div class="question-info">
        <span>题目 {{ currentQuestionIndex + 1 }} / {{ questions.length }}</span>
        <span class="score">得分: {{ score }}</span>
      </div>

      <div class="question-card">
        <h3>{{ currentQuestion.question }}</h3>
        
        <div v-if="currentQuestion.type === 'character'" class="character-question">
          <div class="big-char">{{ currentQuestion.char }}</div>
        </div>

        <div v-if="currentQuestion.type === 'pinyin'" class="pinyin-question">
          <div class="big-pinyin">{{ currentQuestion.pinyin }}</div>
        </div>

        <div v-if="currentQuestion.type === 'poem'" class="poem-question">
          <p class="poem-line">{{ currentQuestion.line }}</p>
        </div>

        <div class="options">
          <button 
            v-for="(option, index) in currentQuestion.options" 
            :key="index"
            :class="['option-btn', { 
              selected: selectedAnswer === index,
              correct: showResult && index === currentQuestion.correct,
              wrong: showResult && selectedAnswer === index && index !== currentQuestion.correct
            }]"
            @click="selectAnswer(index)"
            :disabled="showResult"
          >
            {{ option }}
          </button>
        </div>

        <div v-if="showResult" class="result-feedback">
          <p v-if="selectedAnswer === currentQuestion.correct" class="correct-text">
            🎉 答对了！太棒了！
          </p>
          <p v-else class="wrong-text">
            😅 再想想，正确答案是：{{ currentQuestion.options[currentQuestion.correct] }}
          </p>
          
          <button @click="nextQuestion" class="next-btn">
            {{ isLastQuestion ? '查看结果' : '下一题' }}
          </button>
        </div>
      </div>
    </div>

    <div v-else class="result-screen">
      <div class="result-card">
        <h3>🎊 测验完成！</h3>
        <div class="final-score">
          <span class="score-number">{{ score }}</span>
          <span class="score-total">/ {{ questions.length * 10 }}</span>
        </div>
        
        <div class="stars">
          <span v-for="n in starCount" :key="n" class="star">⭐</span>
        </div>
        
        <p class="feedback-text">{{ feedbackText }}</p>
        
        <div class="stats">
          <div class="stat-item">
            <span class="stat-label">正确率</span>
            <span class="stat-value">{{ accuracy }}%</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">答对题数</span>
            <span class="stat-value">{{ correctCount }} / {{ questions.length }}</span>
          </div>
        </div>
        
        <button @click="restartQuiz" class="restart-btn">再测一次 🔄</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const questions = [
  {
    type: 'character',
    char: '江',
    question: '这个字的拼音是什么？',
    options: ['jiāng', 'nán', 'kě', 'cǎi'],
    correct: 0
  },
  {
    type: 'character',
    char: '南',
    question: '这个字的拼音是什么？',
    options: ['běi', 'nán', 'dōng', 'xī'],
    correct: 1
  },
  {
    type: 'pinyin',
    pinyin: 'yè',
    question: '这个拼音对应的汉字是什么？',
    options: ['叶', '可', '东', '西'],
    correct: 0
  },
  {
    type: 'pinyin',
    pinyin: 'dōng',
    question: '这个拼音对应的汉字是什么？',
    options: ['南', '北', '东', '西'],
    correct: 2
  },
  {
    type: 'poem',
    line: '江南可采莲',
    question: '这句诗的下一句是什么？',
    options: [
      '鱼戏莲叶间',
      '莲叶何田田',
      '鱼戏莲叶东',
      '鱼戏莲叶北'
    ],
    correct: 1
  },
  {
    type: 'character',
    char: '可',
    question: '这个字怎么读？',
    options: ['kě', 'yè', 'dōng', 'xī'],
    correct: 0
  },
  {
    type: 'pinyin',
    pinyin: 'xī',
    question: '这个拼音对应的汉字是什么？',
    options: ['东', '南', '北', '西'],
    correct: 3
  },
  {
    type: 'poem',
    line: '鱼戏莲叶间',
    question: '下一句是什么？',
    options: [
      '江南可采莲',
      '鱼戏莲叶东',
      '莲叶何田田',
      '鱼戏莲叶南'
    ],
    correct: 1
  }
]

const quizStarted = ref(false)
const quizFinished = ref(false)
const currentQuestionIndex = ref(0)
const selectedAnswer = ref(null)
const showResult = ref(false)
const score = ref(0)
const answers = ref([])

const currentQuestion = computed(() => questions[currentQuestionIndex.value])

const progressPercent = computed(() => {
  return ((currentQuestionIndex.value + 1) / questions.length) * 100
})

const isLastQuestion = computed(() => {
  return currentQuestionIndex.value === questions.length - 1
})

const correctCount = computed(() => {
  return answers.value.filter(a => a.correct).length
})

const accuracy = computed(() => {
  return Math.round((correctCount.value / questions.length) * 100)
})

const starCount = computed(() => {
  const percentage = score.value / (questions.length * 10)
  if (percentage >= 0.9) return 5
  if (percentage >= 0.8) return 4
  if (percentage >= 0.6) return 3
  if (percentage >= 0.4) return 2
  return 1
})

const feedbackText = computed(() => {
  if (accuracy.value >= 90) return '太棒了！你是学习小能手！🏆'
  if (accuracy.value >= 80) return '很好！继续加油！💪'
  if (accuracy.value >= 60) return '不错！还有进步空间！📚'
  return '再练习一下，你会更棒的！🌟'
})

const startQuiz = () => {
  quizStarted.value = true
}

const selectAnswer = (index) => {
  selectedAnswer.value = index
  showResult.value = true
  
  const isCorrect = index === currentQuestion.correct
  if (isCorrect) {
    score.value += 10
  }
  
  answers.value.push({
    question: currentQuestionIndex.value,
    selected: index,
    correct: isCorrect
  })
}

const nextQuestion = () => {
  if (isLastQuestion.value) {
    quizFinished.value = true
  } else {
    currentQuestionIndex.value++
    selectedAnswer.value = null
    showResult.value = false
  }
}

const restartQuiz = () => {
  quizStarted.value = false
  quizFinished.value = false
  currentQuestionIndex.value = 0
  selectedAnswer.value = null
  showResult.value = false
  score.value = 0
  answers.value = []
}
</script>

<style scoped>
.interactive-quiz {
  padding: 20px;
}

h2 {
  color: #667eea;
  text-align: center;
  margin-bottom: 30px;
  font-size: 1.8rem;
}

.start-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.start-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 50px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}

.start-card h3 {
  font-size: 1.8rem;
  margin-bottom: 20px;
  color: white;
}

.start-card p {
  font-size: 1.2rem;
  margin: 10px 0;
  opacity: 0.9;
}

.start-btn {
  margin-top: 30px;
  padding: 15px 40px;
  background: #ffd93d;
  color: #333;
  border: none;
  border-radius: 30px;
  font-size: 1.2rem;
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.3s ease;
}

.start-btn:hover {
  transform: scale(1.05);
}

.quiz-container {
  max-width: 600px;
  margin: 0 auto;
}

.progress-bar {
  height: 10px;
  background: #dfe6e9;
  border-radius: 5px;
  overflow: hidden;
  margin-bottom: 20px;
}

.progress {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.question-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  color: #636e72;
  font-size: 1.1rem;
}

.score {
  color: #667eea;
  font-weight: bold;
}

.question-card {
  background: white;
  padding: 30px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
}

.question-card h3 {
  text-align: center;
  margin-bottom: 25px;
  color: #2d3436;
  font-size: 1.3rem;
}

.big-char, .big-pinyin {
  font-size: 5rem;
  text-align: center;
  color: #667eea;
  margin: 20px 0;
}

.poem-line {
  font-size: 1.5rem;
  text-align: center;
  color: #d63031;
  margin: 20px 0;
  font-style: italic;
}

.options {
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 30px;
}

.option-btn {
  padding: 15px 25px;
  background: #f8f9fa;
  border: 2px solid #dfe6e9;
  border-radius: 10px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.option-btn:hover:not(:disabled) {
  background: #e9ecef;
  transform: translateX(5px);
}

.option-btn.selected {
  border-color: #667eea;
  background: #e7e9ff;
}

.option-btn.correct {
  background: #00b894;
  color: white;
  border-color: #00b894;
}

.option-btn.wrong {
  background: #ff7675;
  color: white;
  border-color: #ff7675;
}

.result-feedback {
  text-align: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 2px dashed #dfe6e9;
}

.correct-text {
  color: #00b894;
  font-size: 1.3rem;
  margin-bottom: 15px;
}

.wrong-text {
  color: #ff7675;
  font-size: 1.1rem;
  margin-bottom: 15px;
}

.next-btn {
  padding: 12px 30px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 1.1rem;
  cursor: pointer;
  font-family: inherit;
}

.result-screen {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.result-card {
  background: white;
  padding: 50px;
  border-radius: 20px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0,0,0,0.1);
  max-width: 500px;
  width: 100%;
}

.result-card h3 {
  color: #667eea;
  font-size: 1.8rem;
  margin-bottom: 20px;
}

.final-score {
  margin: 20px 0;
}

.score-number {
  font-size: 4rem;
  color: #667eea;
  font-weight: bold;
}

.score-total {
  font-size: 2rem;
  color: #636e72;
}

.stars {
  margin: 20px 0;
}

.star {
  font-size: 2.5rem;
  margin: 0 5px;
  animation: twinkle 1s ease infinite;
}

@keyframes twinkle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.feedback-text {
  font-size: 1.3rem;
  color: #2d3436;
  margin: 20px 0;
}

.stats {
  display: flex;
  justify-content: space-around;
  margin: 30px 0;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 15px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.stat-label {
  color: #636e72;
  font-size: 0.9rem;
}

.stat-value {
  color: #667eea;
  font-size: 1.5rem;
  font-weight: bold;
}

.restart-btn {
  padding: 15px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 1.2rem;
  cursor: pointer;
  font-family: inherit;
  transition: transform 0.3s ease;
}

.restart-btn:hover {
  transform: scale(1.05);
}
</style>
