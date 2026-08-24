import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/auth/authStore'
import TokenView from '@/auth/TokenView.vue'
import { redirecionarAuth } from '@/auth/redirecionarAuth'
import CapturaView from '@/edicao-imagem/CapturaView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/token', component: TokenView },
    { path: '/captura', component: CapturaView },
  ],
})

router.beforeEach((to) => redirecionarAuth(useAuthStore().autenticado, to.path))

export default router
