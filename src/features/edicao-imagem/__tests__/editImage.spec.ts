import { describe, it, expect, vi, afterEach } from 'vitest'
import { editImage } from '../editImage'

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

describe('editImage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('resolve com imagemBase64 quando o stream envia conclusão seguida de imagem', async () => {
    mockarFetchSse(['data:{"latency_ms":12345}\n\ndata:ZmFrZS1pbWFnZW0x\n\n'])

    const result = await editImage({ apiKey: 'k', image: new Blob() }).run()

    expect(result.imagemBase64).toBe('ZmFrZS1pbWFnZW0x')
  })

  it('reconstrói a imagem quando o frame é dividido entre chunks', async () => {
    mockarFetchSse(['data:{"latency_ms":12345}\n\ndata:ZmFrZS', '1pbWFnZW0x\n\n'])

    const result = await editImage({ apiKey: 'k', image: new Blob() }).run()

    expect(result.imagemBase64).toBe('ZmFrZS1pbWFnZW0x')
  })

  it('chama o callback onFase para cada fase recebida', async () => {
    mockarFetchSse([
      'data:{"fase":"recebido"}\n\ndata:{"fase":"redimensionando"}\n\ndata:{"fase":"gerando"}\n\ndata:{"latency_ms":1}\n\ndata:img\n\n',
    ])

    const fases: string[] = []
    await editImage({ apiKey: 'k', image: new Blob() })
      .onFase((f) => fases.push(f))
      .run()

    expect(fases).toEqual(['recebido', 'redimensionando', 'gerando'])
  })
})
