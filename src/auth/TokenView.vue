<script setup lang="ts">
import { z } from 'zod'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { useRouter } from 'vue-router'
import { tokenSchema } from './tokenSchema'
import { useToken } from './useToken'

const router = useRouter()
const { handleSubmit, errors, defineField } = useForm<{ apiKey: string }>({
  validationSchema: toTypedSchema(z.object({ apiKey: tokenSchema })),
})
const [apiKey, apiKeyProps] = defineField('apiKey')
const onSubmit = handleSubmit((values) => {
  useToken().onSubmit(values.apiKey)
  router.push('/captura')
})

defineExpose({ onSubmit })
</script>

<template>
  <main>
    <el-card class="token-card">
      <template #header>
        <h2 class="titulo-tela">Acesso à API key</h2>
        <p class="token-descricao">Cole a chave de acesso para usar o editor de fotos.</p>
      </template>

      <el-form @submit.prevent="onSubmit">
        <el-form-item label="API key" :error="errors.apiKey">
          <el-input v-model="apiKey" v-bind="apiKeyProps" placeholder="Cole a API key aqui" />
        </el-form-item>
        <el-button class="botao-entrar" native-type="submit">Entrar</el-button>
      </el-form>
    </el-card>
  </main>
</template>

<style scoped>
main {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 2rem;
  box-sizing: border-box;
}

.token-card {
  width: 100%;
  max-width: 24rem;
}

.token-descricao {
  color: var(--el-text-color-secondary);
  margin: 0.5rem 0 0;
}

.botao-entrar {
  width: 100%;
}
</style>
