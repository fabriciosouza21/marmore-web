import { describe, it, expect } from 'vitest'
import { despacharFrame } from '../despacharFrame'

describe('despacharFrame', () => {
  it('reconhece um payload de fase', () => {
    expect(despacharFrame('{"fase":"recebido"}')).toEqual({ tipo: 'fase', valor: 'recebido' })
  })

  it('reconhece um payload de erro de domínio', () => {
    expect(despacharFrame('{"error":"imagem indecodificavel","latency_ms":120}')).toEqual({
      tipo: 'erro',
      mensagem: 'imagem indecodificavel',
      latencyMs: 120,
    })
  })
})
