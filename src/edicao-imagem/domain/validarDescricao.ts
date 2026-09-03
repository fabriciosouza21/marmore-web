export function validarDescricao(descricao: string): string | null {
  if (descricao.length > 1000) {
    return 'A descrição deve ter no máximo 1000 caracteres.'
  }
  return null
}
