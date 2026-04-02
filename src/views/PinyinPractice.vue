<template>
  <div class="pinyin-practice">
    <h2>🔤 拼音练习</h2>
    
    <div class="section">
      <h3>📚 整体认读音节</h3>
      <div class="pinyin-cards">
        <div 
          v-for="item in wholePinyin" 
          :key="item.pinyin"
          :class="['pinyin-card', { active: selectedPinyin === item.pinyin }]"
          @click="selectPinyin(item)"
        >
          <span class="pinyin-text">{{ item.pinyin }}</span>
          <span class="example">{{ item.example }}</span>
          <div v-if="selectedPinyin === item.pinyin" class="detail">
            <p>四声练习：</p>
            <div class="tones">
              <span v-for="tone in item.tones" :key="tone" class="tone">{{ tone }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="section">
      <h3>🎯 复韵母学习</h3>
      <div class="finals-grid">
        <div 
          v-for="final in compoundFinals" 
          :key="final"
          class="final-card"
          @click="playSound(final)"
        >
          <span class="final-text">{{ final }}</span>
          <span class="sound-icon">🔊</span>
        </div>
      </div>
    </div>

    <div class="section">
      <h3>🎮 拼音配对游戏</h3>
      <div class="matching-game">
        <p class="game-hint">点击选择拼音，然后点击对应的汉字！</p>
        <div class="game-area">
          <div class="pinyin-column">
            <div 
              v-for="item in gameItems" 
              :key="'p-'+item.id"
              :class="['game-card', 'pinyin', { 
                selected: selectedPinyinGame === item.id,
                matched: matchedItems.includes(item.id)
              }]"
              @click="selectPinyinGame(item.id)"
            >
              {{ item.pinyin }}
            </div>
          </div>
          <div class="char-column">
            <div 
              v-for="item in shuffledChars" 
              :key="'c-'+item.id"
              :class="['game-card', 'char', { 
                selected: selectedChar === item.id,
                matched: matchedItems.includes(item.id)
              }]"
              @click="selectChar(item.id)"
            >
              {{ item.char }}
            </div>
          </div>
        </div>
        <div v-if="gameComplete" class="success">
          🎉 太棒了！全部配对成功！
        </div>
        <button v-if="gameComplete" @click="resetGame" class="reset-btn">再玩一次</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const wholePinyin = [
  { pinyin: 'ye', example: '叶子', tones: ['yē', 'yé', 'yě', 'yè'] },
  { pinyin: 'yue', example: '月亮', tones: ['yuē', 'yué', 'yuě', 'yuè'] },
  { pinyin: 'yi', example: '一', tones: ['yī', 'yí', 'yǐ', 'yì'] },
  { pinyin: 'wu', example: '五', tones: ['wū', 'wú', 'wǔ', 'wù'] },
  { pinyin: 'yu', example: '鱼', tones: ['yū', 'yú', 'yǔ', 'yù'] }
]

const compoundFinals = ['üe', 'ie', 'üan', 'ün', 'ing', 'ong', 'eng', 'ang']

const selectedPinyin = ref('')

const selectPinyin = (item) => {
  selectedPinyin.value = selectedPinyin.value === item.pinyin ? '' : item.pinyin
}

const playSound = (final) => {
  // 模拟播放声音
  alert(`播放拼音: ${final}`)
}

// 游戏数据
const gameItems = ref([
  { id: 1, pinyin: 'kě', char: '可' },
  { id: 2, pinyin: 'yè', char: '叶' },
  { id: 3, pinyin: 'dōng', char: '东' },
  { id: 4, pinyin: 'xī', char: '西' },
  { id: 5, pinyin: 'jiāng', char: '江' },
  { id: 6, pinyin: 'nán', char: '南' }
])

const selectedPinyinGame = ref(null)
const selectedChar = ref(null)
const matchedItems = ref([])

const shuffledChars = computed(() => {
  return [...gameItems.value].sort(() => Math.random() - 0.5)
})

const gameComplete = computed(() => {
  return matchedItems.value.length === gameItems.value.length
})

const selectPinyinGame = (id) => {
  if (matchedItems.value.includes(id)) return
  selectedPinyinGame.value = id
  checkMatch()
}

const selectChar = (id) => {
  if (matchedItems.value.includes(id)) return
  selectedChar.value = id
  checkMatch()
}

const checkMatch = () => {
  if (selectedPinyinGame.value && selectedChar.value) {
    if (selectedPinyinGame.value === selectedChar.value) {
      matchedItems.value.push(selectedPinyinGame.value)
    }
    setTimeout(() => {
      selectedPinyinGame.value = null
      selectedChar.value = null
    }, 500)
  }
}

const resetGame = () => {
  matchedItems.value = []
  selectedPinyinGame.value = null
  selectedChar.value = null
}
</script>

<style scoped>
.pinyin-practice {
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

.section {
  margin-bottom: 40px;
}

.pinyin-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
}

.pinyin-card {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
  padding: 20px;
  border-radius: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0,0,0,0.1);
}

.pinyin-card:hover, .pinyin-card.active {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.2);
}

.pinyin-text {
  display: block;
  font-size: 2rem;
  color: #d63031;
  margin-bottom: 10px;
}

.example {
  display: block;
  font-size: 1.2rem;
  color: #636e72;
}

.detail {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 2px dashed #fab1a0;
}

.tones {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

.tone {
  background: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 1.1rem;
  color: #d63031;
}

.finals-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 15px;
}

.final-card {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  padding: 20px;
  border-radius: 15px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.final-card:hover {
  transform: scale(1.05);
}

.final-text {
  font-size: 1.8rem;
  color: #2d3436;
}

.sound-icon {
  font-size: 1.2rem;
}

.matching-game {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 30px;
  border-radius: 20px;
}

.game-hint {
  text-align: center;
  color: #636e72;
  margin-bottom: 20px;
  font-size: 1.1rem;
}

.game-area {
  display: flex;
  justify-content: space-around;
  gap: 50px;
  flex-wrap: wrap;
}

.pinyin-column, .char-column {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.game-card {
  width: 100px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 1.3rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

.game-card.pinyin {
  background: #74b9ff;
  color: white;
}

.game-card.char {
  background: #fd79a8;
  color: white;
  font-size: 1.8rem;
}

.game-card:hover {
  transform: scale(1.05);
}

.game-card.selected {
  box-shadow: 0 0 0 4px #ffd93d;
}

.game-card.matched {
  background: #00b894;
  opacity: 0.6;
  cursor: default;
}

.success {
  text-align: center;
  font-size: 1.5rem;
  color: #00b894;
  margin-top: 30px;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.reset-btn {
  display: block;
  margin: 20px auto 0;
  padding: 12px 30px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 25px;
  font-size: 1.1rem;
  cursor: pointer;
  font-family: inherit;
}

.reset-btn:hover {
  background: #764ba2;
}
</style>
