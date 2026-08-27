import { z } from 'zod'

export const tokenSchema = z
  .string({ required_error: 'API key é obrigatória' })
  .min(1, 'API key é obrigatória')
