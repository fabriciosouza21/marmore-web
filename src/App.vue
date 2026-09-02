<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { RouterView } from 'vue-router'
import ptBr from 'element-plus/es/locale/lang/pt-br'
import ThemeToggle from './components/ThemeToggle.vue'
import { useAuthStore } from './auth/authStore'
import { useToken } from './auth/useToken'

const { autenticado } = storeToRefs(useAuthStore())
const { sair } = useToken()

const versao = __APP_VERSION__
</script>

<template>
  <el-config-provider :locale="ptBr">
    <RouterView />

    <ThemeToggle class="theme-toggle" />
    <el-button v-if="autenticado" class="botao-sair" text @click="sair">Sair</el-button>

    <footer class="rodape-versao">v{{ versao }}</footer>
  </el-config-provider>
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

.rodape-versao {
  margin: 1.5rem 0 0.75rem;
  font-size: var(--text-label);
  color: var(--el-text-color-secondary);
  text-align: center;
}
</style>
