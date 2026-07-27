import { describe, it, expect } from 'vitest'
import { apiKeySchema } from '../apiKeySchema'

describe('apiKeySchema', () => {
  it('rejeita string vazia', () => {
    expect(apiKeySchema.safeParse('').success).toBe(false)
  })

  it('rejeita undefined com mensagem pt-BR de obrigatório', () => {
    const result = apiKeySchema.safeParse(undefined)

    expect(result.error?.issues[0]?.message).toBe('API key é obrigatória')
  })
})
