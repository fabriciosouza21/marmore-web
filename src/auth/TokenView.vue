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
  <el-form @submit.prevent="onSubmit">
    <el-form-item :error="errors.apiKey">
      <el-input v-model="apiKey" v-bind="apiKeyProps" />
    </el-form-item>
  </el-form>
</template>
