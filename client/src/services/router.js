import About from '../views/About'
import Home from '../views/Home.vue'
import Lobby from '../views/lobbies/Lobby.vue'
import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        component: Home
    },
    {
        path: '/about',
        component: About
    },
    {
        name: 'lobbies',
        path: '/lobbies/:code',
        component: Lobby,
        props: (route) => ({lobbyCode: route.params.code})
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/'
    }
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes,
})

export default router
