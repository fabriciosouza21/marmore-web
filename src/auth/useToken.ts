import { useAuthStore } from './authStore'

export function useToken() {
  const onSubmit = (chave: string) => {
    useAuthStore().entrar(chave)
  }

  return {
    onSubmit,
    sair: () => useAuthStore().sair(),
  }
}
