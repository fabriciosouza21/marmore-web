import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ElButton, ElProgress } from 'element-plus'

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

  it('avanca o progresso conforme as fases chegam', async () => {
    mockarFetchSse([
      'data:{"fase":"recebido"}\n\ndata:{"fase":"redimensionando"}\n\ndata:{"fase":"gerando"}\n\ndata:{"latency_ms":1}\n\ndata:ZmFrZS1pbWFnZW0x\n\n',
    ])
    const wrapper = mount(CapturaView)

    await selecionarArquivo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
    await flushPromises()

    // fase permanece 'gerando' apos a conclusao (so reiniciar zera), entao a
    // barra fica cheia mesmo com o card de resultado ja renderizado.
    expect(wrapper.findComponent(ElProgress).props('percentage')).toBe(100)
    expect(wrapper.text()).toContain('Gerando')
  })

  it('mostra o passo a passo com o passo atual em destaque', async () => {
    mockarFetchSse([
      'data:{"fase":"recebido"}\n\ndata:{"fase":"redimensionando"}\n\ndata:{"latency_ms":1}\n\ndata:img\n\n',
    ])
    const wrapper = mount(CapturaView)

    await selecionarArquivo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
    await flushPromises()

    const lista = wrapper.find('ol.passos')
    expect(lista.exists()).toBe(true)
    const passos = lista.findAll('li')
    expect(passos).toHaveLength(3)

    // ultima fase recebida e 'redimensionando' (indice 1): Recebido concluido,
    // Redimensionando atual, Gerando pendente.
    const acharPasso = (rotulo: string) => passos.find((li) => li.text().includes(rotulo))

    const recebido = acharPasso('Recebido')
    expect(recebido).toBeDefined()
    expect(recebido!.classes()).toContain('concluido')
    // o check fica como texto dentro do .marcador do passo concluido
    expect(recebido!.text()).toContain('✓')

    const redimensionando = acharPasso('Redimensionando')
    expect(redimensionando).toBeDefined()
    expect(redimensionando!.classes()).toContain('atual')
    expect(redimensionando!.text()).not.toContain('✓')

    const gerando = acharPasso('Gerando')
    expect(gerando).toBeDefined()
    expect(gerando!.classes()).toContain('pendente')
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

  it('oferece botoes de tirar foto e enviar arquivo escondendo os inputs nativos', () => {
    const wrapper = mount(CapturaView)

    const acharBotao = (texto: string) =>
      wrapper.findAllComponents(ElButton).find((b) => b.text().includes(texto))
    expect(acharBotao('Tirar foto')).toBeDefined()
    expect(acharBotao('Enviar arquivo')).toBeDefined()

    const inputCamera = wrapper.find('input[capture]')
    const inputArquivo = wrapper.find('input[type="file"]:not([capture])')
    expect(inputCamera.exists()).toBe(true)
    expect(inputCamera.attributes('hidden')).toBeDefined()
    expect(inputArquivo.exists()).toBe(true)
    expect(inputArquivo.attributes('hidden')).toBeDefined()
  })

  it('destaca tirar foto como acao principal', () => {
    const wrapper = mount(CapturaView)

    const acharBotao = (texto: string) =>
      wrapper.findAllComponents(ElButton).find((b) => b.text().includes(texto))
    const tirarFoto = acharBotao('Tirar foto')!
    const enviarArquivo = acharBotao('Enviar arquivo')!

    // O caminho principal (camera no celular) e o unico destaque da tela;
    // o envio de arquivo permanece visualmente secundario (default).
    expect(tirarFoto).toBeDefined()
    expect(tirarFoto.props('type')).toBe('primary')
    expect(enviarArquivo).toBeDefined()
    // default do element-plus materializa type como string vazia
    expect(enviarArquivo.props('type') || undefined).toBeUndefined()
  })

  it('clicar tirar foto aciona o input da camera', async () => {
    const wrapper = mount(CapturaView)
    const spy = vi.spyOn(wrapper.find('input[capture]').element as HTMLInputElement, 'click')

    const acao = acharAcao(wrapper, 'Tirar foto')
    expect(acao).toBeDefined()
    await acao!.trigger('click')

    expect(spy).toHaveBeenCalledTimes(1)
  })

  it('mostra indicador de processamento durante o envio', async () => {
    let resolver!: (value: Response) => void
    const respostaPendente = new Promise<Response>((r) => {
      resolver = r
    })
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(respostaPendente))
    const wrapper = mount(CapturaView)

    await selecionarArquivo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
    await flushPromises()
    expect(wrapper.text()).toContain('Processando a foto')

    resolver(
      new Response(criarStreamSse(['data:{"latency_ms":1}\n\ndata:img\n\n']), { status: 200 }),
    )
    await flushPromises()
    expect(wrapper.text()).not.toContain('Processando a foto')
  })

  it('exibe titulo da tela de edicao', () => {
    const wrapper = mount(CapturaView)

    expect(wrapper.find('h2').text()).toBe('Editar foto do ambiente')
  })

  it('mostra spinner enquanto processa', async () => {
    let resolver!: (value: Response) => void
    const respostaPendente = new Promise<Response>((r) => {
      resolver = r
    })
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(respostaPendente))
    const wrapper = mount(CapturaView)

    await selecionarArquivo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
    await flushPromises()
    expect(wrapper.find('.girando').exists()).toBe(true)

    resolver(
      new Response(criarStreamSse(['data:{"latency_ms":1}\n\ndata:img\n\n']), { status: 200 }),
    )
    await flushPromises()
    expect(wrapper.find('.girando').exists()).toBe(false)
  })

  it('mostra instrucao inicial quando nada foi enviado', () => {
    const wrapper = mount(CapturaView)

    expect(wrapper.text()).toContain('Tire uma foto do ambiente ou envie um arquivo JPG/PNG.')
  })

  it('exibe o rotulo da fase atual durante o envio', async () => {
    let resolver!: (value: Response) => void
    const respostaPendente = new Promise<Response>((r) => {
      resolver = r
    })
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(respostaPendente))
    const wrapper = mount(CapturaView)

    await selecionarArquivo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
    await flushPromises()
    expect(wrapper.text()).toContain('Processando a foto...')

    resolver(
      new Response(
        criarStreamSse([
          'data:{"fase":"redimensionando"}\n\ndata:{"latency_ms":1}\n\ndata:img\n\n',
        ]),
        { status: 200 },
      ),
    )
    await flushPromises()
    expect(wrapper.text()).toContain('Redimensionando')
    // ((1+1)/3)*100 em IEEE da 66.66666666666667; toBeCloseTo evita acoplar ao floating point.
    expect(wrapper.findComponent(ElProgress).props('percentage')).toBeCloseTo(66.67, 1)
  })
})
