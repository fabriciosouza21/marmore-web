import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import router from '@/router'

describe('router', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('redireciona para /token quando o usuario nao esta autenticado', async () => {
    await router.push('/captura')

    expect(router.currentRoute.value.path).toBe('/token')
  })
})
