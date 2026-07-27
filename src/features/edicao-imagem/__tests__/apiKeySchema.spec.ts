import { describe, it, expect } from 'vitest'
import { apiKeySchema } from '../apiKeySchema'

describe('apiKeySchema', () => {
  it('rejeita string vazia', () => {
    expect(apiKeySchema.safeParse('').success).toBe(false)
  })
})
