<script setup lang="ts">
import { z } from 'zod'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { apiKeySchema } from './apiKeySchema'

const { handleSubmit, errors, defineField } = useForm<{ apiKey: string }>({
  validationSchema: toTypedSchema(z.object({ apiKey: apiKeySchema })),
  initialValues: { apiKey: '' },
})
const [apiKey] = defineField('apiKey')
const onSubmit = handleSubmit(() => {})
</script>

<template>
  <form @submit.prevent="onSubmit">
    <input v-model="apiKey" />
    <span v-if="errors.apiKey">{{ errors.apiKey }}</span>
  </form>
</template>
