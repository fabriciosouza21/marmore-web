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

  it('autentica o usuário após chamar entrar() com a chave', () => {
    const store = useAuthStore()

    store.entrar('minha-key')

    expect(store.autenticado).toBe(true)
  })

  it('desautentica o usuário após chamar sair()', () => {
    const store = useAuthStore()

    store.entrar('minha-key')
    store.sair()

    expect(store.autenticado).toBe(false)
  })

  it('restaura o estado autenticado a partir do localStorage na inicialização', () => {
    localStorage.setItem('marmore.apiKey', 'chave-teste-123')
    setActivePinia(createPinia())
    const store = useAuthStore()

    expect(store.autenticado).toBe(true)
  })
})
