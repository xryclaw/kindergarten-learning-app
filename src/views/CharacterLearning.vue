<template>
  <div class="character-learning">
    <h2>✍️ 汉字学习 - 《江南》</h2>
    
    <div class="story-section">
      <h3>📖 今日故事</h3>
      <div class="story-card">
        <h4>《江南》</h4>
        <p class="poem">
n          江南可采莲，<br>
          莲叶何田田。<br>
          鱼戏莲叶间。<br>
          鱼戏莲叶东，<br>
          鱼戏莲叶西，<br>
          鱼戏莲叶南，<br>
          鱼戏莲叶北。
        </p>
      </div>
    </div>

    <div class="characters-section">
      <h3>🎯 认字练习</h3>
      <div class="characters-grid">
        <div 
          v-for="char in characters" 
          :key="char.id"
          :class="['character-card', { 'flipped': char.flipped }]"
          @click="flipCard(char)"
        >
          <div class="card-inner">
            <div class="card-front">
              <span class="char">{{ char.char }}</span>
            </div>
            <div class="card-back">
              <p>{{ char.pinyin }}</p>
              <p class="meaning">{{ char.meaning }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="writing-section">
      <h3>✏️ 书写练习</h3>
      <p class="hint">点击田字格，练习书写汉字</p>
      <div class="writing-grid">
        <div 
          v-for="char in writingChars" 
          :key="char"
          class="writing-cell"
          @click="practiceWriting(char)"
        >
          <div class="tian-zi-ge">
            <span class="dotted-char">{{ char }}</span>
            <div class="grid-lines">
              <div class="horizontal"></div>
              <div class="vertical"></div>
              <div class="diagonal-1"></div>
              <div class="diagonal-2"></div>
            </div>
          </div>
          <p class="char-name">{{ getPinyin(char) }}</p>
        </div>
      </div>
    </div>

    <div v-if="showAnimation" class="animation-modal" @click="closeAnimation">
      <div class="animation-content" @click.stop>
        <h3>🎨 书写演示：{{ currentChar }}</h3>
        <div class="stroke-demo">
          <span class="big-char" :style="animationStyle">{{ currentChar }}</span>
        </div>
        <p>跟着写一写！✏️</p>
        <button @click="closeAnimation">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const characters = ref([
  { id: 1, char: '江', pinyin: 'jiāng', meaning: '大河', flipped: false },
  { id: 2, char: '南', pinyin: 'nán', meaning: '南方', flipped: false },
  { id: 3, char: '可', pinyin: 'kě', meaning: '可以', flipped: false },
  { id: 4, char: '采', pinyin: 'cǎi', meaning: '采摘', flipped: false },
  { id: 5, char: '莲', pinyin: 'lián', meaning: '莲花', flipped: false },
  { id: 6, char: '戏', pinyin: 'xì', meaning: '玩耍', flipped: false },
  { id: 7, char: '间', pinyin: 'jiān', meaning: '中间', flipped: false },
  { id: 8, char: '东', pinyin: 'dōng', meaning: '东方', flipped: false },
  { id: 9, char: '北', pinyin: 'běi', meaning: '北方', flipped: false }
])

const writingChars = ['可', '叶', '东', '西']

const showAnimation = ref(false)
const currentChar = ref('')
const animationStyle = ref({})

const flipCard = (char) => {
  char.flipped = !char.flipped
}

const getPinyin = (char) => {
  const map = { '可': 'kě', '叶': 'yè', '东': 'dōng', '西': 'xī' }
  return map[char] || ''
}

const practiceWriting = (char) => {
  currentChar.value = char
  showAnimation.value = true
  animationStyle.value = {
    animation: 'writeChar 2s ease-in-out'
  }
}

const closeAnimation = () => {
  showAnimation.value = false
}
</script>

<style scoped>
.character-learning {
  padding: 20px;
}

h2 {
  color: #667eea;
  text-align: center;
  margin-bottom: 30px;
  font-size: 1.8rem;
}

h3 {
  color: #764ba2;
  margin: 25px 0 15px 0;
  font-size: 1.4rem;
}

.story-section {
  margin-bottom: 30px;
}

.story-card {
  background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%);
  padding: 25px;
  border-radius: 15px;
  text-align: center;
}

.story-card h4 {
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: #d63031;
}

.poem {
  font-size: 1.3rem;
  line-height: 2;
  color: #2d3436;
}

.characters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.character-card {
  height: 150px;
  cursor: pointer;
  perspective: 1000px;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.character-card.flipped .card-inner {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.card-front {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
}

.card-back {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  transform: rotateY(180deg);
}

.char {
  font-size: 3rem;
  color: #2d3436;
}

.card-back p {
  font-size: 1.2rem;
  color: #2d3436;
  margin: 5px 0;
}

.meaning {
  font-size: 1rem !important;
  color: #636e72 !important;
}

.writing-section {
  margin-top: 30px;
}

.hint {
  text-align: center;
  color: #636e72;
  margin-bottom: 20px;
}

.writing-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 30px;
}

.writing-cell {
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.writing-cell:hover {
  transform: scale(1.05);
}

.tian-zi-ge {
  width: 120px;
  height: 120px;
  border: 3px solid #74b9ff;
  margin: 0 auto 10px;
  position: relative;
  background: white;
  border-radius: 10px;
}

.dotted-char {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 4rem;
  color: #ddd;
  z-index: 1;
}

.grid-lines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
}

.horizontal {
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 1px;
  background: #74b9ff;
  transform: translateY(-50%);
}

.vertical {
  position: absolute;
  top: 0;
  left: 50%;
  width: 1px;
  height: 100%;
  background: #74b9ff;
  transform: translateX(-50%);
}

.diagonal-1 {
  position: absolute;
  top: 0;
  left: 0;
  width: 141%;
  height: 1px;
  background: #74b9ff;
  transform-origin: 0 0;
  transform: rotate(45deg);
}

.diagonal-2 {
  position: absolute;
  top: 0;
  right: 0;
  width: 141%;
  height: 1px;
  background: #74b9ff;
  transform-origin: 100% 0;
  transform: rotate(-45deg);
}

.char-name {
  font-size: 1.2rem;
  color: #636e72;
}

.animation-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.animation-content {
  background: white;
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  max-width: 400px;
}

.stroke-demo {
  margin: 30px 0;
}

.big-char {
  font-size: 8rem;
  color: #667eea;
  display: inline-block;
}

@keyframes writeChar {
  0% { opacity: 0; transform: scale(0.5); }
  50% { opacity: 1; transform: scale(1.1); }
  100% { opacity: 1; transform: scale(1); }
}

button {
  padding: 12px 30px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 1.1rem;
  cursor: pointer;
  font-family: inherit;
}

button:hover {
  background: #764ba2;
}
</style>
