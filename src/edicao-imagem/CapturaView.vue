<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditarImagem } from './composables/useEditarImagem'

const { fase, resultado, erro, processando, submeter, reiniciar } = useEditarImagem()

const indicePorFase = { recebido: 0, redimensionando: 1, gerando: 2 }
const indiceFase = computed(() => (fase.value ? indicePorFase[fase.value] : -1))

const dataUrl = computed(() =>
  resultado.value ? `data:image/png;base64,${resultado.value.imagemBase64}` : undefined,
)

const inputCamera = ref<HTMLInputElement | null>(null)
const inputArquivo = ref<HTMLInputElement | null>(null)

function abrirCamera(): void {
  inputCamera.value?.click()
}

function abrirArquivo(): void {
  inputArquivo.value?.click()
}

function aoSelecionar(event: Event): void {
  const input = event.target as HTMLInputElement
  const arquivo = input.files?.[0]
  if (arquivo) submeter(arquivo)
  input.value = ''
}
</script>

<template>
  <section>
    <h2 class="titulo-tela">Editar foto do ambiente</h2>
    <div v-if="resultado" class="cartao-resultado">
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
      <el-button class="botao-cheio" @click="reiniciar">Editar outra foto</el-button>
    </div>

    <div v-show="!resultado">
      <p v-if="!fase && !processando && !erro">
        Tire uma foto do ambiente ou envie um arquivo JPG/PNG.
      </p>

      <input
        ref="inputCamera"
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        @change="aoSelecionar"
      />
      <input
        ref="inputArquivo"
        type="file"
        accept="image/jpeg,image/png"
        hidden
        @change="aoSelecionar"
      />

      <template v-if="!processando">
        <el-button class="botao-envio" @click="abrirCamera">Tirar foto</el-button>
        <el-button class="botao-envio" @click="abrirArquivo">Enviar arquivo</el-button>
      </template>

      <p v-if="processando">
        <span class="girando" aria-hidden="true"></span>
        Processando a foto...
      </p>

      <el-steps simple :active="indiceFase" finish-status="success">
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

<style scoped>
section {
  max-width: 28rem;
  margin-inline: auto;
  padding: 1rem;
}

.botao-envio {
  width: 100%;
}

.botao-envio + .botao-envio {
  margin-top: 0.75rem;
}

.cartao-resultado img {
  max-width: 100%;
}

.botao-cheio {
  width: 100%;
  margin-top: 0.75rem;
}
</style>
