import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ElButton, ElOption, ElOptionGroup, ElProgress, ElSelect } from 'element-plus'
import { useAuthStore } from '../../auth/authStore'

const pushMock = vi.hoisted(() => vi.fn())
// A variante mockada espia submeter (e evita fetch no mount). Os demais casos
// usam o composable real (validacao de verdade + fetch stubado por rota).
const composableMock = vi.hoisted(() => ({
  ativo: false,
  submeter: vi.fn(),
  carregarPedras: vi.fn(),
}))

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
            processando: ref(false),
            pedras: ref([]),
            pedraSelecionada: ref(''),
            submeter: composableMock.submeter,
            reiniciar: vi.fn(),
            carregarPedras: composableMock.carregarPedras,
          }
        : original.useEditarImagem(),
  }
})

import CapturaView from '../CapturaView.vue'

const PEDRAS = [
  { id: 'verde_ubatuba', nome: 'Verde Ubatuba', categoria: 'Granitos' },
  { id: 'preto_sao_gabriel', nome: 'Preto São Gabriel', categoria: 'Granitos' },
  { id: 'calacatta', nome: 'Calacatta', categoria: 'Marmores' },
]

// jsdom nao implementa DataTransfer para input file: injetar files via
// defineProperty e disparar change (o handler da view le target.files).
async function selecionarArquivo(wrapper: VueWrapper, arquivo: File): Promise<void> {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', { value: [arquivo] })
  await input.trigger('change')
}

// Abrir o dropdown do el-select no jsdom e fragil (popper): o v-model e
// atualizado emitindo update:modelValue no componente (setValue de componente).
async function selecionarPedra(wrapper: VueWrapper, id: string): Promise<void> {
  const seletor = wrapper.findComponent(ElSelect)
  expect(seletor.exists(), 'seletor de pedra (el-select) deveria existir').toBe(true)
  await seletor.setValue(id)
}

function acharBotao(wrapper: VueWrapper, texto: string) {
  return wrapper.findAllComponents(ElButton).find((b) => b.text().includes(texto))
}

async function clicarGerarBancada(wrapper: VueWrapper): Promise<void> {
  const botao = acharBotao(wrapper, 'Gerar bancada')
  expect(botao, 'botao "Gerar bancada" deveria existir').toBeDefined()
  await botao!.trigger('click')
}

