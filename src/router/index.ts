import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../features/edicao-imagem/auth'
import TokenView from '../features/edicao-imagem/TokenView.vue'

export function redirecionarAuth(autenticado: boolean, path: string): string | undefined {
  if (!autenticado && path !== '/token') return '/token'
  if (autenticado && path === '/token') return '/captura'
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/token', component: TokenView },
    { path: '/captura', component: { template: '<div />' } },
  ],
})

router.beforeEach((to) => redirecionarAuth(useAuthStore().autenticado, to.path))

export default router
