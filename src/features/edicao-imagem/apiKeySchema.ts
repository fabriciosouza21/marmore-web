import { z } from 'zod'

export const apiKeySchema = z
  .string({ required_error: 'API key é obrigatória' })
  .min(1, 'API key é obrigatória')
