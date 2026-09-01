import { describe, it, expect, vi, afterEach } from 'vitest'
import { buscarPedras } from '../../api/buscarPedras'
import { HttpError } from '../../domain/errors'

describe('buscarPedras', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('busca /pedras com X-API-Key e resolve as pedras validadas', async () => {
    const pedrasEsperadas = [{ id: 'verde_ubatuba', nome: 'Verde Ubatuba', categoria: 'Granitos' }]
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(pedrasEsperadas), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const pedras = await buscarPedras({ apiKey: 'minha-key' })

    // VITE_API_URL fica indefinida em teste; em producao o cliente prefixa a URL absoluta.
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/pedras')
    expect(init.headers).toEqual({ 'X-API-Key': 'minha-key' })
    expect(pedras).toEqual(pedrasEsperadas)
  })

  it('rejeita com HttpError quando o backend responde 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{"error":"key invalida"}', { status: 401 })),
    )

    await expect(buscarPedras({ apiKey: 'k' })).rejects.toThrow(new HttpError(401))
  })

  it('rejeita com erro de validação quando o payload não corresponde a Pedra', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          new Response(JSON.stringify([{ id: 'x', categoria: 'Granitos' }]), { status: 200 }),
        ),
    )

    // Sem padrão anterior no projeto para falha de validação de JSON:
    // o contrato fixado é rejeitar com Error (ZodError satisfaz).
    await expect(buscarPedras({ apiKey: 'k' })).rejects.toThrow()
  })
})
