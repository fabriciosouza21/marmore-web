import { HttpError } from '../domain/errors'
import { imagemGeradaSchema, type ImagemGerada } from '../domain/types'

export async function listarImagens(opts: { apiKey: string }): Promise<ImagemGerada[]> {
  // Em producao VITE_API_URL aponta para a API (build com .env.production);
  // em dev fica vazia e o proxy do vite encaminha /images para localhost:8080.
  const response = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/images`, {
    headers: { 'X-API-Key': opts.apiKey },
  })

  if (!response.ok) throw new HttpError(response.status)

  return imagemGeradaSchema.array().parse(await response.json())
}

export async function buscarArquivoImagem(opts: { id: string; apiKey: string }): Promise<Blob> {
  const response = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/images/${opts.id}/arquivo`, {
    headers: { 'X-API-Key': opts.apiKey },
  })

  if (!response.ok) throw new HttpError(response.status)

  return response.blob()
}
