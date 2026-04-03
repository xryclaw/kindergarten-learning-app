import { createApp, h } from 'vue'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory, RouterView } from 'vue-router'
import './styles/vars.css'
import App from './App.vue'
import Login from './views/Login.vue'
import { useAuthStore } from './stores/auth'

const routes = [
  { path: '/login', component: Login, name: 'login' },
  { path: '/', component: App, name: 'home', meta: { requiresAuth: true } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const pinia = createPinia()
const app = createApp({
  render: () => h(RouterView)
})

app.use(pinia)
app.use(router)

router.beforeEach((to, from, next) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.user) {
    next('/login')
  } else {
    next()
  }
})

app.mount('#app')
