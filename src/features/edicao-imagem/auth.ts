import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const autenticado = ref(false)

  const entrar = () => {
    autenticado.value = true
  }

  const sair = () => {
    autenticado.value = false
  }

  return { autenticado, entrar, sair }
})
