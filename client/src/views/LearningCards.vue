<template>
  <div class="learning-cards">
    <h2>🎴 学习卡片</h2>
    
    <div class="filter-tabs">
      <button 
        v-for="filter in filters" 
        :key="filter.id"
        :class="['filter-btn', { active: currentFilter === filter.id }]"
        @click="currentFilter = filter.id"
      >
        {{ filter.icon }} {{ filter.name }}
      </button>
    </div>

    <div class="cards-container">
      <div 
        v-for="card in filteredCards" 
        :key="card.id"
        :class="['flip-card', { flipped: card.flipped }]"
        @click="flipCard(card)"
      >
        <div class="flip-card-inner">
          <div class="flip-card-front" :style="{ background: card.color }">
            <span class="card-icon">{{ card.icon }}</span>
            <span class="card-content">{{ card.front }}</span>
            <span class="card-hint">点击查看背面</span>
          </div>
          
          <div class="flip-card-back" :style="{ background: card.backColor }">
            <span class="card-content">{{ card.back }}</span>
            <span v-if="card.extra" class="card-extra">{{ card.extra }}</span>
            <span class="card-hint">点击返回</span>
          </div>
        </div>
      </div>
    </div>

    <div class="memory-game-section">
      <h3>🧠 记忆翻牌游戏</h3>
      <p class="game-desc">找到相同的卡片配对！</p>
      
      <div class="memory-grid">
        <div 
          v-for="(card, index) in memoryCards" 
          :key="index"
          :class="['memory-card', { 
            flipped: card.flipped || card.matched,
            matched: card.matched 
          }]"
          @click="flipMemoryCard(index)"
        >
          <div class="memory-card-inner">
            <div class="memory-card-front">
              <span>🎴</span>
            </div>
            <div class="memory-card-back">
              <span>{{ card.content }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="memoryComplete" class="memory-success">
        🎉 恭喜！你完成了所有配对！
        <button @click="resetMemoryGame" class="reset-btn">再玩一次</button>
      </div>
      
      <div class="memory-stats">
        <span>翻牌次数: {{ flipCount }}</span>
        <span>配对数: {{ matchedPairs }} / {{ memoryCards.length / 2 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const currentFilter = ref('all')

const filters = [
  { id: 'all', name: '全部', icon: '📚' },
  { id: 'character', name: '汉字', icon: '✍️' },
  { id: 'pinyin', name: '拼音', icon: '🔤' },
  { id: 'poem', name: '古诗', icon: '📖' }
]

const cards = ref([
  // 汉字卡片
  { id: 1, type: 'character', icon: '✍️', front: '江', back: 'jiāng', extra: '大河的意思', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', backColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', flipped: false },
  { id: 2, type: 'character', icon: '✍️', front: '南', back: 'nán', extra: '方向，南方', color: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', backColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', flipped: false },
  { id: 3, type: 'character', icon: '✍️', front: '可', back: 'kě', extra: '可以、可能', color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', backColor: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', flipped: false },
  { id: 4, type: 'character', icon: '✍️', front: '叶', back: 'yè', extra: '树叶、叶子', color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', backColor: 'linear-gradient(135deg, #ff8a80 0%, #ffab91 100%)', flipped: false },
  { id: 5, type: 'character', icon: '✍️', front: '东', back: 'dōng', extra: '方向，东方', color: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', backColor: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', flipped: false },
  { id: 6, type: 'character', icon: '✍️', front: '西', back: 'xī', extra: '方向，西方', color: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', backColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', flipped: false },
  
  // 拼音卡片
  { id: 7, type: 'pinyin', icon: '🔤', front: 'ye', back: '叶', extra: '整体认读音节', color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', backColor: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', flipped: false },
  { id: 8, type: 'pinyin', icon: '🔤', front: 'yue', back: '月', extra: '整体认读音节', color: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', backColor: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', flipped: false },
  { id: 9, type: 'pinyin', icon: '🔤', front: 'üe', back: '复韵母', extra: '如：月(yue)', color: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', backColor: 'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', flipped: false },
  
  // 古诗卡片
  { id: 10, type: 'poem', icon: '📖', front: '江南可采莲', back: '莲叶何田田', extra: '《江南》', color: 'linear-gradient(135deg, #ff8a80 0%, #ffab91 100%)', backColor: 'linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%)', flipped: false },
  { id: 11, type: 'poem', icon: '📖', front: '鱼戏莲叶间', back: '鱼戏莲叶东', extra: '《江南》', color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', backColor: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', flipped: false },
  { id: 12, type: 'poem', icon: '📖', front: '鱼戏莲叶西', back: '鱼戏莲叶南', extra: '《江南》', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', backColor: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', flipped: false }
])

const filteredCards = computed(() => {
  if (currentFilter.value === 'all') return cards.value
  return cards.value.filter(card => card.type === currentFilter.value)
})

const flipCard = (card) => {
  card.flipped = !card.flipped
}

// 记忆游戏
const memoryGameData = [
  { content: '江', pair: 1 },
  { content: 'jiāng', pair: 1 },
  { content: '南', pair: 2 },
  { content: 'nán', pair: 2 },
  { content: '可', pair: 3 },
  { content: 'kě', pair: 3 },
  { content: '叶', pair: 4 },
  { content: 'yè', pair: 4 },
  { content: '东', pair: 5 },
  { content: 'dōng', pair: 5 },
  { content: '西', pair: 6 },
  { content: 'xī', pair: 6 }
]

const memoryCards = ref([])
const flippedCards = ref([])
const flipCount = ref(0)
const matchedPairs = ref(0)

const memoryComplete = computed(() => {
  return matchedPairs.value === memoryGameData.length / 2
})

const initMemoryGame = () => {
  const shuffled = [...memoryGameData]
    .sort(() => Math.random() - 0.5)
    .map((item, index) => ({
      ...item,
      id: index,
      flipped: false,
      matched: false
    }))
  memoryCards.value = shuffled
  flippedCards.value = []
  flipCount.value = 0
  matchedPairs.value = 0
}

const flipMemoryCard = (index) => {
  const card = memoryCards.value[index]
  
  if (card.flipped || card.matched || flippedCards.value.length >= 2) return
  
  card.flipped = true
  flippedCards.value.push({ index, pair: card.pair })
  flipCount.value++
  
  if (flippedCards.value.length === 2) {
    const [first, second] = flippedCards.value
    
    if (first.pair === second.pair) {
      setTimeout(() => {
        memoryCards.value[first.index].matched = true
        memoryCards.value[second.index].matched = true
        matchedPairs.value++
        flippedCards.value = []
      }, 500)
    } else {
      setTimeout(() => {
        memoryCards.value[first.index].flipped = false
        memoryCards.value[second.index].flipped = false
        flippedCards.value = []
      }, 1000)
    }
  }
}

const resetMemoryGame = () => {
  initMemoryGame()
}

// 初始化
initMemoryGame()
</script>

<style scoped>
.learning-cards {
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
  margin: 30px 0 15px 0;
  font-size: 1.4rem;
}

.filter-tabs {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 30px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 25px;
  font-size: 1rem;
  cursor: pointer;
  background: #f8f9fa;
  color: #636e72;
  font-family: inherit;
  transition: all 0.3s ease;
}

.filter-btn:hover {
  background: #e9ecef;
}

.filter-btn.active {
  background: #667eea;
  color: white;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 40px;
}

.flip-card {
  height: 180px;
  cursor: pointer;
  perspective: 1000px;
}

.flip-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.flip-card.flipped .flip-card-inner {
  transform: rotateY(180deg);
}

.flip-card-front, .flip-card-back {
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
  padding: 15px;
  color: white;
}

.flip-card-back {
  transform: rotateY(180deg);
}

.card-icon {
  font-size: 2rem;
  margin-bottom: 10px;
}

.card-content {
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
}

.card-extra {
  font-size: 0.9rem;
  margin-top: 10px;
  opacity: 0.9;
  text-align: center;
}

.card-hint {
  font-size: 0.8rem;
  margin-top: 15px;
  opacity: 0.7;
}

.memory-game-section {
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 30px;
  border-radius: 20px;
  margin-top: 30px;
}

.game-desc {
  text-align: center;
  color: #636e72;
  margin-bottom: 20px;
}

.memory-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 15px;
  max-width: 400px;
  margin: 0 auto;
}

.memory-card {
  aspect-ratio: 1;
  cursor: pointer;
  perspective: 1000px;
}

.memory-card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.memory-card.flipped .memory-card-inner,
.memory-card.matched .memory-card-inner {
  transform: rotateY(180deg);
}

.memory-card-front, .memory-card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  font-size: 1.5rem;
}

.memory-card-front {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.memory-card-back {
  background: white;
  color: #667eea;
  transform: rotateY(180deg);
  border: 2px solid #667eea;
}

.memory-card.matched .memory-card-back {
  background: #00b894;
  color: white;
  border-color: #00b894;
}

.memory-success {
  text-align: center;
  margin-top: 30px;
  font-size: 1.3rem;
  color: #00b894;
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

.memory-stats {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-top: 20px;
  color: #636e72;
  font-size: 1.1rem;
}

@media (max-width: 600px) {
  .memory-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
</style>
