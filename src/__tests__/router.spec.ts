import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import router from '../router'
import { useAuthStore } from '../auth/authStore'

// O guarda global do router chama useAuthStore(): o pinia precisa estar ativo
// antes de qualquer push. O router (singleton do modulo) persiste entre os
// testes, entao cada it faz os pushes de que precisa a partir do estado atual.
describe('router', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('registra a rota /galeria apontando para a GaleriaView', async () => {
    useAuthStore().entrar('key-valida')

    await router.push('/galeria')

    expect(router.currentRoute.value.path).toBe('/galeria')
    // rota lazy: basta garantir que o match existe; o modulo so carrega no push
    expect(router.resolve('/galeria').matched).toHaveLength(1)
  })

  it('redireciona /galeria para /token quando nao autenticado', async () => {
    useAuthStore().sair()

    // sai de /galeria antes: push para a rota atual seria abortado como
    // navegacao duplicada e o guarda nem rodaria
    await router.push('/token')
    await router.push('/galeria')

    expect(router.currentRoute.value.path).toBe('/token')
  })
})
