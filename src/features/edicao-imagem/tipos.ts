import { z } from 'zod'

export const edicaoFaseSchema = z.enum(['recebido', 'redimensionando', 'gerando'])
