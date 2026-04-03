<template>
  <div class="review-system">
    <h2>📝 错题复习</h2>
    <p class="subtitle">智能复习系统，帮助巩固薄弱知识点</p>

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

    <!-- 错题复习内容 -->
    <div v-else class="review-content">
      <button class="back-btn" @click="selectedStudent = null">← 返回</button>

      <div v-if="loading" class="loading">加载中...</div>
      <div v-else>
        <!-- 统计概览 -->
        <div class="stats-overview">
          <div class="stat-box">
            <div class="stat-value">{{ mistakeStats.total }}</div>
            <div class="stat-label">总错题数</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">{{ mistakeStats.unmastered }}</div>
            <div class="stat-label">待掌握</div>
          </div>
          <div class="stat-box">
            <div class="stat-value">{{ mistakeStats.mastered }}</div>
            <div class="stat-label">已掌握</div>
          </div>
        </div>

        <!-- 分类筛选 -->
        <div class="category-filter">
          <button
            v-for="cat in categories"
            :key="cat.id"
            :class="['filter-btn', { active: currentCategory === cat.id }]"
            @click="currentCategory = cat.id; loadMistakes()"
          >
            {{ cat.icon }} {{ cat.name }}
          </button>
          <button
            :class="['filter-btn', { active: showMastered }]"
            @click="showMastered = !showMastered; loadMistakes()"
          >
            {{ showMastered ? '✓ 显示已掌握' : '✗ 隐藏已掌握' }}
          </button>
        </div>

        <!-- 错题列表 -->
        <div v-if="mistakes.length === 0" class="empty">
          <div class="empty-icon">🎉</div>
          <p>{{ showMastered ? '暂无错题记录' : '太棒了！没有待复习的错题' }}</p>
        </div>
        <div v-else class="mistakes-list">
          <div v-for="mistake in mistakes" :key="mistake.id" class="mistake-card">
            <div class="mistake-header">
              <h3>{{ mistake.topicTitle }}</h3>
              <span :class="['status-badge', mistake.mastered ? 'mastered' : 'unmastered']">
                {{ mistake.mastered ? '✓ 已掌握' : '⚠️ 待复习' }}
              </span>
            </div>

            <div class="mistake-details">
              <div class="detail-row">
                <span class="label">题目ID:</span>
                <span class="value">{{ mistake.question_id }}</span>
              </div>
              <div class="detail-row">
                <span class="label">错误答案:</span>
                <span class="value error">{{ mistake.wrong_answer || '未记录' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">正确答案:</span>
                <span class="value correct">{{ mistake.correct_answer || '未记录' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">重试次数:</span>
                <span class="value">{{ mistake.retry_count }} 次</span>
              </div>
              <div class="detail-row">
                <span class="label">首次错误:</span>
                <span class="value">{{ formatDate(mistake.created_at) }}</span>
              </div>
              <div v-if="mistake.last_retry_at" class="detail-row">
                <span class="label">最后复习:</span>
                <span class="value">{{ formatDate(mistake.last_retry_at) }}</span>
              </div>
            </div>

            <div class="mistake-actions">
              <button
                v-if="!mistake.mastered"
                class="btn btn-primary"
                @click="markAsMastered(mistake)"
              >
                ✓ 标记为已掌握
              </button>
              <button
                v-else
                class="btn btn-secondary"
                @click="markAsUnmastered(mistake)"
              >
                ✗ 标记为未掌握
              </button>
              <button class="btn btn-practice" @click="practiceAgain(mistake)">
                🔄 再次练习
              </button>
            </div>

            <!-- 复习建议 -->
            <div v-if="!mistake.mastered" class="review-suggestion">
              <strong>复习建议:</strong>
              {{ getReviewSuggestion(mistake) }}
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="pagination.totalPages > 1" class="pagination">
          <button :disabled="pagination.page === 1" @click="changePage(pagination.page - 1)">
            ← 上一页
          </button>
          <span>第 {{ pagination.page }} / {{ pagination.totalPages }} 页</span>
          <button :disabled="pagination.page === pagination.totalPages" @click="changePage(pagination.page + 1)">
            下一页 →
          </button>
        </div>

        <!-- 智能复习模式 -->
        <div class="smart-review-section">
          <h3>🧠 智能复习模式</h3>
          <p>根据遗忘曲线，为你推荐最需要复习的错题</p>
          <button class="btn btn-large btn-smart" @click="startSmartReview">
            开始智能复习 ({{ recommendedCount }} 题)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const categories = [
  { id: 'all', name: '全部', icon: '📚' },
  { id: 'character', name: '汉字', icon: '✍️' },
  { id: 'pinyin', name: '拼音', icon: '🔤' },
  { id: 'math', name: '数学', icon: '🔢' },
  { id: 'story', name: '故事', icon: '📖' },
  { id: 'scratch', name: 'Scratch', icon: '🎨' }
];

const students = ref([]);
const selectedStudent = ref(null);
const loading = ref(false);
const mistakes = ref([]);
const mistakeStats = ref({ total: 0, unmastered: 0, mastered: 0 });
const currentCategory = ref('all');
const showMastered = ref(false);
const pagination = ref({ page: 1, limit: 10, total: 0, totalPages: 0 });

const recommendedCount = computed(() => {
  return mistakes.value.filter(m => !m.mastered && shouldReview(m)).length;
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
  await loadMistakes();
  await loadStats();
}

// 加载错题列表
async function loadMistakes() {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      studentId: selectedStudent.value,
      page: pagination.value.page,
      limit: pagination.value.limit
    });

    if (currentCategory.value !== 'all') {
      // 需要先获取该类别的topic IDs
      const topicsResponse = await fetch(`/api/v1/content/topics?category=${currentCategory.value}&limit=1000`);
      const topicsResult = await topicsResponse.json();
      if (topicsResult.success && topicsResult.data.topics.length > 0) {
        // 这里简化处理，实际应该在后端支持按category筛选
      }
    }

    if (!showMastered.value) {
      params.append('mastered', 'false');
    }

    const response = await fetch(`/api/v1/learning/mistakes?${params}`, {
      credentials: 'include'
    });
    const result = await response.json();

    if (result.success) {
      mistakes.value = result.data.mistakes;
      pagination.value = result.data.pagination;
    } else {
      alert('加载失败: ' + result.error.message);
    }
  } catch (err) {
    alert('加载失败: ' + err.message);
  } finally {
    loading.value = false;
  }
}

// 加载统计数据
async function loadStats() {
  try {
    const response = await fetch(`/api/v1/learning/mistakes?studentId=${selectedStudent.value}&limit=1000`, {
      credentials: 'include'
    });
    const result = await response.json();

    if (result.success) {
      const all = result.data.mistakes;
      mistakeStats.value = {
        total: all.length,
        unmastered: all.filter(m => !m.mastered).length,
        mastered: all.filter(m => m.mastered).length
      };
    }
  } catch (err) {
    console.error('加载统计失败:', err);
  }
}

// 标记为已掌握
async function markAsMastered(mistake) {
  try {
    const response = await fetch(`/api/v1/learning/mistakes/${mistake.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ mastered: true })
    });

    const result = await response.json();

    if (result.success) {
      await loadMistakes();
      await loadStats();
    } else {
      alert('操作失败: ' + result.error.message);
    }
  } catch (err) {
    alert('操作失败: ' + err.message);
  }
}

// 标记为未掌握
async function markAsUnmastered(mistake) {
  try {
    const response = await fetch(`/api/v1/learning/mistakes/${mistake.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ mastered: false })
    });

    const result = await response.json();

    if (result.success) {
      await loadMistakes();
      await loadStats();
    } else {
      alert('操作失败: ' + result.error.message);
    }
  } catch (err) {
    alert('操作失败: ' + err.message);
  }
}

