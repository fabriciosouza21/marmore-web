import { edicaoFaseSchema } from './tipos'

export type FrameFase = { tipo: 'fase'; valor: string }

export type ResultadoFrame = FrameFase

export function despacharFrame(payload: string): ResultadoFrame | null {
  const json = JSON.parse(payload) as { fase?: string }

  if (json.fase !== undefined) {
    const fase = edicaoFaseSchema.safeParse(json.fase)
    if (fase.success) {
      return { tipo: 'fase', valor: fase.data }
    }
  }

  return null
}
