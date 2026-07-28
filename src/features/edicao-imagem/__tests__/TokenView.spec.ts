import { describe, it, expect } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import TokenView from '../TokenView.vue'

describe('TokenView', () => {
  it('mostra erro de validacao quando a chave esta vazia', async () => {
    const wrapper = mount(TokenView)

    await wrapper.find('form').trigger('submit')
    // vee-validate encadeia microtasks ao validar: dois flushes para o erro
    // propagar ao DOM (comprovado: falha com apenas um).
    await flushPromises()
    await flushPromises()

    expect(wrapper.text()).toContain('API key é obrigatória')
  })
})
