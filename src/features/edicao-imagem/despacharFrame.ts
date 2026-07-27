import { edicaoFaseSchema } from './tipos'

export type FrameFase = { tipo: 'fase'; valor: string }
export type FrameErro = { tipo: 'erro'; mensagem: string; latencyMs: number }
export type FrameConcluido = {
  tipo: 'concluido'
  metadados: { latencyMs: number; custoBrl: number | null; usage: unknown }
}

export type ResultadoFrame = FrameFase | FrameErro | FrameConcluido

export function despacharFrame(payload: string): ResultadoFrame | null {
  const json = JSON.parse(payload) as {
    fase?: string
    error?: string
    latency_ms?: number
    custo_brl?: number | null
    usage?: unknown
  }

  if (json.fase !== undefined) {
    const fase = edicaoFaseSchema.safeParse(json.fase)
    if (fase.success) {
      return { tipo: 'fase', valor: fase.data }
    }
  }

  if (json.error !== undefined && json.latency_ms !== undefined) {
    return { tipo: 'erro', mensagem: json.error, latencyMs: json.latency_ms }
  }

  if (json.latency_ms !== undefined) {
    return {
      tipo: 'concluido',
      metadados: {
        latencyMs: json.latency_ms,
        custoBrl: json.custo_brl ?? null,
        usage: json.usage ?? null,
      },
    }
  }

  return null
}
