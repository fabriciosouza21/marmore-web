import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '../../../auth/authStore'
import { ElMessage } from 'element-plus'

const pushMock = vi.hoisted(() => vi.fn())
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('element-plus', async (importOriginal) => ({
  ...((await importOriginal()) as object),
  ElMessage: { error: vi.fn() },
}))

import { useEditarImagem } from '../../composables/useEditarImagem'

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

describe('useEditarImagem', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  afterEach(() => vi.unstubAllGlobals())

  it('alimenta as fases do stream no estado reativo', async () => {
    mockarFetchSse([
      'data:{"fase":"recebido"}\n\ndata:{"fase":"redimensionando"}\n\ndata:{"fase":"gerando"}\n\ndata:{"latency_ms":1}\n\ndata:ZmFrZS1pbWFnZW0x\n\n',
    ])
    const { fase, resultado, submeter } = useEditarImagem()

    await submeter(new File(['conteudo'], 'foto.png', { type: 'image/png' }), 'verde_ubatuba')

    expect(fase.value).toBe('gerando')
    expect(resultado.value?.imagemBase64).toBe('ZmFrZS1pbWFnZW0x')
  })

  it('rejeita arquivo invalido sem chamar a api', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { erro, submeter } = useEditarImagem()

    await submeter(new File(['conteudo'], 'foto.webp', { type: 'image/webp' }), 'verde_ubatuba')

    expect(erro.value).toBe('Formato inválido. Envie uma foto JPG ou PNG.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('exige a pedra: sem pedra define erro amigavel e nao chama a api', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { erro, submeter } = useEditarImagem()

    await submeter(new File(['conteudo'], 'foto.png', { type: 'image/png' }), '')

    expect(erro.value).toBe('Escolha a pedra da bancada antes de enviar.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('envia a pedra escolhida na requisicao e conclui o fluxo', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(
          criarStreamSse([
            'data:{"fase":"recebido"}\n\ndata:{"latency_ms":1}\n\ndata:ZmFrZS1pbWFnZW0x\n\n',
          ]),
          { status: 200 },
        ),
      )
    vi.stubGlobal('fetch', fetchMock)
    const { resultado, submeter } = useEditarImagem()

    await submeter(new File(['conteudo'], 'foto.png', { type: 'image/png' }), 'verde_ubatuba')

    const [, init] = fetchMock.mock.calls[0]
    expect(init.body).toBeInstanceOf(FormData)
    expect(init.body.get('pedra')).toBe('verde_ubatuba')
    expect(resultado.value?.imagemBase64).toBe('ZmFrZS1pbWFnZW0x')
  })

  it('limpa a key, avisa e volta ao /token no 401', async () => {
    useAuthStore().entrar('key-valida')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"error":"key invalida"}', { status: 401 })),
    )
    const { submeter } = useEditarImagem()

    await submeter(new File(['conteudo'], 'foto.png', { type: 'image/png' }), 'verde_ubatuba')

    expect(useAuthStore().autenticado).toBe(false)
    expect(ElMessage.error).toHaveBeenCalledWith('API key inválida. Entre novamente.')
    expect(pushMock).toHaveBeenCalledWith('/token')
  })

  it('trata HttpError fora do 401 com mensagem amigavel', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"error":"foto rejeitada"}', { status: 400 })),
    )
    const { erro, submeter } = useEditarImagem()

    await expect(
      submeter(new File(['conteudo'], 'foto.png', { type: 'image/png' }), 'verde_ubatuba'),
    ).resolves.toBeUndefined()

    expect(erro.value).toBe('Não foi possível enviar a foto. Tente novamente.')
  })

  it('reiniciar zera o fluxo mantendo a key', async () => {
    useAuthStore().entrar('key-valida')
    mockarFetchSse([
      'data:{"fase":"recebido"}\n\ndata:{"fase":"gerando"}\n\ndata:{"latency_ms":1}\n\ndata:ZmFrZS1pbWFnZW0x\n\n',
    ])
    const { fase, resultado, erro, submeter, reiniciar } = useEditarImagem()

    await submeter(new File(['conteudo'], 'foto.png', { type: 'image/png' }), 'verde_ubatuba')

    reiniciar()

    expect(fase.value).toBeNull()
    expect(resultado.value).toBeNull()
    expect(erro.value).toBeNull()
    expect(useAuthStore().autenticado).toBe(true)
  })

  it('sinaliza processando durante o envio e desliga ao concluir', async () => {
    let resolver: (resposta: Response) => void
    const respostaPromise = new Promise<Response>((r) => {
      resolver = r
    })
    vi.stubGlobal('fetch', vi.fn().mockReturnValue(respostaPromise))
    const { processando, resultado, submeter } = useEditarImagem()

    const submeterPromise = submeter(
      new File(['conteudo'], 'foto.png', { type: 'image/png' }),
      'verde_ubatuba',
    )

    expect(processando.value).toBe(true)

    resolver!(
      new Response(
        criarStreamSse([
          'data:{"fase":"gerando"}\n\ndata:{"latency_ms":1}\n\ndata:ZmFrZS1pbWFnZW0x\n\n',
        ]),
        { status: 200 },
      ),
    )

    await submeterPromise

    expect(processando.value).toBe(false)
    expect(resultado.value?.imagemBase64).toBe('ZmFrZS1pbWFnZW0x')
  })

  it('nao ativa processando quando a validacao falha', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { processando, submeter } = useEditarImagem()

    await submeter(new File(['conteudo'], 'foto.webp', { type: 'image/webp' }), 'verde_ubatuba')

    expect(processando.value).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
