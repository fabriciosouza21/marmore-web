<script setup lang="ts">
import { RouterView } from 'vue-router'
import ThemeToggle from './components/ThemeToggle.vue'
</script>

<template>
  <RouterView />

  <ThemeToggle class="theme-toggle" />
</template>

<style scoped>
.theme-toggle {
  position: absolute;
  top: 1rem;
  right: 1rem;
}
</style>
