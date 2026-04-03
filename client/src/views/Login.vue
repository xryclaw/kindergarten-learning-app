<template>
  <div class="login-page">
    <div class="login-card">
      <h1>🌟 幼儿园学习乐园</h1>
      <div v-if="!showStudentSelector">
        <h2>登录</h2>
        <form @submit.prevent="handleSubmit">
          <input v-model="username" placeholder="用户名" required>
          <input v-model="password" type="password" placeholder="密码" required>
          <button type="submit">登录</button>
        </form>
        <p v-if="error" class="error">{{ error }}</p>
      </div>
      <div v-else class="student-selector">
        <h2>选择孩子</h2>
        <div class="students">
          <div v-for="student in authStore.students" :key="student.id"
               @click="selectStudent(student)" class="student-card">
            {{ student.name }} ({{ student.age }}岁)
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const showStudentSelector = ref(false)

const handleSubmit = async () => {
  try {
    error.value = ''
    await authStore.login(username.value, password.value)
    if (authStore.students.length > 0) {
      showStudentSelector.value = true
    } else {
      router.push('/')
    }
  } catch (e) {
    error.value = e.message
  }
}

const selectStudent = (student) => {
  authStore.selectStudent(student)
  router.push('/')
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
  min-width: 350px;
}

h1 {
  text-align: center;
  color: #667eea;
  margin-bottom: 30px;
}

h2 {
  text-align: center;
  color: #2d3436;
  margin-bottom: 20px;
}

form {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

input {
  padding: 12px;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  font-family: inherit;
}

button {
  padding: 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  cursor: pointer;
  font-family: inherit;
}

button:hover {
  background: #764ba2;
}

.toggle {
  text-align: center;
  color: #667eea;
  cursor: pointer;
  margin-top: 15px;
}

.error {
  color: #ff7675;
  text-align: center;
  margin-top: 10px;
}

.students {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.student-card {
  padding: 15px;
  background: #f0f0f0;
  border-radius: 10px;
  cursor: pointer;
  text-align: center;
  transition: all 0.3s;
}

.student-card:hover {
  background: #667eea;
  color: white;
}
</style>
