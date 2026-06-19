import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    component: () => import('@/views/Home.vue'),
  },
  {
    path: '/about',
    component: () => import('@/views/About.vue'),
  },
  {
    name: 'lobbies',
    path: '/lobbies/:code',
    component: () => import('@/views/lobbies/Lobby.vue'),
    props: (route) => ({ lobbyCode: route.params.code }),
  },
  {
    path: '/:catchAll(.*)',
    redirect: '/',
  },
]

export default createRouter({
  history: createWebHistory(),
  routes,
})
