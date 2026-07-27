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

  it('reconhece um payload de conclusão', () => {
    expect(
      despacharFrame('{"latency_ms":12345,"custo_brl":0.27,"usage":{"input_tokens":1200}}'),
    ).toEqual({
      tipo: 'concluido',
      metadados: { latencyMs: 12345, custoBrl: 0.27, usage: { input_tokens: 1200 } },
    })
  })

  it('reconhece um payload de imagem em base64 cru', () => {
    const base64 = 'iVBORw0KGgoAAAANSUhEUgAA'

    expect(despacharFrame(base64)).toEqual({ tipo: 'imagem', base64 })
  })
})
