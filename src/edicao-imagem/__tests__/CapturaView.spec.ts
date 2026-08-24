import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ElSteps } from 'element-plus'

const pushMock = vi.hoisted(() => vi.fn())
// Caso 1 monta a view com o composable mockado (espia submeter); casos 2 e 3
// usam o composable real (validacao de verdade + fetch stubado). Como a
// fabrica do vi.mock e hoisted, o toggle so pode vir de vi.hoisted.
const composableMock = vi.hoisted(() => ({ ativo: false, submeter: vi.fn() }))

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('../composables/useEditarImagem', async (importOriginal) => {
  const { ref } = await import('vue')
  const original = await importOriginal<typeof import('../composables/useEditarImagem')>()
  return {
    useEditarImagem: () =>
      composableMock.ativo
        ? {
            fase: ref(null),
            resultado: ref(null),
            erro: ref(null),
            submeter: composableMock.submeter,
          }
        : original.useEditarImagem(),
  }
})

import CapturaView from '../CapturaView.vue'

// jsdom nao implementa DataTransfer para input file: injetar files via
// defineProperty e disparar change (o handler da view le target.files).
async function selecionarArquivo(wrapper: VueWrapper, arquivo: File): Promise<void> {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [arquivo] })
  await input.trigger('change')
}

function criarStreamSse(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk))
      }
      controller.close()
    },
  })
}

function mockarFetchSse(chunks: string[]): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(criarStreamSse(chunks), { status: 200 })),
  )
}

describe('CapturaView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    composableMock.ativo = false
    composableMock.submeter = vi.fn()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('dispara o fluxo ao selecionar um arquivo valido', async () => {
    composableMock.ativo = true
    const wrapper = mount(CapturaView)
    const arquivo = new File(['conteudo'], 'foto.png', { type: 'image/png' })

    await selecionarArquivo(wrapper, arquivo)

    expect(composableMock.submeter).toHaveBeenCalledTimes(1)
    expect(composableMock.submeter).toHaveBeenCalledWith(arquivo)
  })

  it('exibe erro de validacao sem chamar o fluxo', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const wrapper = mount(CapturaView)

    await selecionarArquivo(wrapper, new File(['conteudo'], 'foto.webp', { type: 'image/webp' }))
    await flushPromises()

    expect(wrapper.text()).toContain('Formato inválido. Envie uma foto JPG ou PNG.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('avanca os steps conforme as fases chegam', async () => {
    mockarFetchSse([
      'data:{"fase":"recebido"}\n\ndata:{"fase":"redimensionando"}\n\ndata:{"fase":"gerando"}\n\ndata:{"latency_ms":1}\n\ndata:ZmFrZS1pbWFnZW0x\n\n',
    ])
    const wrapper = mount(CapturaView)

    await selecionarArquivo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
    await flushPromises()

    expect(wrapper.findComponent(ElSteps).props('active')).toBe(2)
  })
})
