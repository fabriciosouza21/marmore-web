import { z } from 'zod'

export const apiKeySchema = z.string().min(1, 'API key é obrigatória')
