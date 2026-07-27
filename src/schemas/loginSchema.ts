import { z } from 'zod'

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email é obrigatório' })
    .min(1, 'Email é obrigatório')
    .email('Email inválido')
    .max(254, 'Email pode ter no máximo 254 caracteres'),

  password: z
    .string({ required_error: 'Senha é obrigatória' })
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .max(72, 'Senha deve ter no máximo 72 caracteres'),
})

export type LoginForm = z.infer<typeof loginSchema>