// 再次练习
function practiceAgain(mistake) {
  alert(`跳转到练习页面: ${mistake.topicTitle}\n题目ID: ${mistake.question_id}\n\n(实际应用中会跳转到对应的学习模块)`);
}

// 开始智能复习
function startSmartReview() {
  const toReview = mistakes.value.filter(m => !m.mastered && shouldReview(m));
  if (toReview.length === 0) {
    alert('暂无需要复习的错题！');
    return;
  }
  alert(`智能复习模式\n推荐复习 ${toReview.length} 道题\n\n(实际应用中会进入专门的复习练习模式)`);
}

// 判断是否应该复习（基于遗忘曲线）
function shouldReview(mistake) {
  if (mistake.mastered) return false;

  const now = new Date();
  const lastRetry = mistake.last_retry_at ? new Date(mistake.last_retry_at) : new Date(mistake.created_at);
  const daysSinceLastRetry = Math.floor((now - lastRetry) / (1000 * 60 * 60 * 24));

  // 简化的间隔重复算法
  // 重试次数越多，间隔越长
  const intervals = [1, 3, 7, 14, 30]; // 天数
  const targetInterval = intervals[Math.min(mistake.retry_count, intervals.length - 1)];

  return daysSinceLastRetry >= targetInterval;
}

// 获取复习建议
function getReviewSuggestion(mistake) {
  const now = new Date();
  const lastRetry = mistake.last_retry_at ? new Date(mistake.last_retry_at) : new Date(mistake.created_at);
  const daysSinceLastRetry = Math.floor((now - lastRetry) / (1000 * 60 * 60 * 24));

  const intervals = [1, 3, 7, 14, 30];
  const targetInterval = intervals[Math.min(mistake.retry_count, intervals.length - 1)];

  if (daysSinceLastRetry >= targetInterval) {
    return '⏰ 建议现在复习！根据遗忘曲线，这是最佳复习时机。';
  } else {
    const daysLeft = targetInterval - daysSinceLastRetry;
    return `⏳ 建议 ${daysLeft} 天后复习，让记忆更牢固。`;
  }
}

