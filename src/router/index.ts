import { createRouter, createWebHistory } from 'vue-router'
import Editor from '@/pages/Editor.vue'
import Gallery from '@/pages/Gallery.vue'
import PrintLayout from '@/pages/PrintLayout.vue'

const routes = [
  {
    path: '/',
    name: 'editor',
    component: Editor,
  },
  {
    path: '/gallery',
    name: 'gallery',
    component: Gallery,
  },
  {
    path: '/print-layout',
    name: 'print-layout',
    component: PrintLayout,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
