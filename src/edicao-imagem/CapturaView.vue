<script setup lang="ts">
import { computed, ref } from 'vue'
import { useEditarImagem } from './composables/useEditarImagem'

const { fase, resultado, erro, processando, submeter, reiniciar } = useEditarImagem()

const indicePorFase = { recebido: 0, redimensionando: 1, gerando: 2 }
const rotulosDaFase = {
  recebido: 'Recebido',
  redimensionando: 'Redimensionando',
  gerando: 'Gerando',
}
const rotuloAtual = computed(() =>
  fase.value ? rotulosDaFase[fase.value] : 'Processando a foto...',
)
const percentualFase = computed(() =>
  fase.value ? ((indicePorFase[fase.value] + 1) / 3) * 100 : 0,
)
const ordemDeFases = ['recebido', 'redimensionando', 'gerando'] as const

function classeDoPasso(passo: (typeof ordemDeFases)[number]): string {
  const atual = fase.value ? indicePorFase[fase.value] : -1
  const indice = indicePorFase[passo]
  if (indice < atual) return 'concluido'
  if (indice === atual) return 'atual'
  return 'pendente'
}

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
    <Transition name="surgir">
      <div v-if="resultado" class="cartao-resultado">
        <img :src="dataUrl" alt="Ambiente editado" />
        <a :href="dataUrl" download="ambiente-editado.png">Baixar</a>
        <p class="metadados" v-if="resultado.metadados">
          <span v-if="resultado.metadados.custoBrl != null">
            Custo
            <strong>{{
              resultado.metadados.custoBrl.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })
            }}</strong>
          </span>
          <span>
            Duração
            <strong>{{
              (resultado.metadados.latencyMs / 1000).toLocaleString('pt-BR', {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              })
            }}</strong>
            s
          </span>
        </p>
        <el-button class="botao-cheio" @click="reiniciar">Editar outra foto</el-button>
      </div>
    </Transition>

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
        <el-button class="botao-envio" type="primary" @click="abrirCamera">Tirar foto</el-button>
        <el-button class="botao-envio" @click="abrirArquivo">Enviar arquivo</el-button>
      </template>

      <div v-if="processando || fase" class="progresso">
        <p><span class="girando" aria-hidden="true"></span>{{ rotuloAtual }}</p>
        <ol class="passos">
          <li v-for="passo in ordemDeFases" :key="passo" :class="classeDoPasso(passo)">
            <span class="marcador" aria-hidden="true">{{
              classeDoPasso(passo) === 'concluido' ? '✓' : ''
            }}</span>
            {{ rotulosDaFase[passo] }}
          </li>
        </ol>
        <el-progress :percentage="percentualFase" :show-text="false" :stroke-width="6" />
      </div>

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

h2 {
  margin: 0 0 1rem;
}

.metadados {
  display: flex;
  gap: 1.5rem;
  margin: 0.75rem 0 0;
  font-size: var(--text-label);
  color: var(--el-text-color-secondary);
}

.metadados strong {
  color: var(--el-text-color-primary);
  font-weight: 600;
  margin-left: 0.25rem;
}

.botao-envio {
  width: 100%;
}

.botao-envio + .botao-envio {
  /* zera o margin-left de 12px que o element-plus aplica entre el-buttons */
  margin-left: 0;
  margin-top: 0.75rem;
}

.progresso {
  margin: 1rem 0;
}

.progresso p {
  margin: 0 0 0.5rem;
}

.passos {
  list-style: none;
  margin: 0 0 0.75rem;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  font-size: var(--text-label);
  color: var(--el-text-color-secondary);
}

.passos li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.passos li.atual {
  color: var(--color-primary);
  font-weight: 600;
}

.passos .marcador {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.125em;
  height: 1.125em;
  font-size: 0.8em;
}

.passos li.pendente .marcador {
  border: 1.5px solid currentColor;
  border-radius: 50%;
  opacity: 0.5;
}

.passos li.atual .marcador {
  width: 0.625em;
  height: 0.625em;
  background: var(--color-primary);
  border-radius: 50%;
}

.passos li.concluido .marcador {
  color: var(--color-primary);
}

.cartao-resultado img {
  max-width: 100%;
}

.botao-cheio {
  width: 100%;
  margin-top: 0.75rem;
}
</style>
