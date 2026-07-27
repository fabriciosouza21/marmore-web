import { describe, it, expect } from 'vitest'
import { despacharFrame } from '../despacharFrame'

describe('despacharFrame', () => {
  it('reconhece um payload de fase', () => {
    expect(despacharFrame('{"fase":"recebido"}')).toEqual({ tipo: 'fase', valor: 'recebido' })
  })
})
