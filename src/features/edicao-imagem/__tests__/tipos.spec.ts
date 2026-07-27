import { describe, it, expect } from 'vitest'
import { edicaoFaseSchema } from '../tipos'

describe('edicaoFaseSchema', () => {
  it.each(['recebido', 'redimensionando', 'gerando'] as const)(
    'aceita "%s" como fase válida',
    (fase) => {
      expect(edicaoFaseSchema.parse(fase)).toBe(fase)
    },
  )
})
