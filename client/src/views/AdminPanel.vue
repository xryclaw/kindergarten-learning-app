<template>
  <div class="admin-panel">
    <h2>📋 内容管理后台</h2>
    <p class="subtitle">管理学习内容和知识点</p>

    <!-- 分类选择 -->
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat.id"
        :class="['category-btn', { active: currentCategory === cat.id }]"
        @click="currentCategory = cat.id; loadTopics()"
      >
        {{ cat.icon }} {{ cat.name }}
      </button>
    </div>

    <!-- 操作按钮 -->
    <div class="actions">
      <button class="btn btn-primary" @click="showCreateModal = true">
        ➕ 新建知识点
      </button>
      <button class="btn btn-secondary" @click="showImportModal = true">
        📥 批量导入
      </button>
    </div>

    <!-- 知识点列表 -->
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="topics.length === 0" class="empty">
      暂无内容，点击"新建知识点"开始添加
    </div>
    <div v-else class="topics-list">
      <div v-for="topic in topics" :key="topic.id" class="topic-card">
        <div class="topic-header">
          <h3>{{ topic.title }}</h3>
          <span :class="['difficulty-badge', `level-${topic.difficulty}`]">
            难度 {{ topic.difficulty }}
          </span>
        </div>
        <div class="topic-meta">
          <span>ID: {{ topic.id }}</span>
          <span>排序: {{ topic.order_index }}</span>
          <span :class="['status', topic.is_active ? 'active' : 'inactive']">
            {{ topic.is_active ? '✓ 启用' : '✗ 禁用' }}
          </span>
        </div>
        <div class="topic-actions">
          <button class="btn-small btn-edit" @click="editTopic(topic)">✏️ 编辑</button>
          <button class="btn-small btn-toggle" @click="toggleActive(topic)">
            {{ topic.is_active ? '禁用' : '启用' }}
          </button>
          <button class="btn-small btn-delete" @click="deleteTopic(topic)">🗑️ 删除</button>
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

    <!-- 创建/编辑模态框 -->
    <div v-if="showCreateModal || showEditModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal">
        <h3>{{ showEditModal ? '编辑知识点' : '新建知识点' }}</h3>
        <form @submit.prevent="submitTopic">
          <div class="form-group">
            <label>标题 *</label>
            <input v-model="form.title" type="text" required placeholder="例如：《江南》识字" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>难度 *</label>
              <select v-model.number="form.difficulty" required>
                <option :value="1">1 - 简单</option>
                <option :value="2">2 - 较易</option>
                <option :value="3">3 - 中等</option>
                <option :value="4">4 - 较难</option>
                <option :value="5">5 - 困难</option>
              </select>
            </div>
            <div class="form-group">
              <label>排序</label>
              <input v-model.number="form.orderIndex" type="number" min="0" />
            </div>
            <div class="form-group">
              <label>状态</label>
              <label class="checkbox">
                <input v-model="form.isActive" type="checkbox" />
                启用
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>内容 (JSON) *</label>
            <textarea
              v-model="form.contentJson"
              rows="10"
              required
              placeholder='{"type":"character","characters":[...]}'
            ></textarea>
            <small>请输入有效的JSON格式</small>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="closeModals">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? '提交中...' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 批量导入模态框 -->
    <div v-if="showImportModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal">
        <h3>📥 批量导入知识点</h3>
        <form @submit.prevent="submitImport">
          <div class="form-group">
            <label>JSON数据 *</label>
            <textarea
              v-model="importJson"
              rows="15"
              required
              placeholder='{"topics": [{"category":"character","title":"...","content":{...}}, ...]}'
            ></textarea>
            <small>格式：{"topics": [...]}</small>
          </div>

          <div class="modal-actions">
            <button type="button" class="btn btn-secondary" @click="closeModals">取消</button>
            <button type="submit" class="btn btn-primary" :disabled="submitting">
              {{ submitting ? '导入中...' : '开始导入' }}
            </button>
          </div>
        </form>

        <div v-if="importResult" class="import-result">
          <h4>导入结果</h4>
          <p>✓ 成功: {{ importResult.imported }} 条</p>
          <p v-if="importResult.failed > 0">✗ 失败: {{ importResult.failed }} 条</p>
          <div v-if="importResult.errors.length > 0" class="errors">
            <p v-for="(err, idx) in importResult.errors" :key="idx">
              第 {{ err.index + 1 }} 条: {{ err.error }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const categories = [
  { id: 'character', name: '汉字学习', icon: '✍️' },
  { id: 'pinyin', name: '拼音练习', icon: '🔤' },
  { id: 'math', name: '数学练习', icon: '🔢' },
  { id: 'story', name: '故事阅读', icon: '📖' },
  { id: 'scratch', name: 'Scratch编程', icon: '🎨' }
];

const currentCategory = ref('character');
const topics = ref([]);
const loading = ref(false);
const pagination = ref({ page: 1, limit: 20, total: 0, totalPages: 0 });

const showCreateModal = ref(false);
const showEditModal = ref(false);
const showImportModal = ref(false);
const submitting = ref(false);

const form = ref({
  id: null,
  title: '',
  contentJson: '',
  difficulty: 1,
  orderIndex: 0,
  isActive: true
});

const importJson = ref('');
const importResult = ref(null);

// 加载知识点列表
async function loadTopics() {
  loading.value = true;
  try {
    const params = new URLSearchParams({
      category: currentCategory.value,
      page: pagination.value.page,
      limit: pagination.value.limit
    });

    const response = await fetch(`/api/v1/content/topics?${params}`);
    const result = await response.json();

    if (result.success) {
      topics.value = result.data.topics;
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

// 编辑知识点
async function editTopic(topic) {
  try {
    const response = await fetch(`/api/v1/content/topics/${topic.id}`);
    const result = await response.json();

    if (result.success) {
      form.value = {
        id: result.data.id,
        title: result.data.title,
        contentJson: JSON.stringify(result.data.content, null, 2),
        difficulty: result.data.difficulty,
        orderIndex: result.data.order_index,
        isActive: result.data.is_active
      };
      showEditModal.value = true;
    }
  } catch (err) {
    alert('加载失败: ' + err.message);
  }
}

// 提交知识点
async function submitTopic() {
  submitting.value = true;
  try {
    // 验证JSON
    let content;
    try {
      content = JSON.parse(form.value.contentJson);
    } catch (err) {
      alert('内容JSON格式错误');
      return;
    }

    const data = {
      category: currentCategory.value,
      title: form.value.title,
      content,
      difficulty: form.value.difficulty,
      orderIndex: form.value.orderIndex,
      isActive: form.value.isActive
    };

    const url = showEditModal.value
      ? `/api/v1/content/topics/${form.value.id}`
      : '/api/v1/content/topics';
    const method = showEditModal.value ? 'PUT' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      alert(result.message);
      closeModals();
      loadTopics();
    } else {
      alert('操作失败: ' + result.error.message);
    }
  } catch (err) {
    alert('操作失败: ' + err.message);
  } finally {
    submitting.value = false;
  }
}

// 切换启用状态
async function toggleActive(topic) {
  try {
    const response = await fetch(`/api/v1/content/topics/${topic.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isActive: !topic.is_active })
    });

    const result = await response.json();

    if (result.success) {
      loadTopics();
    } else {
      alert('操作失败: ' + result.error.message);
    }
  } catch (err) {
    alert('操作失败: ' + err.message);
  }
}

// 删除知识点
async function deleteTopic(topic) {
  if (!confirm(`确定要删除"${topic.title}"吗？`)) return;

  try {
    const response = await fetch(`/api/v1/content/topics/${topic.id}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    const result = await response.json();

    if (result.success) {
      alert('删除成功');
      loadTopics();
    } else {
      alert('删除失败: ' + result.error.message);
    }
  } catch (err) {
    alert('删除失败: ' + err.message);
  }
}

// 批量导入
async function submitImport() {
  submitting.value = true;
  importResult.value = null;

  try {
    const data = JSON.parse(importJson.value);

    if (!data.topics || !Array.isArray(data.topics)) {
      alert('格式错误：需要包含topics数组');
      return;
    }

    const response = await fetch('/api/v1/content/topics/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      importResult.value = result.data;
      loadTopics();
    } else {
      alert('导入失败: ' + result.error.message);
    }
  } catch (err) {
    alert('导入失败: ' + err.message);
  } finally {
    submitting.value = false;
  }
}

// 关闭模态框
function closeModals() {
  showCreateModal.value = false;
  showEditModal.value = false;
  showImportModal.value = false;
  form.value = {
    id: null,
    title: '',
    contentJson: '',
    difficulty: 1,
    orderIndex: 0,
    isActive: true
  };
  importJson.value = '';
  importResult.value = null;
}

// 翻页
function changePage(page) {
  pagination.value.page = page;
  loadTopics();
}

onMounted(() => {
  loadTopics();
});
</script>

<style scoped>
.admin-panel {
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

.category-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.category-btn {
  padding: 10px 20px;
  border: 2px solid #e0e0e0;
  border-radius: 25px;
  background: white;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 1rem;
}

.category-btn:hover {
  border-color: #667eea;
}

.category-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

.actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5568d3;
}

.btn-secondary {
  background: #e0e0e0;
  color: #333;
}

.btn-secondary:hover {
  background: #d0d0d0;
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #999;
  font-size: 1.1rem;
}

.topics-list {
  display: grid;
  gap: 15px;
}

.topic-card {
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  padding: 20px;
  transition: all 0.3s;
}

.topic-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.topic-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.topic-header h3 {
  margin: 0;
  color: #333;
}

.difficulty-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: bold;
}

.level-1 { background: #c8e6c9; color: #2e7d32; }
.level-2 { background: #fff9c4; color: #f57f17; }
.level-3 { background: #ffcc80; color: #e65100; }
.level-4 { background: #ffab91; color: #bf360c; }
.level-5 { background: #ef9a9a; color: #c62828; }

.topic-meta {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
  font-size: 0.9rem;
  color: #666;
}

.status {
  font-weight: bold;
}

.status.active { color: #4caf50; }
.status.inactive { color: #999; }

.topic-actions {
  display: flex;
  gap: 8px;
}

.btn-small {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s;
}

.btn-edit {
  background: #2196f3;
  color: white;
}

.btn-edit:hover {
  background: #1976d2;
}

.btn-toggle {
  background: #ff9800;
  color: white;
}

.btn-toggle:hover {
  background: #f57c00;
}

.btn-delete {
  background: #f44336;
  color: white;
}

.btn-delete:hover {
  background: #d32f2f;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}

.pagination button {
  padding: 8px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  background: white;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal {
  background: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal h3 {
  margin-top: 0;
  color: #667eea;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #333;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;
  font-family: inherit;
}

.form-group textarea {
  font-family: 'Courier New', monospace;
  resize: vertical;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #999;
  font-size: 0.85rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 15px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: normal;
}

.checkbox input {
  width: auto;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}

.import-result {
  margin-top: 20px;
  padding: 15px;
  background: #f5f5f5;
  border-radius: 8px;
}

.import-result h4 {
  margin-top: 0;
}

.import-result .errors {
  margin-top: 10px;
  padding: 10px;
  background: #ffebee;
  border-radius: 6px;
  max-height: 200px;
  overflow-y: auto;
}

.import-result .errors p {
  margin: 5px 0;
  font-size: 0.9rem;
  color: #c62828;
}
</style>
