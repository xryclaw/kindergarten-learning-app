<template>
  <div class="gamification">
    <h2>🎮 学习成就</h2>
    <p class="subtitle">查看你的学习进度和奖励</p>

    <!-- 学生选择 -->
    <div v-if="!selectedStudent" class="student-selector">
      <h3>选择学生</h3>
      <div class="student-list">
        <button
          v-for="student in students"
          :key="student.id"
          class="student-card"
          @click="selectStudent(student.id)"
        >
          <div class="avatar">{{ student.avatar || '👦' }}</div>
          <div class="name">{{ student.name }}</div>
        </button>
      </div>
    </div>

    <!-- 游戏化数据展示 -->
    <div v-else class="gamification-content">
      <button class="back-btn" @click="selectedStudent = null">← 返回</button>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="gamificationData">
        <!-- 统计卡片 -->
        <div class="stats-grid">
          <div class="stat-card points">
            <div class="icon">💎</div>
            <div class="value">{{ gamificationData.totalPoints }}</div>
            <div class="label">总积分</div>
          </div>

          <div class="stat-card level">
            <div class="icon">⭐</div>
            <div class="value">Lv.{{ gamificationData.level }}</div>
            <div class="label">等级</div>
          </div>

          <div class="stat-card streak">
            <div class="icon">🔥</div>
            <div class="value">{{ gamificationData.currentStreak }}</div>
            <div class="label">连续天数</div>
          </div>

          <div class="stat-card longest">
            <div class="icon">🏆</div>
            <div class="value">{{ gamificationData.longestStreak }}</div>
            <div class="label">最长连续</div>
          </div>
        </div>

        <!-- 进度条 -->
        <div class="progress-section">
          <h3>升级进度</h3>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: levelProgress + '%' }"></div>
          </div>
          <p class="progress-text">
            {{ gamificationData.totalPoints % 100 }} / 100 积分
            (距离 Lv.{{ gamificationData.level + 1 }} 还需 {{ 100 - (gamificationData.totalPoints % 100) }} 积分)
          </p>
        </div>

        <!-- 已获得的徽章 -->
        <div class="badges-section">
          <h3>🏅 已获得徽章 ({{ gamificationData.badges.length }})</h3>
          <div v-if="gamificationData.badges.length === 0" class="empty">
            还没有徽章，继续努力学习吧！
          </div>
          <div v-else class="badges-grid">
            <div v-for="badge in gamificationData.badges" :key="badge.id" class="badge earned">
              <div class="badge-icon">{{ badge.icon }}</div>
              <div class="badge-name">{{ badge.name }}</div>
              <div class="badge-desc">{{ badge.description }}</div>
              <div class="badge-date">{{ formatDate(badge.earned_at) }}</div>
            </div>
          </div>
        </div>

        <!-- 可获得的徽章 -->
        <div class="badges-section">
          <h3>🎯 待解锁徽章</h3>
          <div v-if="gamificationData.availableBadges.length === 0" class="empty">
            恭喜！你已经获得所有徽章了！
          </div>
          <div v-else class="badges-grid">
            <div v-for="badge in gamificationData.availableBadges" :key="badge.id" class="badge locked">
              <div class="badge-icon grayscale">{{ badge.icon }}</div>
              <div class="badge-name">{{ badge.name }}</div>
              <div class="badge-desc">{{ badge.description }}</div>
              <div class="badge-requirement">
                需要: {{ getRequirementText(badge) }}
              </div>
            </div>
          </div>
        </div>

        <!-- 排行榜 -->
        <div class="leaderboard-section">
          <h3>🏆 排行榜</h3>
          <div class="leaderboard-tabs">
            <button
              v-for="type in leaderboardTypes"
              :key="type.id"
              :class="['tab-btn', { active: leaderboardType === type.id }]"
              @click="leaderboardType = type.id; loadLeaderboard()"
            >
              {{ type.name }}
            </button>
          </div>
          <div v-if="leaderboard.length === 0" class="empty">暂无数据</div>
          <div v-else class="leaderboard-list">
            <div v-for="(item, index) in leaderboard" :key="item.id" class="leaderboard-item">
              <div class="rank">
                <span v-if="index === 0" class="medal gold">🥇</span>
                <span v-else-if="index === 1" class="medal silver">🥈</span>
                <span v-else-if="index === 2" class="medal bronze">🥉</span>
                <span v-else class="rank-number">{{ index + 1 }}</span>
              </div>
              <div class="avatar">{{ item.avatar || '👦' }}</div>
              <div class="info">
                <div class="name">{{ item.nickname || item.name }}</div>
                <div class="value">
                  <span v-if="leaderboardType === 'points'">{{ item.total_points }} 积分</span>
                  <span v-else-if="leaderboardType === 'streak'">{{ item.current_streak }} 天连续</span>
                  <span v-else>Lv.{{ item.level }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const students = ref([]);
const selectedStudent = ref(null);
const loading = ref(false);
const gamificationData = ref(null);
const leaderboard = ref([]);
const leaderboardType = ref('points');

const leaderboardTypes = [
  { id: 'points', name: '积分榜' },
  { id: 'streak', name: '连续榜' },
  { id: 'level', name: '等级榜' }
];

const levelProgress = computed(() => {
  if (!gamificationData.value) return 0;
  return (gamificationData.value.totalPoints % 100);
});

// 加载学生列表
async function loadStudents() {
  try {
    const response = await fetch('/api/v1/students', {
      credentials: 'include'
    });
    const result = await response.json();
    if (result.success) {
      students.value = result.data;
    }
  } catch (err) {
    console.error('加载学生列表失败:', err);
  }
}

// 选择学生
async function selectStudent(studentId) {
  selectedStudent.value = studentId;
  await loadGamificationData();
  await loadLeaderboard();
}

// 加载游戏化数据
async function loadGamificationData() {
  loading.value = true;
  try {
    const response = await fetch(`/api/v1/gamification/students/${selectedStudent.value}`, {
      credentials: 'include'
    });
    const result = await response.json();
    if (result.success) {
      gamificationData.value = result.data;
    } else {
      alert('加载失败: ' + result.error.message);
    }
  } catch (err) {
    alert('加载失败: ' + err.message);
  } finally {
    loading.value = false;
  }
}

// 加载排行榜
async function loadLeaderboard() {
  try {
    const response = await fetch(`/api/v1/gamification/leaderboard?type=${leaderboardType.value}&limit=10`, {
      credentials: 'include'
    });
    const result = await response.json();
    if (result.success) {
      leaderboard.value = result.data.leaderboard;
    }
  } catch (err) {
    console.error('加载排行榜失败:', err);
  }
}

// 格式化日期
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN');
}

