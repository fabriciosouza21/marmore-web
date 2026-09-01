<script setup lang="ts">
import { onMounted } from 'vue'
import { useGaleria } from './composables/useGaleria'
import type { ImagemGerada } from './domain/types'

const { imagens, carregar } = useGaleria()

onMounted(carregar)

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
      </article>
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
</style>
