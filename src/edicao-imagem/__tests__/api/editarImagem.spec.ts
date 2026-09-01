import { describe, it, expect, vi, afterEach } from 'vitest'
import { editarImagem } from '../../api/editarImagem'
import { EdicaoFalhouError, HttpError } from '../../domain/errors'

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

describe('editarImagem', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('envia FormData multipart com partes image e pedra', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        new Response(criarStreamSse(['data:{"latency_ms":1}\n\ndata:img\n\n']), { status: 200 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    const imagem = new Blob(['conteudo'], { type: 'image/png' })
    await editarImagem({ apiKey: 'minha-key', image: imagem, pedra: 'verde_ubatuba' }).run()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/images/edit')
    expect(init.method).toBe('POST')
    expect(init.body).toBeInstanceOf(FormData)

    const parte = init.body.get('image')
    expect(parte).toBeInstanceOf(Blob)
    expect(parte.type).toBe('image/png')
    await expect(parte.text()).resolves.toBe('conteudo')

    expect(init.body.get('pedra')).toBe('verde_ubatuba')

    expect(init.headers).toEqual({
      'X-API-Key': 'minha-key',
      Accept: 'text/event-stream',
    })
  })

  it('resolve com imagemBase64 quando o stream envia conclusão seguida de imagem', async () => {
    mockarFetchSse(['data:{"latency_ms":12345}\n\ndata:ZmFrZS1pbWFnZW0x\n\n'])

    const result = await editarImagem({
      apiKey: 'k',
      image: new Blob(),
      pedra: 'verde_ubatuba',
    }).run()

    expect(result.imagemBase64).toBe('ZmFrZS1pbWFnZW0x')
  })

  it('reconstrói a imagem quando o frame é dividido entre chunks', async () => {
    mockarFetchSse(['data:{"latency_ms":12345}\n\ndata:ZmFrZS', '1pbWFnZW0x\n\n'])

    const result = await editarImagem({
      apiKey: 'k',
      image: new Blob(),
      pedra: 'verde_ubatuba',
    }).run()

    expect(result.imagemBase64).toBe('ZmFrZS1pbWFnZW0x')
  })

  it('chama o callback onFase para cada fase recebida', async () => {
    mockarFetchSse([
      'data:{"fase":"recebido"}\n\ndata:{"fase":"redimensionando"}\n\ndata:{"fase":"gerando"}\n\ndata:{"latency_ms":1}\n\ndata:img\n\n',
    ])

    const fases: string[] = []
    await editarImagem({ apiKey: 'k', image: new Blob(), pedra: 'verde_ubatuba' })
      .onFase((f) => fases.push(f))
      .run()

    expect(fases).toEqual(['recebido', 'redimensionando', 'gerando'])
  })

  it('rejeita com EdicaoFalhouError quando o stream envia erro de domínio', async () => {
    mockarFetchSse(['data:{"error":"imagem indecodificavel","latency_ms":120}\n\n'])

    await expect(
      editarImagem({ apiKey: 'k', image: new Blob(), pedra: 'verde_ubatuba' }).run(),
    ).rejects.toThrow(new EdicaoFalhouError('imagem indecodificavel', 120))
  })

  it('rejeita com HttpError quando o backend responde 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"error":"key invalida"}', { status: 401 })),
    )

    await expect(
      editarImagem({ apiKey: 'k', image: new Blob(), pedra: 'verde_ubatuba' }).run(),
    ).rejects.toThrow(new HttpError(401))
  })

  it('inclui metadados da conclusão no resultado', async () => {
    mockarFetchSse([
      'data:{"latency_ms":12345,"custo_brl":0.27,"usage":{"input_tokens":1200}}\n\ndata:img\n\n',
    ])

    const result = await editarImagem({
      apiKey: 'k',
      image: new Blob(),
      pedra: 'verde_ubatuba',
    }).run()

    expect(result.metadados).toEqual({
      latencyMs: 12345,
      custoBrl: 0.27,
      usage: { input_tokens: 1200 },
    })
  })

  it('tolera pings entre frames de fase sem interromper o stream', async () => {
    mockarFetchSse([
      'data:{"fase":"recebido"}\n\nevent:ping\ndata:foo\n\ndata:{"fase":"gerando"}\n\ndata:{"latency_ms":1}\n\ndata:img\n\n',
    ])

    const fases: string[] = []
    await editarImagem({ apiKey: 'k', image: new Blob(), pedra: 'verde_ubatuba' })
      .onFase((f) => fases.push(f))
      .run()

    expect(fases).toEqual(['recebido', 'gerando'])
  })
})
