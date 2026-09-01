import { describe, it, expect, beforeEach, afterEach, vi, type Mock } from 'vitest'
import { mount, flushPromises, type VueWrapper } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { ElButton } from 'element-plus'
import { useAuthStore } from '../../auth/authStore'

const pushMock = vi.hoisted(() => vi.fn())

vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

import GaleriaView from '../GaleriaView.vue'

const IMAGENS = [
  {
    id: 'a1',
    criado_em: '2026-09-01T12:00:00.000Z',
    modelo: 'gpt-image-1',
    custo_brl: 0.03,
    latencia_ms: 8214,
    pedra: 'verde_ubatuba',
    nome_pedra: 'Verde Ubatuba',
    produto: 'pia-americana',
    nome_produto: 'Pia americana',
  },
  {
    id: 'b2',
    criado_em: '2026-09-02T15:30:00.000Z',
    modelo: 'gpt-image-1',
    custo_brl: null,
    latencia_ms: 5000,
    pedra: null,
    nome_pedra: null,
    produto: 'pia-americana',
    nome_produto: 'Pia americana',
  },
]

type RotasFetch = {
  listagem?: () => Response | Promise<Response>
}

// A tela faz duas chamadas: GET /images (listagem, no mount) e
// GET /images/{id}/arquivo (bytes de cada imagem). O fetch responde por URL
// para nao acoplar o teste a ordem das chamadas.
function mockarFetchRotas(rotas: RotasFetch = {}): Mock {
  const fetchMock = vi.fn(async (recurso: RequestInfo | URL) => {
    const url = String(recurso)
    if (url === '/images') {
      return rotas.listagem
        ? await rotas.listagem()
        : new Response(JSON.stringify(IMAGENS), { status: 200 })
    }
    if (/^\/images\/[^/]+\/arquivo$/.test(url)) {
      return new Response(new Blob(['bytes'], { type: 'image/png' }), { status: 200 })
    }
    throw new Error(`fetch inesperado no teste: ${url}`)
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function acharBotao(wrapper: VueWrapper, texto: string) {
  return wrapper.findAllComponents(ElButton).find((b) => b.text().includes(texto))
}

// Localiza uma acao clicavel (botao, link ou [role=button]) pelo texto,
// independente de estar dentro do el-alert ou de outro conteiner.
function acharAcao(wrapper: VueWrapper, texto: string) {
  return wrapper.findAll('button, a, [role="button"]').find((el) => el.text().includes(texto))
}

describe('GaleriaView', () => {
  const createObjectURLOriginal = URL.createObjectURL

  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    // jsdom nao gera blob: URLs uteis; valores distintos em sequencia garantem
    // que cada cartao aponta para o seu proprio object URL.
    URL.createObjectURL = vi
      .fn()
      .mockReturnValueOnce('blob:primeira')
      .mockReturnValueOnce('blob:segunda') as unknown as typeof URL.createObjectURL
  })

  afterEach(() => {
    URL.createObjectURL = createObjectURLOriginal
    vi.unstubAllGlobals()
  })

  it('ao montar carrega as imagens com a api key e exibe titulo e instrucao', async () => {
    useAuthStore().entrar('key-valida')
    const fetchMock = mockarFetchRotas()

    const wrapper = mount(GaleriaView)
    await flushPromises()

    const chamadaListagem = fetchMock.mock.calls.find(([recurso]) => String(recurso) === '/images')
    expect(chamadaListagem).toBeDefined()
    expect(chamadaListagem![1]!.headers).toEqual({ 'X-API-Key': 'key-valida' })

    expect(wrapper.find('h2.titulo-tela').text()).toBe('Imagens geradas')
    expect(wrapper.text()).toContain('Toque em uma imagem para ampliar.')
  })

  it('exibe cada imagem gerada com seu object url na grade', async () => {
    useAuthStore().entrar('key-valida')
    const fetchMock = mockarFetchRotas()

    const wrapper = mount(GaleriaView)
    await flushPromises()

    const fontes = wrapper
      .findAll('.galeria article.cartao-imagem img')
      .map((img) => img.attributes('src'))
    expect(fontes).toEqual(['blob:primeira', 'blob:segunda'])

    for (const id of ['a1', 'b2']) {
      const chamadaArquivo = fetchMock.mock.calls.find(
        ([recurso]) => String(recurso) === `/images/${id}/arquivo`,
      )
      expect(chamadaArquivo, `bytes de ${id} deveriam ser buscados`).toBeDefined()
      expect(chamadaArquivo![1]!.headers).toEqual({ 'X-API-Key': 'key-valida' })
    }
  })

  it('exibe pedra, produto e data na legenda de cada cartao', async () => {
    useAuthStore().entrar('key-valida')
    mockarFetchRotas()

    const wrapper = mount(GaleriaView)
    await flushPromises()

    const cartoes = wrapper.findAll('article.cartao-imagem')
    expect(cartoes).toHaveLength(2)

    const textoCartao1 = cartoes[0]!.text().replace(/\u00A0/g, ' ')
    expect(textoCartao1).toContain('Verde Ubatuba')
    expect(textoCartao1).toContain('Pia americana')
    expect(textoCartao1).toContain('01/09/2026')

    // nome_pedra null: o cartao nao renderiza a linha de pedra
    const textoCartao2 = cartoes[1]!.text().replace(/\u00A0/g, ' ')
    expect(textoCartao2).not.toContain('Verde Ubatuba')
    expect(textoCartao2).toContain('Pia americana')
    expect(textoCartao2).toContain('02/09/2026')
  })

  it('mostra carregando enquanto a listagem nao resolve', async () => {
    useAuthStore().entrar('key-valida')
    let resolver!: (value: Response) => void
    const respostaPendente = new Promise<Response>((r) => {
      resolver = r
    })
    mockarFetchRotas({ listagem: () => respostaPendente })
    const wrapper = mount(GaleriaView)

    expect(wrapper.text()).toContain('Carregando imagens...')

    resolver(new Response(JSON.stringify([]), { status: 200 }))
    await flushPromises()

    expect(wrapper.text()).not.toContain('Carregando imagens...')
  })

  it('lista vazia mostra orientacao e botao para gerar a primeira bancada', async () => {
    useAuthStore().entrar('key-valida')
    mockarFetchRotas({ listagem: () => new Response(JSON.stringify([]), { status: 200 }) })

    const wrapper = mount(GaleriaView)
    await flushPromises()

    expect(wrapper.text()).toContain('Nenhuma imagem gerada ainda.')
    expect(wrapper.find('.galeria').exists()).toBe(false)

    const botao = acharBotao(wrapper, 'Gerar primeira bancada')
    expect(botao, 'botao "Gerar primeira bancada" deveria existir').toBeDefined()
    await botao!.trigger('click')

    expect(pushMock).toHaveBeenCalledWith('/captura')
  })

  it('erro na listagem mostra alerta com acao para tentar novamente', async () => {
    useAuthStore().entrar('key-valida')
    let chamadas = 0
    mockarFetchRotas({
      listagem: () => {
        chamadas += 1
        if (chamadas === 1) {
          return new Response('{"error":"boom"}', { status: 500 })
        }
        return new Response(JSON.stringify(IMAGENS), { status: 200 })
      },
    })
    // o retry carrega as 2 imagens de novo; o beforeEach so cobre duas URLs.
    let contadorUrls = 0
    URL.createObjectURL = vi.fn(
      () => `blob:extra-${++contadorUrls}`,
    ) as unknown as typeof URL.createObjectURL

    const wrapper = mount(GaleriaView)
    await flushPromises()

    expect(wrapper.text()).toContain('Não foi possível carregar as imagens.')

    const acao = acharAcao(wrapper, 'Tentar novamente')
    expect(acao, 'acao "Tentar novamente" deveria existir').toBeDefined()
    await acao!.trigger('click')
    await flushPromises()

    expect(wrapper.text()).not.toContain('Não foi possível carregar as imagens.')
    expect(wrapper.findAll('.galeria article.cartao-imagem')).toHaveLength(2)
  })

  it('no 401 da listagem limpa a key e volta ao token', async () => {
    useAuthStore().entrar('key-valida')
    mockarFetchRotas({ listagem: () => new Response('{"error":"key invalida"}', { status: 401 }) })

    mount(GaleriaView)
    await flushPromises()

    expect(useAuthStore().autenticado).toBe(false)
    expect(pushMock).toHaveBeenCalledWith('/token')
  })

  it('oferece gerar nova bancada no rodape apos carregar', async () => {
    useAuthStore().entrar('key-valida')
    mockarFetchRotas()

    const wrapper = mount(GaleriaView)
    await flushPromises()

    const botao = acharBotao(wrapper, 'Gerar nova bancada')
    expect(botao, 'botao "Gerar nova bancada" deveria existir').toBeDefined()
    await botao!.trigger('click')

    expect(pushMock).toHaveBeenCalledWith('/captura')
  })
})
