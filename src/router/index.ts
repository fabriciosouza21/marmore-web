import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/auth/authStore'
import TokenView from '@/auth/TokenView.vue'
import { redirecionarAuth } from '@/auth/redirecionarAuth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/token', component: TokenView },
    { path: '/captura', component: { template: '<div />' } },
  ],
})

router.beforeEach((to) => redirecionarAuth(useAuthStore().autenticado, to.path))

export default router
