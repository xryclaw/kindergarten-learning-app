const API_BASE = '/api/v1'

async function handleResponse(res) {
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let message = 'API request failed'
    try {
      const err = JSON.parse(text)
      message = err?.error?.message || err?.message || message
    } catch {}
    throw new Error(message)
  }
  return res.json()
}

export const api = {
  async post(url, data) {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    })
    return handleResponse(res)
  },

  async get(url) {
    const res = await fetch(`${API_BASE}${url}`, { credentials: 'include' })
    return handleResponse(res)
  },

  async put(url, data) {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    })
    return handleResponse(res)
  },

  async del(url) {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'DELETE',
      credentials: 'include'
    })
    return handleResponse(res)
  }
}

// Content API helpers
export const contentApi = {
  getTopics(category, page = 1, limit = 20) {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (category) params.set('category', category)
    return api.get(`/content/topics?${params}`)
  },

  getTopic(id) {
    return api.get(`/content/topics/${id}`)
  }
}

// Learning API helpers
export const learningApi = {
  submitRecord(body) {
    return api.post('/learning/records', body)
  },

  submitMistake(body) {
    return api.post('/learning/mistakes', body)
  },

  getRecords(studentId, params = {}) {
    const qs = new URLSearchParams({ studentId: String(studentId), ...params })
    return api.get(`/learning/records?${qs}`)
  },

  getStats(studentId, period = 'week') {
    return api.get(`/learning/stats?studentId=${studentId}&period=${period}`)
  }
}
