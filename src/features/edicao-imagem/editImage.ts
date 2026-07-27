import { despacharFrame } from './despacharFrame'
import { parseSseFrames } from './parseSseFrames'

export type EditImageBuilder = {
  run(): Promise<{ imagemBase64: string }>
}

export function editImage(opts: { apiKey: string; image: Blob }): EditImageBuilder {
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
      for (const payload of parseSseFrames(buffer)) {
        const frame = despacharFrame(payload)
        if (frame?.tipo === 'imagem') {
          imagemBase64 = frame.base64
        }
      }
      buffer = ''
    }

    return { imagemBase64 }
  }

  return { run }
}
