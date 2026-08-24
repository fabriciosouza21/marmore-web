<script setup lang="ts">
import { computed } from 'vue'
import { useEditarImagem } from './composables/useEditarImagem'

const { fase, erro, submeter } = useEditarImagem()

const indicePorFase = { recebido: 0, redimensionando: 1, gerando: 2 }
const indiceFase = computed(() => (fase.value ? indicePorFase[fase.value] : -1))

function aoSelecionar(event: Event): void {
  const input = event.target as HTMLInputElement
  const arquivo = input.files?.[0]
  if (arquivo) submeter(arquivo)
  input.value = ''
}
</script>

<template>
  <section>
    <input type="file" accept="image/*" capture="environment" @change="aoSelecionar" />
    <input type="file" accept="image/jpeg,image/png" @change="aoSelecionar" />

    <el-steps :active="indiceFase" finish-status="success">
      <el-step title="Recebido" />
      <el-step title="Redimensionando" />
      <el-step title="Gerando" />
    </el-steps>

    <el-alert v-if="erro" :title="erro" type="error" show-icon />
  </section>
</template>
