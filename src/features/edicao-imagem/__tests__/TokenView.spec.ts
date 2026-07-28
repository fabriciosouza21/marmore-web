import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../auth'

const pushMock = vi.hoisted(() => vi.fn())
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

import TokenView from '../TokenView.vue'

describe('TokenView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('mostra erro de validacao quando a chave esta vazia', async () => {
    const wrapper = mount(TokenView)

    await wrapper.find('form').trigger('submit')
    // vee-validate encadeia microtasks ao validar: dois flushes para o erro
    // propagar ao DOM (comprovado: falha com apenas um).
    await flushPromises()
    await flushPromises()

    expect(wrapper.text()).toContain('API key é obrigatória')
  })

  it('autentica quando a chave e valida', async () => {
    const wrapper = mount(TokenView)

    await wrapper.find('input').setValue('chave-valida')
    await wrapper.vm.onSubmit()

    expect(useAuthStore().autenticado).toBe(true)
  })

  it('navega para /captura apos autenticar', async () => {
    const wrapper = mount(TokenView)

    await wrapper.find('input').setValue('chave-valida')
    await wrapper.vm.onSubmit()

    expect(pushMock).toHaveBeenCalledWith('/captura')
  })
})
