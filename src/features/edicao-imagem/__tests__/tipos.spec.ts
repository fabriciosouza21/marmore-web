import { describe, it, expect } from 'vitest'
import { edicaoFaseSchema } from '../tipos'

describe('edicaoFaseSchema', () => {
  it('aceita "recebido" como fase válida', () => {
    expect(edicaoFaseSchema.parse('recebido')).toBe('recebido')
  })

  it('aceita "redimensionando" como fase válida', () => {
    expect(edicaoFaseSchema.parse('redimensionando')).toBe('redimensionando')
  })
})