// 获取徽章要求文本
function getRequirementText(badge) {
  const typeMap = {
    points: '积分',
    streak: '天连续',
    topics: '个学习任务',
    perfect_score: '次满分'
  };
  return `${badge.requirement_value} ${typeMap[badge.requirement_type] || ''}`;
}

onMounted(() => {
  loadStudents();
});
</script>

<style scoped>
.gamification {
  max-width: 1200px;
  margin: 0 auto;
}

h2 {
  color: #667eea;
  margin-bottom: 10px;
}

.subtitle {
  color: #666;
  margin-bottom: 30px;
}

.student-selector {
  text-align: center;
}

.student-list {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-top: 20px;
}

.student-card {
  padding: 30px;
  border: 2px solid #e0e0e0;
  border-radius: 15px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 150px;
}

.student-card:hover {
  border-color: #667eea;
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

.student-card .avatar {
  font-size: 3rem;
  margin-bottom: 10px;
}

.student-card .name {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333;
}

.back-btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  background: #e0e0e0;
  cursor: pointer;
  margin-bottom: 20px;
  font-size: 1rem;
}

.back-btn:hover {
  background: #d0d0d0;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 1.1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

.stat-card.points {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card.level {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card.streak {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.stat-card.longest {
  background: linear-gradient(135deg, #30cfd0 0%, #330867 100%);
}

.stat-card .icon {
  font-size: 3rem;
  margin-bottom: 10px;
}

.stat-card .value {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-card .label {
  font-size: 1rem;
  opacity: 0.9;
}

.progress-section {
  background: #f9f9f9;
  padding: 25px;
  border-radius: 15px;
  margin-bottom: 30px;
}

.progress-section h3 {
  margin-top: 0;
  color: #667eea;
}

.progress-bar {
  height: 30px;
  background: #e0e0e0;
  border-radius: 15px;
  overflow: hidden;
  margin: 15px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.5s ease;
}

.progress-text {
  text-align: center;
  color: #666;
  margin: 0;
}

.badges-section {
  margin-bottom: 30px;
}

.badges-section h3 {
  color: #667eea;
  margin-bottom: 20px;
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.badge {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s;
}

.badge.earned {
  border-color: #ffd93d;
  background: linear-gradient(135deg, #fff9e6 0%, #fffbf0 100%);
}

.badge.earned:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(255, 217, 61, 0.3);
}

.badge.locked {
  opacity: 0.6;
}

.badge-icon {
  font-size: 3rem;
  margin-bottom: 10px;
}

.badge-icon.grayscale {
  filter: grayscale(100%);
}

.badge-name {
  font-size: 1.1rem;
  font-weight: bold;
  color: #333;
  margin-bottom: 5px;
}

.badge-desc {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 5px;
}

.badge-date {
  font-size: 0.8rem;
  color: #999;
}

.badge-requirement {
  font-size: 0.85rem;
  color: #667eea;
  font-weight: bold;
  margin-top: 5px;
}

.leaderboard-section {
  background: #f9f9f9;
  padding: 25px;
  border-radius: 15px;
}

.leaderboard-section h3 {
  margin-top: 0;
  color: #667eea;
}

.leaderboard-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.tab-btn {
  padding: 10px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.tab-btn:hover {
  border-color: #667eea;
}

.tab-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.leaderboard-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.leaderboard-item {
  display: flex;
  align-items: center;
  gap: 15px;
  background: white;
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #e0e0e0;
}

.leaderboard-item .rank {
  font-size: 1.5rem;
  font-weight: bold;
  min-width: 50px;
  text-align: center;
}

.medal {
  font-size: 2rem;
}

.rank-number {
  color: #999;
}

.leaderboard-item .avatar {
  font-size: 2rem;
}

.leaderboard-item .info {
  flex: 1;
}

.leaderboard-item .name {
  font-weight: bold;
  color: #333;
  margin-bottom: 3px;
}

.leaderboard-item .value {
  color: #667eea;
  font-size: 0.9rem;
}

.empty {
  text-align: center;
  padding: 40px;
  color: #999;
}
</style>
