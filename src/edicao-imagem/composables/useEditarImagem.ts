import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
// Importado fora do template, o ElMessage não passa pelo ElementPlusResolver;
// sem o estilo manual, o toast aparece sem formatação.
import 'element-plus/es/components/message/style/css'
import { useAuthStore } from '../../auth/authStore'
import { buscarPedras } from '../api/buscarPedras'
import { editarImagem, type ResultadoEdicao } from '../api/editarImagem'
import { EdicaoFalhouError, HttpError } from '../domain/errors'
import type { EdicaoFase, Pedra } from '../domain/types'
import { validarFoto } from '../domain/validarFoto'

export function useEditarImagem() {
  const auth = useAuthStore()
  const router = useRouter()

  const fase = ref<EdicaoFase | null>(null)
  const resultado = ref<ResultadoEdicao | null>(null)
  const erro = ref<string | null>(null)
  const processando = ref(false)
  const pedras = ref<Pedra[]>([])
  const pedraSelecionada = ref('')
  const descricao = ref('')

  async function carregarPedras(): Promise<void> {
    try {
      pedras.value = await buscarPedras({ apiKey: auth.apiKey })
    } catch (e) {
      if (e instanceof HttpError && e.status === 401) {
        auth.sair()
        ElMessage.error('API key inválida. Entre novamente.')
        router.push('/token')
        return
      }
      erro.value = 'Não foi possível carregar o catálogo de pedras.'
    }
  }

  async function submeter(file: File, pedraId?: string): Promise<void> {
    const mensagem = validarFoto({ tipo: file.type, tamanho: file.size })
    if (mensagem) {
      erro.value = mensagem
      return
    }

    if (pedraId === '') {
      erro.value = 'Escolha a pedra da bancada antes de enviar.'
      return
    }

    processando.value = true
    try {
      resultado.value = await editarImagem({
        apiKey: auth.apiKey,
        image: file,
        pedra: pedraId ?? '',
      })
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
    } finally {
      processando.value = false
    }
  }

  function reiniciar(): void {
    fase.value = null
    resultado.value = null
    erro.value = null
  }

  return {
    fase,
    resultado,
    erro,
    processando,
    pedras,
    pedraSelecionada,
    descricao,
    carregarPedras,
    submeter,
    reiniciar,
  }
}
