import { z } from 'zod'

export const edicaoFaseSchema = z.enum(['recebido', 'redimensionando', 'gerando'])

export type EdicaoFase = z.infer<typeof edicaoFaseSchema>

export const pedraSchema = z.object({
  id: z.string(),
  nome: z.string(),
  categoria: z.string(),
})

export type Pedra = z.infer<typeof pedraSchema>
