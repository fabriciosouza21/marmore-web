import { describe, it, expect } from 'vitest'
import { parseSseFrames } from '../parseSseFrames'

describe('parseSseFrames', () => {
  it('extrai o payload de um frame completo', () => {
    expect(parseSseFrames('data:{"fase":"recebido"}\n\n')).toEqual(['{"fase":"recebido"}'])
  })

  it('extrai os payloads de múltiplos frames completos', () => {
    expect(parseSseFrames('data:{"fase":"recebido"}\n\ndata:{"fase":"redimensionando"}\n\n')).toEqual([
      '{"fase":"recebido"}',
      '{"fase":"redimensionando"}',
    ])
  })
})
