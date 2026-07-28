import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../features/edicao-imagem/auth'
import TokenView from '../features/edicao-imagem/TokenView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/token', component: TokenView },
    { path: '/captura', component: { template: '<div/>' } },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (!auth.autenticado && to.path !== '/token') return '/token'
})

export default router
