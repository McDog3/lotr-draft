import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/Home.vue'
import AboutView from '../views/About.vue'
import DraftView from '../views/DraftView.vue'
import LobbyView from '../views/Lobby.vue'

const routes = [
    // { path: '/', name: 'Home', component: HomeView },
    { path: '/about', name: 'About', component: AboutView },
    { path: '/draft', name: 'Draft', component: DraftView },
    { path: '/', redirect: '/lobby' }, // Redirect root to lobby view
    { path: '/lobby', name: 'Lobby', component: LobbyView }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
})

export default router
