import { describe, it, expect, beforeEach } from 'vitest'
import { nextTick } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../authStore'

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

  it('remove a api key do localStorage ao chamar sair()', async () => {
    const store = useAuthStore()

    store.entrar('minha-key')
    store.sair()
    // useStorage escreve via watch (flush pre); espera o flush antes de checar.
    await nextTick()

    // sair deve remover a entrada, nao deixa-la vazia: useStorage atribui null,
    // o que dispara removeItem, evitando resquicio de storage descobrivel.
    expect(localStorage.getItem('marmore.apiKey')).toBeNull()
  })

  it('restaura o estado autenticado a partir do localStorage na inicialização', () => {
    localStorage.setItem('marmore.apiKey', 'chave-teste-123')
    setActivePinia(createPinia())
    const store = useAuthStore()

    expect(store.autenticado).toBe(true)
  })
})
