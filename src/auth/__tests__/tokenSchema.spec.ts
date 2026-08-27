import { describe, it, expect } from 'vitest'
import { tokenSchema } from '../tokenSchema'

describe('tokenSchema', () => {
  it('rejeita string vazia', () => {
    expect(tokenSchema.safeParse('').success).toBe(false)
  })

  it('rejeita undefined com mensagem pt-BR de obrigatório', () => {
    const result = tokenSchema.safeParse(undefined)

    expect(result.error?.issues[0]?.message).toBe('API key é obrigatória')
  })
})
