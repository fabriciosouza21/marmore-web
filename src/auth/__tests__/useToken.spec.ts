import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const pushMock = vi.hoisted(() => vi.fn())
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

import { useToken } from '../useToken'
import { useAuthStore } from '../authStore'

describe('useToken', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    pushMock.mockClear()
  })

  it('autentica o usuário após onSubmit', () => {
    const token = useToken()

    token.onSubmit('x')

    expect(useAuthStore().autenticado).toBe(true)
  })

  it('desautentica o usuário ao chamar sair', () => {
    useAuthStore().entrar('chave-valida')

    const { sair } = useToken()
    sair()

    expect(useAuthStore().autenticado).toBe(false)
  })

  it('sair navega para /token', () => {
    useAuthStore().entrar('chave-valida')

    const { sair } = useToken()
    sair()

    expect(pushMock).toHaveBeenCalledWith('/token')
  })
})
