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

// Localiza uma acao clicavel (botao, link ou [role=button]) pelo texto,
// independente de estar dentro do el-alert ou do card de resultado.
function acharAcao(wrapper: VueWrapper, texto: string) {
  return wrapper.findAll('button, a, [role="button"]').find((el) => el.text().includes(texto))
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

  it('exibe card de resultado com imagem, download e custo quando presentes', async () => {
    mockarFetchSse([
      'data:{"fase":"recebido"}\n\ndata:{"latency_ms":12345,"custo_brl":0.27}\n\ndata:aW1hZ2VtLWVkaXRhZGE=\n\n',
    ])
    const wrapper = mount(CapturaView)

    await selecionarArquivo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
    await flushPromises()

    const dataUrl = 'data:image/png;base64,aW1hZ2VtLWVkaXRhZGE='
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe(dataUrl)

    const link = wrapper.find('a[download="ambiente-editado.png"]')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe(dataUrl)

    // toLocaleString pt-BR usa espaco inseparavel (U+00A0) antes do valor.
    const texto = wrapper.text().replace(/\u00A0/g, ' ')
    expect(texto).toContain('R$ 0,27')
    expect(texto).toContain('12,3 s')
  })

  it('oculta custo quando o resultado vem sem custo_brl', async () => {
    mockarFetchSse(['data:{"latency_ms":1000}\n\ndata:aW1hZ2VtLXNlbS1jdXN0bw==\n\n'])
    const wrapper = mount(CapturaView)

    await selecionarArquivo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
    await flushPromises()

    // '1,0 s' garante que o card renderizou (evita falso positivo do not.toContain).
    const texto = wrapper.text().replace(/\u00A0/g, ' ')
    expect(texto).toContain('1,0 s')
    expect(texto).not.toContain('R$')
  })

  it('oferece editar outra foto reiniciando o fluxo apos o resultado', async () => {
    mockarFetchSse(['data:{"latency_ms":500}\n\ndata:aW1hZ2VtLXJlaW5pY2lhcg==\n\n'])
    const wrapper = mount(CapturaView)

    await selecionarArquivo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
    await flushPromises()
    expect(wrapper.find('img').exists()).toBe(true)

    const acao = acharAcao(wrapper, 'Editar outra foto')
    expect(acao).toBeDefined()
    await acao!.trigger('click')

    expect(wrapper.find('input[type="file"]').exists()).toBe(true)
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('permite tentar novamente apos erro retomando o fluxo', async () => {
    mockarFetchSse(['data:{"error":"falhou","latency_ms":10}\n\n'])
    const wrapper = mount(CapturaView)

    await selecionarArquivo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
    await flushPromises()
    expect(wrapper.text()).toContain('falhou')

    const acao = acharAcao(wrapper, 'Tentar novamente')
    expect(acao).toBeDefined()
    await acao!.trigger('click')

    expect(wrapper.find('input[type="file"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('falhou')
  })
})
