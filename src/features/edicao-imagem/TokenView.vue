<script setup lang="ts">
import { z } from 'zod'
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { apiKeySchema } from './apiKeySchema'
import { useToken } from './useToken'

const { handleSubmit, errors, defineField } = useForm<{ apiKey: string }>({
  validationSchema: toTypedSchema(z.object({ apiKey: apiKeySchema })),
})
const [apiKey, apiKeyProps] = defineField('apiKey')
const onSubmit = handleSubmit((values) => useToken().onSubmit(values.apiKey))
</script>

<template>
  <form @submit.prevent="onSubmit">
    <input v-model="apiKey" v-bind="apiKeyProps" />
    <span v-if="errors.apiKey">{{ errors.apiKey }}</span>
  </form>
</template>
