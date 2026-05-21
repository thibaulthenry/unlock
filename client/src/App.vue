<template>
  <v-app id="app" theme="dark">
    <Navigation/>

    <v-main style="background: #041336">
      <v-container fluid class="fill-height d-flex flex-column justify-center">
        <v-icon
            class="drawer-button"
            :class="{'drawer-button-active': drawer && $route.name !== 'lobbies'}"
            :color="drawer ? '#febf04' : undefined"
            size="x-large"
            @click.self="drawer = !drawer"
        >
          mdi-{{ $route.name === 'lobbies' ? 'format-list-numbered-rtl' : 'cog-outline'}}
        </v-icon>

        <v-navigation-drawer
            v-model="drawer"
            class="elevation-0"
            :width="$vuetify.display.xs ? undefined : 350"
            theme="dark"
            touchless
        >
          <Leaderboard v-if="$route.name === 'lobbies'"/>
          <Settings v-else/>
        </v-navigation-drawer>

        <router-view/>
      </v-container>
    </v-main>

    <GameFooter v-if="$route.name === 'lobbies'"/>
    <Footer v-else/>
    <Snackbar/>
  </v-app>
</template>

<script>
import Footer from './components/global/Footer.vue'
import GameFooter from './components/global/GameFooter.vue'
import Leaderboard from './components/Leaderboard.vue'
import Navigation from './components/global/Navigation.vue'
import Settings from './components/Settings.vue'
import Snackbar from './components/global/Snackbar.vue'

export default {
  components: {
    Settings,
    Leaderboard,
    Footer,
    GameFooter,
    Navigation,
    Snackbar,
  },

  computed: {
    drawer: {
      get() {
        return this.$store.state.drawer
      },
      set(value) {
        this.$store.commit('SET_DRAWER', { drawer: value })
      },
    },
  },
}
</script>

<style>
html {
  overflow-x: hidden;
  font-family: "Roboto Light", sans-serif;
  -ms-overflow-style: none;
  scrollbar-width: none;
}

html::-webkit-scrollbar {
  display: none;
}

.v-navigation-drawer__content {
  overflow: hidden;
}

.drawer-button {
  position: fixed !important;
  left: 10px;
  top: 12px;
  z-index: 9;
}

.drawer-button-active {
  transform: rotate(-180deg)
}
</style>
