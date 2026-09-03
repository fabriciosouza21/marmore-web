import { describe, it, expect } from 'vitest'
import { validarDescricao } from '../../domain/validarDescricao'

describe('validarDescricao', () => {
  it('aceita string vazia', () => {
    expect(validarDescricao('')).toBeNull()
  })

  it('aceita string so com espacos', () => {
    expect(validarDescricao('   ')).toBeNull()
  })

  it('aceita descricao com exatamente 1000 caracteres', () => {
    expect(validarDescricao('a'.repeat(1000))).toBeNull()
  })

  it('rejeita descricao com 1001 caracteres', () => {
    expect(validarDescricao('a'.repeat(1001))).toBe(
      'A descrição deve ter no máximo 1000 caracteres.'
    )
  })
})
