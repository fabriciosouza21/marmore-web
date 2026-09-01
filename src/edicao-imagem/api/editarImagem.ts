import { despacharFrame, type ResultadoFrame } from './despacharFrame'
import { EdicaoFalhouError, HttpError } from '../domain/errors'
import { parsearFramesSse } from './parsearFramesSse'
import type { EdicaoFase } from '../domain/types'

type MetadadosEdicao = {
  latencyMs: number
  custoBrl: number | null
  usage: unknown
}

export type ResultadoEdicao = {
  imagemBase64: string
  metadados: MetadadosEdicao | null
}

type EstadoEdicao = {
  imagemBase64: string
  metadados: MetadadosEdicao | null
}

// Atualiza o estado a partir de um frame. Lança EdicaoFalhouError no caso 'erro'.
function aplicarFrame(
  estado: EstadoEdicao,
  frame: ResultadoFrame,
  onFase?: (fase: EdicaoFase) => void,
): void {
  switch (frame.tipo) {
    case 'fase':
      return onFase?.(frame.valor)
    case 'concluido':
      estado.metadados = frame.metadados
      return
    case 'imagem':
      estado.imagemBase64 = frame.base64
      return
    case 'erro':
      throw new EdicaoFalhouError(frame.mensagem, frame.latencyMs)
  }
}

async function consumirStream(
  body: ReadableStream<Uint8Array>,
  onFase?: (fase: EdicaoFase) => void,
): Promise<ResultadoEdicao> {
  const decoder = new TextDecoder()
  const estado: EstadoEdicao = { imagemBase64: '', metadados: null }
  let buffer = ''

  for await (const chunk of body) {
    buffer += decoder.decode(chunk, { stream: true })
    const { frames, restante } = parsearFramesSse(buffer)
    buffer = restante

    for (const payload of frames) {
      const frame = despacharFrame(payload)
      if (frame) aplicarFrame(estado, frame, onFase)
    }
  }

  return estado
}

export type ConstrutorEdicao = {
  onFase(fn: (fase: EdicaoFase) => void): ConstrutorEdicao
  run(): Promise<ResultadoEdicao>
}

export function editarImagem(opts: {
  apiKey: string
  image: Blob
  pedra: string
}): ConstrutorEdicao {
  let onFaseFn: ((fase: EdicaoFase) => void) | null = null

  const run = async (): Promise<ResultadoEdicao> => {
    const body = new FormData()
    body.append('image', opts.image)
    body.append('pedra', opts.pedra)

    // Em producao VITE_API_URL aponta para a API (build com .env.production);
    // em dev fica vazia e o proxy do vite encaminha /images para localhost:8080.
    const response = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/images/edit`, {
      method: 'POST',
      headers: {
        'X-API-Key': opts.apiKey,
        Accept: 'text/event-stream',
      },
      body,
    })

    if (!response.ok) throw new HttpError(response.status)
    if (!response.body) throw new Error('stream indisponível')

    return consumirStream(response.body, onFaseFn ?? undefined)
  }

  return {
    onFase(fn: (fase: EdicaoFase) => void) {
      onFaseFn = fn
      return this
    },
    run,
  }
}
