import './assets/main.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'


import ElementPlus from 'element-plus'
import ptBr from 'element-plus/es/locale/lang/pt-br'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import { MotionPlugin } from '@vueuse/motion'

const app = createApp(App)

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.use(createPinia())
app.use(router)
app.use(ElementPlus, { locale: ptBr })
app.use(MotionPlugin)



app.mount('#app')
