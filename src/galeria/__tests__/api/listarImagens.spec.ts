import { describe, it, expect, vi, afterEach } from 'vitest'
import { listarImagens } from '../../api/listarImagens'
import { HttpError } from '../../domain/errors'

describe('listarImagens', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('busca /images com X-API-Key e resolve as imagens validadas', async () => {
    const imagensEsperadas = [
      {
        id: '9f1c3e2a-1b2c-4d3e-8f4a-5b6c7d8e9f0a',
        criado_em: '2026-09-01T12:00:00.000Z',
        modelo: 'gpt-image-1',
        custo_brl: 0.03,
        latencia_ms: 8214,
        pedra: 'verde_ubatuba',
        nome_pedra: 'Verde Ubatuba',
        produto: 'pia-americana',
        nome_produto: 'Pia americana',
      },
      {
        id: '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d',
        criado_em: '2026-09-01T13:30:00.000Z',
        modelo: 'gpt-image-1',
        custo_brl: null,
        latencia_ms: 7102,
        pedra: null,
        nome_pedra: null,
        produto: null,
        nome_produto: null,
      },
    ]
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(imagensEsperadas), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const imagens = await listarImagens({ apiKey: 'minha-key' })

    // VITE_API_URL fica indefinida em teste; em producao o cliente prefixa a URL absoluta.
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/images')
    expect(init.headers).toEqual({ 'X-API-Key': 'minha-key' })
    expect(imagens).toEqual(imagensEsperadas)
  })

  it('rejeita com HttpError quando o backend responde 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"error":"key invalida"}', { status: 401 })),
    )

    await expect(listarImagens({ apiKey: 'k' })).rejects.toThrow(new HttpError(401))
  })

  it('rejeita com erro de validação quando o payload não corresponde a ImagemGerada', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            {
              criado_em: '2026-09-01T12:00:00.000Z',
              modelo: 'gpt-image-1',
              custo_brl: null,
              latencia_ms: 100,
              pedra: null,
              nome_pedra: null,
              produto: null,
              nome_produto: null,
            },
          ]),
          { status: 200 },
        ),
      ),
    )

    // Sem padrão anterior no projeto para falha de validação de JSON:
    // o contrato fixado é rejeitar com Error (ZodError satisfaz).
    await expect(listarImagens({ apiKey: 'k' })).rejects.toThrow()
  })
})
