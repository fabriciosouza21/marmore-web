import { despacharFrame } from './despacharFrame'
import { parseSseFrames } from './parseSseFrames'
import type { EdicaoFase } from './tipos'

export type EditImageBuilder = {
  onFase(fn: (fase: EdicaoFase) => void): EditImageBuilder
  run(): Promise<{ imagemBase64: string }>
}

export function editImage(opts: { apiKey: string; image: Blob }): EditImageBuilder {
  let onFaseFn: ((fase: EdicaoFase) => void) | null = null

  const run = async () => {
    const response = await fetch('/images/edit', {
      method: 'POST',
      headers: {
        'X-API-Key': opts.apiKey,
        Accept: 'text/event-stream',
      },
      body: opts.image,
    })

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('stream indisponível')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let imagemBase64 = ''

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const { frames, restante } = parseSseFrames(buffer)
      for (const payload of frames) {
        const frame = despacharFrame(payload)
        if (frame?.tipo === 'fase' && onFaseFn) {
          onFaseFn(frame.valor)
        }
        if (frame?.tipo === 'imagem') {
          imagemBase64 = frame.base64
        }
      }
      buffer = restante
    }

    return { imagemBase64 }
  }

  return {
    onFase(fn: (fase: EdicaoFase) => void) {
      onFaseFn = fn
      return this
    },
    run,
  }
}
