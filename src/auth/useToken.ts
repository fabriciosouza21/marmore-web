import { useRouter } from 'vue-router'
import { useAuthStore } from './authStore'

export function useToken() {
  const router = useRouter()

  const onSubmit = (chave: string) => {
    useAuthStore().entrar(chave)
  }

  const sair = () => {
    useAuthStore().sair()
    router.push('/token')
  }

  return { onSubmit, sair }
}