// 格式化日期
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('zh-CN');
}

// 翻页
function changePage(page) {
  pagination.value.page = page;
  loadMistakes();
}

onMounted(() => {
  loadStudents();
});
</script>

<style scoped>
.review-system {
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

.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-box {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 30px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

.stat-value {
  font-size: 3rem;
  font-weight: bold;
  margin-bottom: 10px;
}

.stat-label {
  font-size: 1.1rem;
  opacity: 0.9;
}

.category-filter {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 10px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
}

.filter-btn:hover {
  border-color: #667eea;
}

.filter-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.empty {
  text-align: center;
  padding: 60px 20px;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 20px;
}

.empty p {
  color: #999;
  font-size: 1.2rem;
}

.mistakes-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.mistake-card {
  background: white;
  border: 2px solid #e0e0e0;
  border-radius: 15px;
  padding: 25px;
  transition: all 0.3s;
}

.mistake-card:hover {
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}

.mistake-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 2px solid #f0f0f0;
}

.mistake-header h3 {
  margin: 0;
  color: #333;
}

.status-badge {
  padding: 6px 15px;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: bold;
}

.status-badge.mastered {
  background: #c8e6c9;
  color: #2e7d32;
}

.status-badge.unmastered {
  background: #ffccbc;
  color: #d84315;
}

.mistake-details {
  margin-bottom: 20px;
}

.detail-row {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f5f5f5;
}

.detail-row .label {
  font-weight: bold;
  color: #666;
  min-width: 100px;
}

.detail-row .value {
  color: #333;
}

.detail-row .value.error {
  color: #f44336;
  text-decoration: line-through;
}

.detail-row .value.correct {
  color: #4caf50;
  font-weight: bold;
}

.mistake-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.btn-primary {
  background: #4caf50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-secondary {
  background: #ff9800;
  color: white;
}

.btn-secondary:hover {
  background: #f57c00;
}

.btn-practice {
  background: #2196f3;
  color: white;
}

.btn-practice:hover {
  background: #1976d2;
}

.review-suggestion {
  background: #fff3e0;
  padding: 15px;
  border-radius: 8px;
  border-left: 4px solid #ff9800;
  font-size: 0.95rem;
  color: #e65100;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin: 30px 0;
}

.pagination button {
  padding: 10px 20px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
}

.pagination button:hover:not(:disabled) {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.smart-review-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 40px;
  border-radius: 20px;
  text-align: center;
  margin-top: 40px;
}

.smart-review-section h3 {
  margin-top: 0;
  font-size: 1.8rem;
}

.smart-review-section p {
  margin-bottom: 25px;
  opacity: 0.9;
}

.btn-large {
  padding: 15px 40px;
  font-size: 1.2rem;
}

.btn-smart {
  background: #ffd93d;
  color: #333;
  font-weight: bold;
}

.btn-smart:hover {
  background: #ffc107;
  transform: scale(1.05);
}
</style>
