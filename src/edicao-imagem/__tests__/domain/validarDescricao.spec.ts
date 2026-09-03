import { describe, it, expect } from 'vitest'
import { validarDescricao } from '../../domain/validarDescricao'

describe('validarDescricao', () => {
  it('aceita string vazia', () => {
    expect(validarDescricao('')).toBeNull()
  })

  it('aceita string so com espacos', () => {
    expect(validarDescricao('   ')).toBeNull()
  })
})
