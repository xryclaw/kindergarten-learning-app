import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const students = ref([])
  const currentStudent = ref(null)
  const token = ref(null)

  const login = async (username, password) => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
      credentials: 'include'
    })
    if (!res.ok) throw new Error('Login failed')
    const result = await res.json()
    const data = result.data || {}
    user.value = { userId: data.userId, username: data.username }
    token.value = data.token
    if (data.students) {
      students.value = data.students
    }
  }

  const register = async (username, password, email) => {
    const res = await fetch('/api/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email }),
      credentials: 'include'
    })
    if (!res.ok) throw new Error('Registration failed')
    const result = await res.json()
    const data = result.data || {}
    user.value = { userId: data.userId, username: data.username }
    token.value = data.token
  }

  const logout = async () => {
    await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' })
    user.value = null
    students.value = []
    currentStudent.value = null
    token.value = null
  }

  const fetchStudents = async () => {
    const res = await fetch('/api/v1/students', { credentials: 'include' })
    if (res.ok) students.value = await res.json()
  }

  const selectStudent = (student) => {
    currentStudent.value = student
  }

  return { user, students, currentStudent, token, login, register, logout, fetchStudents, selectStudent }
})
