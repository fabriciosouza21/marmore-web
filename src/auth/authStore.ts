import { useStorage } from '@vueuse/core'
import { defineStore } from 'pinia'
import { computed } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const apiKey = useStorage('marmore.apiKey', '')

  const autenticado = computed(() => !!apiKey.value)

  const entrar = (chave: string) => {
    apiKey.value = chave
  }

  const sair = () => {
    apiKey.value = null
  }

  return { autenticado, entrar, sair }
})
