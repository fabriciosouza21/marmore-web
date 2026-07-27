import { describe, it, expect, vi, afterEach } from 'vitest'
import { editImage } from '../editImage'

function criarStreamSse(payload: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder()
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(payload))
      controller.close()
    },
  })
}

function mockarFetchSse(payload: string): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(new Response(criarStreamSse(payload), { status: 200 })),
  )
}

describe('editImage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('resolve com imagemBase64 quando o stream envia conclusão seguida de imagem', async () => {
    const payload =
      'data:{"latency_ms":12345}\n\ndata:ZmFrZS1pbWFnZW0x\n\n'
    mockarFetchSse(payload)

    const result = await editImage({ apiKey: 'k', image: new Blob() }).run()

    expect(result.imagemBase64).toBe('ZmFrZS1pbWFnZW0x')
  })
})
