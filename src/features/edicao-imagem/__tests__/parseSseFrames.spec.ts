import { describe, it, expect } from 'vitest'
import { parseSseFrames } from '../parseSseFrames'

describe('parseSseFrames', () => {
  it('extrai o payload de um frame completo', () => {
    expect(parseSseFrames('data:{"fase":"recebido"}\n\n')).toEqual({
      frames: ['{"fase":"recebido"}'],
      restante: '',
    })
  })

  it('extrai os payloads de múltiplos frames completos', () => {
    expect(
      parseSseFrames('data:{"fase":"recebido"}\n\ndata:{"fase":"redimensionando"}\n\n'),
    ).toEqual({
      frames: ['{"fase":"recebido"}', '{"fase":"redimensionando"}'],
      restante: '',
    })
  })

  it('ignora frames nomeados como ping', () => {
    const input = 'event:ping\ndata:foo\n\ndata:bar\n\n'

    expect(parseSseFrames(input)).toEqual({ frames: ['bar'], restante: '' })
  })

  it('preserva o restante parcial quando o input não termina com separador', () => {
    expect(parseSseFrames('data:ZmFrZS')).toEqual({ frames: [], restante: 'data:ZmFrZS' })
  })
})
