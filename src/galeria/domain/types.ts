import { z } from 'zod'

export const imagemGeradaSchema = z.object({
  id: z.string(),
  criado_em: z.string(),
  modelo: z.string(),
  custo_brl: z.number().nullable(),
  latencia_ms: z.number(),
  pedra: z.string().nullable(),
  nome_pedra: z.string().nullable(),
  produto: z.string().nullable(),
  nome_produto: z.string().nullable(),
})

export type ImagemGerada = z.infer<typeof imagemGeradaSchema>
