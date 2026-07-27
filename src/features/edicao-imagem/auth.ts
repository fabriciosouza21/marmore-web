import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const autenticado = ref(false)

  const entrar = () => {
    autenticado.value = true
  }

  return { autenticado, entrar }
})
