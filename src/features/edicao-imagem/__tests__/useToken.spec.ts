import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useToken } from '../useToken'
import { useAuthStore } from '../auth'

describe('useToken', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('autentica o usuário após onSubmit', async () => {
    const token = useToken()

    await token.onSubmit('x')

    expect(useAuthStore().autenticado).toBe(true)
  })

  it('desautentica o usuário ao chamar sair', () => {
    useAuthStore().entrar('chave-valida')

    const { sair } = useToken()
    sair()

    expect(useAuthStore().autenticado).toBe(false)
  })
})
