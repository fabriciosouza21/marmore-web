import { describe, it, expect, beforeEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../auth'

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('mantém o usuário não autenticado enquanto não há API key salva', () => {
    expect(useAuthStore().autenticado).toBe(false)
  })
})
