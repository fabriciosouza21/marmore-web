import { HttpError } from '../domain/errors'
import { pedraSchema, type Pedra } from '../domain/types'

export async function buscarPedras(opts: { apiKey: string }): Promise<Pedra[]> {
  // Em producao VITE_API_URL aponta para a API (build com .env.production);
  // em dev fica vazia e o proxy do vite encaminha /pedras para localhost:8080.
  const response = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/pedras`, {
    headers: { 'X-API-Key': opts.apiKey },
  })

  if (!response.ok) throw new HttpError(response.status)

  return pedraSchema.array().parse(await response.json())
}

export async function buscarImagemPedra(opts: { id: string; apiKey: string }): Promise<Blob> {
  const response = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/pedras/${opts.id}/imagem`, {
    headers: { 'X-API-Key': opts.apiKey },
  })

  if (!response.ok) throw new HttpError(response.status)

  return response.blob()
}
