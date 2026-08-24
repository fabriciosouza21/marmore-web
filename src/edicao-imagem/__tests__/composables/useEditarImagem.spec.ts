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

    await submeter(new File(['conteudo'], 'foto.png', { type: 'image/png' }))

    expect(fase.value).toBe('gerando')
    expect(resultado.value?.imagemBase64).toBe('ZmFrZS1pbWFnZW0x')
  })

  it('rejeita arquivo invalido sem chamar a api', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { erro, submeter } = useEditarImagem()

    await submeter(new File(['conteudo'], 'foto.webp', { type: 'image/webp' }))

    expect(erro.value).toBe('Formato inválido. Envie uma foto JPG ou PNG.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('limpa a key, avisa e volta ao /token no 401', async () => {
    useAuthStore().entrar('key-valida')
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"error":"key invalida"}', { status: 401 })),
    )
    const { submeter } = useEditarImagem()

    await submeter(new File(['conteudo'], 'foto.png', { type: 'image/png' }))

    expect(useAuthStore().autenticado).toBe(false)
    expect(ElMessage.error).toHaveBeenCalledWith('API key inválida. Entre novamente.')
    expect(pushMock).toHaveBeenCalledWith('/token')
  })
})
