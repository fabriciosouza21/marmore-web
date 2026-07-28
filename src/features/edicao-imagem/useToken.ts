import { useAuthStore } from './auth'

export function useToken() {
  const onSubmit = (chave: string) => {
    useAuthStore().entrar(chave)
  }

  return { onSubmit }
}
