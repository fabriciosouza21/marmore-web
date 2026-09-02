import { fileURLToPath, URL } from 'node:url'
import { readFileSync } from 'node:fs'
import type { ClientRequest } from 'node:http'

import { defineConfig, type ProxyOptions } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

// Versão do package.json exposta ao bundle como __APP_VERSION__ (rodapé do app).
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf-8'),
) as { version: string }

// O CORS da API so libera a origem de producao; o navegador manda Origin
// mesmo em same-origin (POST) e o proxy repassava, o que dava 403 no dev.
// Remover o Origin no proxy devolve o dev a ser same-origin de verdade.
const proxyApi: ProxyOptions = {
  target: 'http://localhost:8080',
  changeOrigin: true,
  configure: (proxy) =>
    proxy.on('proxyReq', (proxyReq: ClientRequest) => proxyReq.removeHeader('origin')),
}

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
	    AutoImport({
      imports: [
        'vue',
        'vue-router',
        'pinia',
      ],
      dts: 'src/auto-imports.d.ts',
    }),
	Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts',
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/images': proxyApi,
      '/pedras': proxyApi,
    },
  },
})
