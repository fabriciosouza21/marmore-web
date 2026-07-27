<script setup lang="ts">
import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { loginSchema, type LoginForm } from '@/schemas/loginSchema'

const { defineField, handleSubmit, errors } = useForm<LoginForm>({
  validationSchema: toTypedSchema(loginSchema),
  initialValues: { email: '', password: '' },
})

const [email, emailProps] = defineField('email')
const [password, passwordProps] = defineField('password')

const onSubmit = handleSubmit((values: LoginForm) => {
  console.log('submit', values)
})
</script>

<template>
  <div class="login">
    <el-card
      v-motion
      class="login__card"
      :initial="{ opacity: 0, y: 50, scale: 0.95 }"
      :enter="{ opacity: 1, y: 0, scale: 1, transition: { duration: 400 } }"
    >
      <template #header>
        <h2 class="login__title">Login</h2>
      </template>

      <el-form label-position="top" @submit.prevent="onSubmit">
        <el-form-item label="Email" :error="errors.email">
          <el-input
            v-model="email"
            v-bind="emailProps"
            placeholder="voce@exemplo.com"
          >
            <template #prefix>
              <el-icon><Message /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="Senha" :error="errors.password">
          <el-input
            v-model="password"
            v-bind="passwordProps"
            type="password"
            placeholder="••••••••"
            show-password
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-button type="primary" native-type="submit" @click="onSubmit">
          Entrar
        </el-button>
      </el-form>
    </el-card>
  </div>
</template>

<style scoped>
.login {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
}

.login__card {
  width: 400px;
}

.login__title {
  margin: 0;
  font-size: 1.25rem;
}
</style>
