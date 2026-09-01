import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/auth/authStore'
import App from '@/App.vue'

// RouterView e RouterLink precisam de stub: App.vue renderiza <RouterView/> e
// o guard; sem um router real, o componente queima ao tentar injetar o contexto.
const pushMock = vi.hoisted(() => vi.fn())
vi.mock('vue-router', () => ({
  RouterView: { name: 'RouterView', template: '<div />' },
  useRouter: () => ({ push: pushMock }),
}))

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('renderiza o botao Sair quando o usuario esta autenticado', () => {
    useAuthStore().entrar('chave-valida')

    const wrapper = mount(App)

    const botoesSair = wrapper.findAll('button').filter((b) => b.text().includes('Sair'))
    expect(botoesSair.length).toBeGreaterThan(0)
  })

  it('nao renderiza o botao Sair quando o usuario nao esta autenticado', () => {
    const wrapper = mount(App)

    const botoesSair = wrapper.findAll('button').filter((b) => b.text().includes('Sair'))
    expect(botoesSair.length).toBe(0)
  })

  it('desautentica ao clicar no botao Sair', async () => {
    const store = useAuthStore()
    store.entrar('chave-valida')

    const wrapper = mount(App)
    const botaoSair = wrapper.findAll('button').filter((b) => b.text().includes('Sair'))[0]
    await botaoSair!.trigger('click')

    expect(store.autenticado).toBe(false)
  })

  it('ao clicar Sair volta para /token', async () => {
    useAuthStore().entrar('chave-valida')

    const wrapper = mount(App)
    const botaoSair = wrapper.findAll('button').filter((b) => b.text().includes('Sair'))[0]
    await botaoSair!.trigger('click')

    expect(pushMock).toHaveBeenCalledWith('/token')
  })
})
