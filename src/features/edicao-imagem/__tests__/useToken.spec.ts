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
})
