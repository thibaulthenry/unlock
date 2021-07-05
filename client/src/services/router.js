import About from '../views/About';
import Home from '../views/Home.vue'
import Lobby from '../views/lobbies/Lobby.vue'
import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

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
        path: '*',
        beforeEnter: (to, from, next) => {
            next({path: '/'})
        }
    }
]

const router = new VueRouter({
    routes,
    mode: 'history',
})

export default router
