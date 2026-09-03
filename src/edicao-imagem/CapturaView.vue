<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { buscarImagemPedra } from './api/buscarPedras'
import { useEditarImagem } from './composables/useEditarImagem'
import type { Pedra } from './domain/types'
import { useAuthStore } from '../auth/authStore'

const {
  fase,
  resultado,
  erro,
  processando,
  pedras,
  pedraSelecionada,
  descricao,
  submeter,
  reiniciar,
  carregarPedras,
} = useEditarImagem()
const router = useRouter()
const auth = useAuthStore()

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

const gruposDePedras = computed(() => {
  const grupos: { categoria: string; pedras: Pedra[] }[] = []
  for (const pedra of pedras.value) {
    const grupo = grupos.find((g) => g.categoria === pedra.categoria)
    if (grupo) grupo.pedras.push(pedra)
    else grupos.push({ categoria: pedra.categoria, pedras: [pedra] })
  }
  return grupos
})

const arquivo = ref<File | null>(null)
const amostra = ref<string | null>(null)
let urlAmostra: string | null = null

onMounted(() => {
  carregarPedras()
})

watch(pedraSelecionada, async (id) => {
  if (urlAmostra) URL.revokeObjectURL(urlAmostra)
  urlAmostra = null
  amostra.value = null
  if (!id) return
  try {
    const blob = await buscarImagemPedra({ id, apiKey: auth.apiKey })
    urlAmostra = URL.createObjectURL(blob)
    amostra.value = urlAmostra
  } catch {
    // a amostra é cosmética: falha ao carregar apenas omite a imagem
  }
})

onBeforeUnmount(() => {
  if (urlAmostra) URL.revokeObjectURL(urlAmostra)
})

const inputCamera = ref<HTMLInputElement | null>(null)
const inputArquivo = ref<HTMLInputElement | null>(null)

function abrirCamera(): void {
  inputCamera.value?.click()
}

function abrirArquivo(): void {
  inputArquivo.value?.click()
}

function aoEscolherArquivo(event: Event): void {
  const input = event.target as HTMLInputElement
  const escolhido = input.files?.[0]
  if (escolhido) arquivo.value = escolhido
  input.value = ''
}

function gerar(): void {
  if (!arquivo.value) return
  submeter(arquivo.value, pedraSelecionada.value, descricao.value)
}

function reiniciarFluxo(): void {
  arquivo.value = null
  descricao.value = ''
  reiniciar()
}

function retomarEdicao(): void {
  reiniciar()
}

function verImagensGeradas(): void {
  router.push('/galeria')
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
        <el-button class="botao-cheio" @click="retomarEdicao"
          >Ajustar e gerar outra versão</el-button
        >
        <el-button class="botao-cheio" @click="reiniciarFluxo">Editar outra foto</el-button>
      </div>
    </Transition>

    <div v-show="!resultado">
      <p>Escolha a pedra da bancada</p>
      <el-select v-model="pedraSelecionada" placeholder="Selecione a pedra" class="seletor-pedra">
        <el-option-group
          v-for="grupo in gruposDePedras"
          :key="grupo.categoria"
          :label="grupo.categoria"
        >
          <el-option
            v-for="pedra in grupo.pedras"
            :key="pedra.id"
            :label="pedra.nome"
            :value="pedra.id"
          />
        </el-option-group>
      </el-select>
      <img v-if="amostra" :src="amostra" alt="Amostra da pedra" class="amostra-pedra" />

      <p>Tire uma foto do ambiente ou envie um arquivo JPG/PNG.</p>

      <input
        ref="inputCamera"
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        @change="aoEscolherArquivo"
      />
      <input
        ref="inputArquivo"
        type="file"
        accept="image/jpeg,image/png"
        hidden
        @change="aoEscolherArquivo"
      />

      <template v-if="!processando">
        <el-button class="botao-envio" @click="abrirCamera">Tirar foto</el-button>
        <el-button class="botao-envio" @click="abrirArquivo">Enviar arquivo</el-button>
      </template>

      <p>Descreva como o ambiente vai ficar depois da obra</p>
      <el-input
        v-model="descricao"
        type="textarea"
        :rows="3"
        placeholder="Ex.: do lado da janela haverá um balcão; na mureta, a bancada da pia; acima, um espelho e um balcão."
      />
      <p class="contador-descricao">{{ descricao.length }} / 1000</p>

      <el-button
        class="botao-cheio"
        type="primary"
        :disabled="!pedraSelecionada || !arquivo || processando"
        @click="gerar"
      >
        Gerar bancada
      </el-button>

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
        <el-button @click="reiniciarFluxo">Tentar novamente</el-button>
      </el-alert>
    </div>

    <el-button class="botao-secundario" @click="verImagensGeradas">Ver imagens geradas</el-button>
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

.seletor-pedra {
  width: 100%;
}

.amostra-pedra {
  display: block;
  width: 100%;
  margin-top: 0.75rem;
  border-radius: var(--el-border-radius-base);
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

.contador-descricao {
  margin: 0.25rem 0 0;
  font-size: var(--text-label);
  color: var(--el-text-color-secondary);
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

.cartao-resultado .botao-cheio + .botao-cheio {
  /* zera o margin-left de 12px que o element-plus aplica entre el-buttons */
  margin-left: 0;
}

.botao-secundario {
  width: 100%;
  margin-top: 0.75rem;
  margin-left: 0;
}
</style>
