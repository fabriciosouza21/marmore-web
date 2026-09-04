<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useGaleria } from './composables/useGaleria'
import type { ImagemGerada } from './domain/types'

const { imagens, carregando, erro, carregar } = useGaleria()
const router = useRouter()

onMounted(carregar)

function gerarNovaBancada(): void {
  router.push('/captura')
}

function formatarData(criadoEm: string): string {
  return new Date(criadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

function metaDoCartao(item: { imagem: ImagemGerada }): string {
  return [item.imagem.nome_produto, formatarData(item.imagem.criado_em)]
    .filter((parte): parte is string => parte !== null)
    .join(' · ')
}
</script>

<template>
  <section>
    <h2 class="titulo-tela">Imagens geradas</h2>
    <p v-if="carregando">Carregando imagens...</p>
    <el-alert v-else-if="erro" :title="erro" type="error" show-icon>
      <el-button @click="carregar">Tentar novamente</el-button>
    </el-alert>
    <div v-else-if="!imagens.length" class="vazio">
      <p>Nenhuma imagem gerada ainda.</p>
      <el-button class="botao-cheio" type="primary" @click="gerarNovaBancada">
        Gerar primeira bancada
      </el-button>
    </div>
    <template v-else>
      <p>Toque em uma imagem para ampliar.</p>
      <div class="galeria">
        <article v-for="item in imagens" :key="item.imagem.id" class="cartao-imagem">
          <el-image
            :src="item.url"
            fit="cover"
            :preview-src-list="[item.url]"
            preview-teleported
            :hide-on-click-modal="true"
            alt="Imagem gerada"
          />
          <p class="legenda">
            <span v-if="item.imagem.nome_pedra" class="pedra">{{ item.imagem.nome_pedra }}</span>
            <span class="meta">{{ metaDoCartao(item) }}</span>
          </p>
          <p class="descricao" :class="{ 'descricao-vazia': item.imagem.descricao === null }">
            {{ item.imagem.descricao ?? 'Sem descricao' }}
          </p>
        </article>
      </div>
      <el-button class="botao-cheio" type="primary" @click="gerarNovaBancada">
        Gerar nova bancada
      </el-button>
    </template>
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

.vazio p {
  margin: 0 0 0.75rem;
}

.galeria {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.cartao-imagem .el-image {
  display: block;
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: var(--el-border-radius-base);
}

.legenda {
  margin: 0.375rem 0 0;
  font-size: var(--text-label);
  color: var(--el-text-color-secondary);
}

.legenda .pedra {
  display: block;
  color: var(--el-text-color-primary);
  font-weight: 600;
}

.descricao {
  margin: 0.25rem 0 0;
  font-size: var(--text-label);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.descricao-vazia {
  color: var(--el-text-color-secondary);
}

.botao-cheio {
  width: 100%;
  margin-top: 0.75rem;
}
</style>
