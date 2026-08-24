import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../auth/authStore'
import { editarImagem, type ResultadoEdicao } from '../api/editarImagem'
import { EdicaoFalhouError, HttpError } from '../domain/errors'
import type { EdicaoFase } from '../domain/types'
import { validarFoto } from '../domain/validarFoto'

export function useEditarImagem() {
  const auth = useAuthStore()
  const router = useRouter()

  const fase = ref<EdicaoFase | null>(null)
  const resultado = ref<ResultadoEdicao | null>(null)
  const erro = ref<string | null>(null)

  async function submeter(file: File): Promise<void> {
    const mensagem = validarFoto({ tipo: file.type, tamanho: file.size })
    if (mensagem) {
      erro.value = mensagem
      return
    }

    try {
      resultado.value = await editarImagem({ apiKey: auth.apiKey, image: file })
        .onFase((f) => {
          fase.value = f
        })
        .run()
    } catch (e) {
      if (e instanceof HttpError && e.status === 401) {
        auth.sair()
        ElMessage.error('API key inválida. Entre novamente.')
        router.push('/token')
        return
      }
      if (e instanceof EdicaoFalhouError) {
        erro.value = e.message
        return
      }
      if (e instanceof HttpError) {
        erro.value = 'Não foi possível enviar a foto. Tente novamente.'
        return
      }
      throw e
    }
  }

  function reiniciar(): void {
    fase.value = null
    resultado.value = null
    erro.value = null
  }

  return { fase, resultado, erro, submeter, reiniciar }
}
