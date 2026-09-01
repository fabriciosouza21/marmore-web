import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/auth/authStore'
import { redirecionarAuth } from '@/auth/redirecionarAuth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: '/token' },
    { path: '/token', component: () => import('@/auth/TokenView.vue') },
    { path: '/captura', component: () => import('@/edicao-imagem/CapturaView.vue') },
    { path: '/galeria', component: () => import('@/galeria/GaleriaView.vue') },
  ],
})

router.beforeEach((to) => redirecionarAuth(useAuthStore().autenticado, to.path))

export default router
