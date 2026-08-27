import { describe, it, expect } from 'vitest'
import { validarFoto } from '../../domain/validarFoto'

const tamanhoMaximoBytes = 25 * 1024 * 1024

describe('validarFoto', () => {
  it('rejeita tipo fora de JPG e PNG com mensagem de formato', () => {
    expect(validarFoto({ tipo: 'image/webp', tamanho: 1024 })).toBe(
      'Formato inválido. Envie uma foto JPG ou PNG.',
    )
  })

  it('rejeita foto maior que 25MB com mensagem de tamanho', () => {
    expect(validarFoto({ tipo: 'image/jpeg', tamanho: tamanhoMaximoBytes + 1 })).toBe(
      'Foto maior que 25MB.',
    )
  })

  it('aceita foto JPG de 1MB', () => {
    expect(validarFoto({ tipo: 'image/jpeg', tamanho: 1024 * 1024 })).toBeNull()
  })

  it('aceita foto PNG de exatamente 25MB', () => {
    expect(validarFoto({ tipo: 'image/png', tamanho: tamanhoMaximoBytes })).toBeNull()
  })
})
