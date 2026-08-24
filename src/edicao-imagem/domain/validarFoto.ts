const tiposAceitos = ['image/jpeg', 'image/png']
const tamanhoMaximoBytes = 25 * 1024 * 1024

export function validarFoto(foto: { tipo: string; tamanho: number }): string | null {
  if (!tiposAceitos.includes(foto.tipo)) {
    return 'Formato inválido. Envie uma foto JPG ou PNG.'
  }
  if (foto.tamanho > tamanhoMaximoBytes) {
    return 'Foto maior que 25MB.'
  }
  return null
}
