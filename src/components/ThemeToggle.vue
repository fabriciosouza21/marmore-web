<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'

// useDark adiciona/remove a classe "dark" no <html>, que é o gatilho
// que o dark/css-vars.css do Element Plus espera.
const isDark = useDark()
const toggleDark = useToggle(isDark)
</script>

<template>
  <el-button circle @click="toggleDark()">
    <el-icon :size="18">
      <Sunny v-if="isDark" />
      <Moon v-else />
    </el-icon>
  </el-button>
</template>
