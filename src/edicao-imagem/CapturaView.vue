<script setup lang="ts">
import { computed } from 'vue'
import { useEditarImagem } from './composables/useEditarImagem'

const { fase, resultado, erro, submeter, reiniciar } = useEditarImagem()

const indicePorFase = { recebido: 0, redimensionando: 1, gerando: 2 }
const indiceFase = computed(() => (fase.value ? indicePorFase[fase.value] : -1))

const dataUrl = computed(() =>
  resultado.value ? `data:image/png;base64,${resultado.value.imagemBase64}` : undefined,
)

function aoSelecionar(event: Event): void {
  const input = event.target as HTMLInputElement
  const arquivo = input.files?.[0]
  if (arquivo) submeter(arquivo)
  input.value = ''
}
</script>

<template>
  <section>
    <div v-if="resultado">
      <img :src="dataUrl" alt="Ambiente editado" />
      <a :href="dataUrl" download="ambiente-editado.png">Baixar</a>
      <p v-if="resultado.metadados?.custoBrl != null">
        {{
          resultado.metadados.custoBrl.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })
        }}
      </p>
      <p v-if="resultado.metadados">
        {{
          (resultado.metadados.latencyMs / 1000).toLocaleString('pt-BR', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })
        }}
        s
      </p>
      <el-button @click="reiniciar">Editar outra foto</el-button>
    </div>

    <div v-show="!resultado">
      <input type="file" accept="image/*" capture="environment" @change="aoSelecionar" />
      <input type="file" accept="image/jpeg,image/png" @change="aoSelecionar" />

      <el-steps :active="indiceFase" finish-status="success">
        <el-step title="Recebido" />
        <el-step title="Redimensionando" />
        <el-step title="Gerando" />
      </el-steps>

      <el-alert v-if="erro" :title="erro" type="error" show-icon>
        <el-button @click="reiniciar">Tentar novamente</el-button>
      </el-alert>
    </div>
  </section>
</template>