async function iniciarFluxo(wrapper: VueWrapper, arquivo: File, pedraId = 'verde_ubatuba') {
  await selecionarPedra(wrapper, pedraId)
  await selecionarArquivo(wrapper, arquivo)
  await clicarGerarBancada(wrapper)
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

function respostaSse(chunks: string[]): Response {
  return new Response(criarStreamSse(chunks), { status: 200 })
}

type RotasFetch = {
  pedras?: Response
  amostra?: Response
  edicao?: () => Response | Promise<Response>
}

// A tela agora faz tres chamadas distintas: GET /pedras (catalogo, no mount),
// GET /pedras/{id}/imagem (amostra, ao selecionar) e POST /images/edit (o
// envio). O fetch responde por URL para nao acoplar os testes a ordem.
function mockarFetchRotas(rotas: RotasFetch = {}): Mock {
  const fetchMock = vi.fn(async (recurso: RequestInfo | URL) => {
    const url = String(recurso)
    if (url === '/pedras') {
      return rotas.pedras ?? new Response(JSON.stringify(PEDRAS), { status: 200 })
    }
    if (/^\/pedras\/[^/]+\/imagem$/.test(url)) {
      return (
        rotas.amostra ??
        new Response(new Blob(['dados-da-amostra'], { type: 'image/png' }), { status: 200 })
      )
    }
    if (url === '/images/edit') {
      return rotas.edicao
        ? await rotas.edicao()
        : respostaSse(['data:{"latency_ms":1}\n\ndata:img\n\n'])
    }
    throw new Error(`fetch inesperado no teste: ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// Localiza uma acao clicavel (botao, link ou [role=button]) pelo texto,
// independente de estar dentro do el-alert ou do card de resultado.
function acharAcao(wrapper: VueWrapper, texto: string) {
  return wrapper.findAll('button, a, [role="button"]').find((el) => el.text().includes(texto))
}

describe('CapturaView', () => {
  const createObjectURLOriginal = URL.createObjectURL

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    composableMock.ativo = false
    composableMock.submeter = vi.fn()
    composableMock.carregarPedras = vi.fn()
    // jsdom nao gera blob: URLs uteis; fixa o src da amostra para assercao.
    URL.createObjectURL = vi.fn(() => 'blob:amostra') as unknown as typeof URL.createObjectURL
  })

  afterEach(() => {
    URL.createObjectURL = createObjectURLOriginal
    vi.unstubAllGlobals()
  })

  describe('fluxo em dois passos (selecionar pedra, depois gerar)', () => {
    it('ao montar carrega o catalogo do backend e prepara o seletor', async () => {
      useAuthStore().entrar('key-valida')
      const fetchMock = mockarFetchRotas()

      const wrapper = mount(CapturaView)
      await flushPromises()

      const chamadaPedras = fetchMock.mock.calls.find(([recurso]) => String(recurso) === '/pedras')
      expect(chamadaPedras).toBeDefined()
      expect(chamadaPedras![1]!.headers).toEqual({ 'X-API-Key': 'key-valida' })

      const seletor = wrapper.findComponent(ElSelect)
      expect(seletor.exists()).toBe(true)
      expect(seletor.props('placeholder')).toBe('Selecione a pedra')
      const rotulos = wrapper.findAllComponents(ElOption).map((o) => o.props('label'))
      for (const pedra of PEDRAS) {
        expect(rotulos).toContain(pedra.nome)
      }
    })

    it('agrupa as opcoes do seletor por categoria', async () => {
      mockarFetchRotas()
      const wrapper = mount(CapturaView)
      await flushPromises()

      const granitos = wrapper
        .findAllComponents(ElOptionGroup)
        .find((g) => g.props('label') === 'Granitos')
      expect(granitos).toBeDefined()
      const nomesDoGrupo = granitos!.findAllComponents(ElOption).map((o) => o.props('label'))
      expect(nomesDoGrupo).toContain('Verde Ubatuba')
      // pedra de outra categoria nao vaza para o grupo errado
      expect(nomesDoGrupo).not.toContain('Calacatta')
    })

    it('mantem Gerar bancada desabilitado enquanto nao ha pedra nem foto', () => {
      mockarFetchRotas()
      const wrapper = mount(CapturaView)

      const gerar = acharBotao(wrapper, 'Gerar bancada')
      expect(gerar).toBeDefined()
      expect(gerar!.attributes('disabled')).toBeDefined()
      expect(gerar!.props('type')).toBe('primary')
    })

    it('guarda o arquivo escolhido sem enviar no change', async () => {
      composableMock.ativo = true
      const fetchMock = vi.fn()
      vi.stubGlobal('fetch', fetchMock)
      const wrapper = mount(CapturaView)

      await selecionarArquivo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
      await flushPromises()

      expect(composableMock.submeter).not.toHaveBeenCalled()
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it('habilita Gerar bancada com pedra e foto e envia ao clicar', async () => {
      const fetchMock = mockarFetchRotas({
        edicao: () => respostaSse(['data:{"latency_ms":1}\n\ndata:aW1hZ2VtLWVkaXRhZGE=\n\n']),
      })
      const wrapper = mount(CapturaView)
      await flushPromises()

      await iniciarFluxo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
      await flushPromises()

      const chamadaEdicao = fetchMock.mock.calls.find(([recurso]) =>
        String(recurso).endsWith('/images/edit'),
      )
      expect(chamadaEdicao).toBeDefined()
      expect(chamadaEdicao![1]!.method).toBe('POST')
      expect(wrapper.find('img[src="data:image/png;base64,aW1hZ2VtLWVkaXRhZGE="]').exists()).toBe(
        true,
      )
    })

    it('mantem Gerar bancada desabilitado com foto escolhida mas sem pedra', async () => {
      const fetchMock = mockarFetchRotas()
      const wrapper = mount(CapturaView)
      await flushPromises()

      await selecionarArquivo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
      await flushPromises()

      const gerar = acharBotao(wrapper, 'Gerar bancada')
      expect(gerar, 'botao "Gerar bancada" deveria existir').toBeDefined()
      expect(gerar!.attributes('disabled')).toBeDefined()
      expect(
        fetchMock.mock.calls.some(([recurso]) => String(recurso).endsWith('/images/edit')),
      ).toBe(false)
    })

    it('ao selecionar pedra busca a amostra e a exibe junto ao seletor', async () => {
      useAuthStore().entrar('key-valida')
      const fetchMock = mockarFetchRotas()
      const wrapper = mount(CapturaView)
      await flushPromises()

      await selecionarPedra(wrapper, 'verde_ubatuba')
      await flushPromises()

      const chamadaAmostra = fetchMock.mock.calls.find(([recurso]) =>
        String(recurso).startsWith('/pedras/verde_ubatuba/imagem'),
      )
      expect(chamadaAmostra).toBeDefined()
      expect(chamadaAmostra![1]!.headers).toEqual({ 'X-API-Key': 'key-valida' })

      const amostra = wrapper.find('img[src="blob:amostra"]')
      expect(amostra.exists()).toBe(true)
    })
  })

  describe('fluxo de edicao apos Gerar bancada', () => {
    it('valida o formato so no envio explicito e exibe o erro', async () => {
      const fetchMock = mockarFetchRotas()
      const wrapper = mount(CapturaView)
      await flushPromises()

      await iniciarFluxo(wrapper, new File(['conteudo'], 'foto.webp', { type: 'image/webp' }))
      await flushPromises()

      expect(wrapper.text()).toContain('Formato inválido. Envie uma foto JPG ou PNG.')
      expect(
        fetchMock.mock.calls.some(([recurso]) => String(recurso).endsWith('/images/edit')),
      ).toBe(false)
    })

    it('avanca o progresso conforme as fases chegam', async () => {
      mockarFetchRotas({
        edicao: () =>
          respostaSse([
            'data:{"fase":"recebido"}\n\ndata:{"fase":"redimensionando"}\n\ndata:{"fase":"gerando"}\n\ndata:{"latency_ms":1}\n\ndata:ZmFrZS1pbWFnZW0x\n\n',
          ]),
      })
      const wrapper = mount(CapturaView)
      await flushPromises()

      await iniciarFluxo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
      await flushPromises()

      // fase permanece 'gerando' apos a conclusao (so reiniciar zera), entao a
      // barra fica cheia mesmo com o card de resultado ja renderizado.
      expect(wrapper.findComponent(ElProgress).props('percentage')).toBe(100)
      expect(wrapper.text()).toContain('Gerando')
    })

    it('mostra o passo a passo com o passo atual em destaque', async () => {
      mockarFetchRotas({
        edicao: () =>
          respostaSse([
            'data:{"fase":"recebido"}\n\ndata:{"fase":"redimensionando"}\n\ndata:{"latency_ms":1}\n\ndata:img\n\n',
          ]),
      })
      const wrapper = mount(CapturaView)
      await flushPromises()

      await iniciarFluxo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
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
      mockarFetchRotas({
        edicao: () =>
          respostaSse([
            'data:{"fase":"recebido"}\n\ndata:{"latency_ms":12345,"custo_brl":0.27}\n\ndata:aW1hZ2VtLWVkaXRhZGE=\n\n',
          ]),
      })
      const wrapper = mount(CapturaView)
      await flushPromises()

      await iniciarFluxo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
      await flushPromises()

      const dataUrl = 'data:image/png;base64,aW1hZ2VtLWVkaXRhZGE='
      const img = wrapper.find(`img[src="${dataUrl}"]`)
      expect(img.exists()).toBe(true)

      const link = wrapper.find('a[download="ambiente-editado.png"]')
      expect(link.exists()).toBe(true)
      expect(link.attributes('href')).toBe(dataUrl)

      // toLocaleString pt-BR usa espaco inseparavel (U+00A0) antes do valor.
      const texto = wrapper.text().replace(/\u00A0/g, ' ')
      expect(texto).toContain('R$ 0,27')
      expect(texto).toContain('12,3 s')
    })

    it('oculta custo quando o resultado vem sem custo_brl', async () => {
      mockarFetchRotas({
        edicao: () =>
          respostaSse(['data:{"latency_ms":1000}\n\ndata:aW1hZ2VtLXNlbS1jdXN0bw==\n\n']),
      })
      const wrapper = mount(CapturaView)
      await flushPromises()

      await iniciarFluxo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
      await flushPromises()

      // '1,0 s' garante que o card renderizou (evita falso positivo do not.toContain).
      const texto = wrapper.text().replace(/\u00A0/g, ' ')
      expect(texto).toContain('1,0 s')
      expect(texto).not.toContain('R$')
    })

    it('oferece editar outra foto reiniciando o fluxo apos o resultado', async () => {
      mockarFetchRotas({
        edicao: () => respostaSse(['data:{"latency_ms":500}\n\ndata:aW1hZ2VtLXJlaW5pY2lhcg==\n\n']),
      })
      const wrapper = mount(CapturaView)
      await flushPromises()

      await iniciarFluxo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
      await flushPromises()
      expect(
        wrapper.find('img[src="data:image/png;base64,aW1hZ2VtLXJlaW5pY2lhcg=="]').exists(),
      ).toBe(true)

      const acao = acharAcao(wrapper, 'Editar outra foto')
      expect(acao).toBeDefined()
      await acao!.trigger('click')

      expect(wrapper.find('input[type="file"]').exists()).toBe(true)
      expect(
        wrapper.find('img[src="data:image/png;base64,aW1hZ2VtLXJlaW5pY2lhcg=="]').exists(),
      ).toBe(false)
    })

    it('permite tentar novamente apos erro retomando o fluxo', async () => {
      mockarFetchRotas({
        edicao: () => respostaSse(['data:{"error":"falhou","latency_ms":10}\n\n']),
      })
      const wrapper = mount(CapturaView)
      await flushPromises()

      await iniciarFluxo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
      await flushPromises()
      expect(wrapper.text()).toContain('falhou')

      const acao = acharAcao(wrapper, 'Tentar novamente')
      expect(acao).toBeDefined()
      await acao!.trigger('click')

      expect(wrapper.find('input[type="file"]').exists()).toBe(true)
      expect(wrapper.text()).not.toContain('falhou')
    })

    it('mostra indicador de processamento durante o envio', async () => {
      let resolver!: (value: Response) => void
      const respostaPendente = new Promise<Response>((r) => {
        resolver = r
      })
      mockarFetchRotas({ edicao: () => respostaPendente })
      const wrapper = mount(CapturaView)
      await flushPromises()

      await iniciarFluxo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
      await flushPromises()
      expect(wrapper.text()).toContain('Processando a foto')

      resolver(respostaSse(['data:{"latency_ms":1}\n\ndata:img\n\n']))
      await flushPromises()
      expect(wrapper.text()).not.toContain('Processando a foto')
    })

    it('mostra spinner enquanto processa', async () => {
      let resolver!: (value: Response) => void
      const respostaPendente = new Promise<Response>((r) => {
        resolver = r
      })
      mockarFetchRotas({ edicao: () => respostaPendente })
      const wrapper = mount(CapturaView)
      await flushPromises()

      await iniciarFluxo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
      await flushPromises()
      expect(wrapper.find('.girando').exists()).toBe(true)

      resolver(respostaSse(['data:{"latency_ms":1}\n\ndata:img\n\n']))
      await flushPromises()
      expect(wrapper.find('.girando').exists()).toBe(false)
    })

    it('exibe o rotulo da fase atual durante o envio', async () => {
      let resolver!: (value: Response) => void
      const respostaPendente = new Promise<Response>((r) => {
        resolver = r
      })
      mockarFetchRotas({ edicao: () => respostaPendente })
      const wrapper = mount(CapturaView)
      await flushPromises()

      await iniciarFluxo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
      await flushPromises()
      expect(wrapper.text()).toContain('Processando a foto...')

      resolver(
        respostaSse(['data:{"fase":"redimensionando"}\n\ndata:{"latency_ms":1}\n\ndata:img\n\n']),
      )
      await flushPromises()
      expect(wrapper.text()).toContain('Redimensionando')
      // ((1+1)/3)*100 em IEEE da 66.66666666666667; toBeCloseTo evita acoplar ao floating point.
      expect(wrapper.findComponent(ElProgress).props('percentage')).toBeCloseTo(66.67, 1)
    })

    it('no 401 do envio limpa a key e volta ao token', async () => {
      useAuthStore().entrar('key-valida')
      mockarFetchRotas({
        edicao: () => new Response('{"error":"key invalida"}', { status: 401 }),
      })
      const wrapper = mount(CapturaView)
      await flushPromises()

      await iniciarFluxo(wrapper, new File(['conteudo'], 'foto.png', { type: 'image/png' }))
      await flushPromises()

      expect(useAuthStore().autenticado).toBe(false)
      expect(pushMock).toHaveBeenCalledWith('/token')
    })
  })

  describe('estrutura da tela', () => {
    it('oferece botoes de tirar foto e enviar arquivo escondendo os inputs nativos', () => {
      const wrapper = mount(CapturaView)

      expect(acharBotao(wrapper, 'Tirar foto')).toBeDefined()
      expect(acharBotao(wrapper, 'Enviar arquivo')).toBeDefined()

      const inputCamera = wrapper.find('input[capture]')
      const inputArquivo = wrapper.find('input[type="file"]:not([capture])')
      expect(inputCamera.exists()).toBe(true)
      expect(inputCamera.attributes('hidden')).toBeDefined()
      expect(inputArquivo.exists()).toBe(true)
      expect(inputArquivo.attributes('hidden')).toBeDefined()
    })

    it('clicar tirar foto aciona o input da camera', async () => {
      mockarFetchRotas()
      const wrapper = mount(CapturaView)
      await flushPromises()
      const spy = vi.spyOn(wrapper.find('input[capture]').element as HTMLInputElement, 'click')

      const acao = acharAcao(wrapper, 'Tirar foto')
      expect(acao).toBeDefined()
      await acao!.trigger('click')

      expect(spy).toHaveBeenCalledTimes(1)
    })

    it('exibe titulo da tela de edicao', () => {
      const wrapper = mount(CapturaView)

      expect(wrapper.find('h2').text()).toBe('Editar foto do ambiente')
    })
  })
})
