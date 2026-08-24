<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { RouterView } from 'vue-router'
import ThemeToggle from './components/ThemeToggle.vue'
import { useAuthStore } from './auth/authStore'
import { useToken } from './auth/useToken'

const { autenticado } = storeToRefs(useAuthStore())
const { sair } = useToken()
</script>

<template>
  <RouterView />

  <ThemeToggle class="theme-toggle" />
  <el-button v-if="autenticado" class="botao-sair" text @click="sair">Sair</el-button>
</template>

<style scoped>
.theme-toggle {
  position: absolute;
  top: 1rem;
  right: 1rem;
}

.botao-sair {
  position: absolute;
  top: 1rem;
  right: 3.5rem;
}
</style>
