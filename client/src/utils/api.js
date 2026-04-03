const API_BASE = '/api/v1'

export const api = {
  async post(url, data) {
    const res = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include'
    })
    if (!res.ok) throw new Error('API request failed')
    return res.json()
  },

  async get(url) {
    const res = await fetch(`${API_BASE}${url}`, { credentials: 'include' })
    if (!res.ok) throw new Error('API request failed')
    return res.json()
  }
}
