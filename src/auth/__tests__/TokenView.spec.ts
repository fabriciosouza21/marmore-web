import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../authStore'
import { ElButton, ElForm, ElFormItem, ElInput } from 'element-plus'

const pushMock = vi.hoisted(() => vi.fn())
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

import TokenView from '../TokenView.vue'

// Todos os testes usam bare mount: o ElementPlusResolver (unplugin-vue-components
// no vite.config) importa estaticamente el-* no SFC em tempo de compilacao,
// entao os componentes resolvem sem o plugin global. Evita poluicao de contexto
// (provide/inject) que instalar o plugin num teste causa nos bare mounts seguintes.
describe('TokenView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('mostra erro de validacao quando a chave esta vazia', async () => {
    const wrapper = mount(TokenView)

    await wrapper.find('form').trigger('submit')
    // vee-validate encadeia microtasks ao validar e so conclui o handleSubmit
    // apos uma macrotask (debounce interno): dois flushes limpam as microtasks,
    // a espera de 50ms deixa o debounce vencer (comprovado: 0ms nao basta).
    await flushPromises()
    await flushPromises()
    await new Promise((resolver) => setTimeout(resolver, 50))

    // Assertionamos o prop :error do el-form-item (e nao wrapper.text()) para
    // provar o BINDING: errors.apiKey -> el-form-item. O texto em si nao renderiza
    // no DOM em jsdom (el-form-item o mostra via <Transition> stubada), entao ler
    // o prop e a forma de garantir a cobertura do binding sem depender de render.
    expect(wrapper.findComponent(ElFormItem).props('error')).toBe('API key é obrigatória')
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

  it('renderiza um el-form como wrapper do formulario', () => {
    const wrapper = mount(TokenView)

    expect(wrapper.findComponent(ElForm).exists()).toBe(true)
  })

  it('renderiza um el-input como campo da api key', () => {
    const wrapper = mount(TokenView)

    expect(wrapper.findComponent(ElInput).exists()).toBe(true)
  })

  it('exibe o wordmark Marmore no card', () => {
    const wrapper = mount(TokenView)

    const marca = wrapper.find('.token-marca')
    expect(marca.exists()).toBe(true)
    expect(marca.text()).toBe('Mármore')
  })

  it('renderiza titulo e descricao deixando claro o campo de api key', () => {
    const wrapper = mount(TokenView)

    expect(wrapper.text()).toContain('Acesso à API key')
    expect(wrapper.text()).toContain('Cole a chave de acesso para usar o editor de fotos.')
    expect(wrapper.find('input').attributes('placeholder')).toBe('Cole a API key aqui')
  })

  it('renderiza botao de submit com texto Entrar', () => {
    const wrapper = mount(TokenView)

    const botao = wrapper.findComponent(ElButton)
    expect(botao.exists()).toBe(true)
    expect(botao.text()).toContain('Entrar')
    // el-button com native-type="submit" renderiza <button type="submit">;
    // o prop type do element-plus (primary/default) so afeta classes.
    expect(botao.attributes('type')).toBe('submit')
  })
  // O fluxo real clique -> submit -> navegacao nao e exercitavel no jsdom
  // (dispatchEvent e click() nativo nao rodam o activation behavior de
  // submit button); fica para o smoke e2e Playwright previsto no FE-5.
})
