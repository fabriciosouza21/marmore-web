import { onScopeDispose, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
// Importado fora do template, o ElMessage não passa pelo ElementPlusResolver;
// sem o estilo manual, o toast aparece sem formatação.
import 'element-plus/es/components/message/style/css'
import { useAuthStore } from '../../auth/authStore'
import { buscarArquivoImagem, listarImagens } from '../api/listarImagens'
import { HttpError } from '../domain/errors'
import type { ImagemGerada } from '../domain/types'

export function useGaleria() {
  const auth = useAuthStore()
  const router = useRouter()

  const imagens = ref<{ imagem: ImagemGerada; url: string }[]>([])
  const carregando = ref(true)
  const erro = ref<string | null>(null)

  function revogarUrls(): void {
    for (const item of imagens.value) URL.revokeObjectURL(item.url)
  }

  async function carregar(): Promise<void> {
    carregando.value = true
    erro.value = null
    try {
      const lista = await listarImagens({ apiKey: auth.apiKey })
      const blobs = await Promise.all(
        lista.map((im) => buscarArquivoImagem({ id: im.id, apiKey: auth.apiKey })),
      )
      revogarUrls()
      imagens.value = lista.map((im, i) => ({ imagem: im, url: URL.createObjectURL(blobs[i]) }))
    } catch (e) {
      if (e instanceof HttpError && e.status === 401) {
        auth.sair()
        ElMessage.error('API key inválida. Entre novamente.')
        router.push('/token')
        return
      }
      erro.value = 'Não foi possível carregar as imagens.'
    } finally {
      carregando.value = false
    }
  }

  onScopeDispose(revogarUrls)

  return { imagens, carregando, erro, carregar }
}
