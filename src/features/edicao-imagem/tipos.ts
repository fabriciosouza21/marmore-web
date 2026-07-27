import { z } from 'zod'

export const edicaoFaseSchema = z.enum(['recebido', 'redimensionando', 'gerando'])

export type EdicaoFase = z.infer<typeof edicaoFaseSchema>
