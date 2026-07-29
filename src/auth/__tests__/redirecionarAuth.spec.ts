import { describe, it, expect } from 'vitest'
import { redirecionarAuth } from '../redirecionarAuth'

describe('redirecionarAuth', () => {
  it('redireciona para /token quando nao autenticado fora de /token', () => {
    expect(redirecionarAuth(false, '/captura')).toBe('/token')
  })

  it('redireciona para /captura quando autenticado acessa /token', () => {
    expect(redirecionarAuth(true, '/token')).toBe('/captura')
  })

  it('nao redireciona quando nao autenticado acessa /token', () => {
    expect(redirecionarAuth(false, '/token')).toBeUndefined()
  })

  it('nao redireciona quando autenticado acessa outra rota', () => {
    expect(redirecionarAuth(true, '/captura')).toBeUndefined()
  })
})
