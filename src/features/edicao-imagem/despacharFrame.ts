import { edicaoFaseSchema } from './tipos'

export type FrameFase = { tipo: 'fase'; valor: string }
export type FrameErro = { tipo: 'erro'; mensagem: string; latencyMs: number }

export type ResultadoFrame = FrameFase | FrameErro

export function despacharFrame(payload: string): ResultadoFrame | null {
  const json = JSON.parse(payload) as { fase?: string; error?: string; latency_ms?: number }

  if (json.fase !== undefined) {
    const fase = edicaoFaseSchema.safeParse(json.fase)
    if (fase.success) {
      return { tipo: 'fase', valor: fase.data }
    }
  }

  if (json.error !== undefined && json.latency_ms !== undefined) {
    return { tipo: 'erro', mensagem: json.error, latencyMs: json.latency_ms }
  }

  return null
}
