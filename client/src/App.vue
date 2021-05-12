<template>
  <v-app id="app">
    <Navigation/>

    <v-main style="background: #041336">
      <v-container fluid fill-height class="d-flex flex-column justify-center">
        <v-icon
            class="drawer-button"
            :class="{'drawer-button-active': drawer && $route.name !== 'lobbies'}"
            :color="drawer ? '#febf04' : undefined"
            dark
            x-large
            @click.self="drawer = !drawer"
        >
          mdi-{{ $route.name === 'lobbies' ? 'format-list-numbered-rtl' : 'cog-outline'}}
        </v-icon>

        <v-navigation-drawer
            v-model="drawer"
            class="elevation-0"
            :width="$vuetify.breakpoint.xs ? '100%' : '350px'"
            absolute
            dark
            touchless
            hide-overlay
        >
          <Ladder v-if="$route.name === 'lobbies'"/>
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
import Footer from "./components/global/Footer"
import GameFooter from "./components/global/GameFooter"
import Navigation from './components/global/Navigation'
import Snackbar from "./components/global/Snackbar"
import Ladder from "./components/Ladder"
import Settings from "./components/Settings"

export default {
  components: {
    Settings,
    Ladder,
    Footer,
    GameFooter,
    Navigation,
    Snackbar
  },

  computed: {
    drawer: {
      get() {
        return this.$store.state.drawer
      },

      set(value) {
        this.$store.commit('SET_DRAWER', {drawer: value})
      }
    }
  }
}
</script>

<style>
html {
  overflow-x: hidden;
  font-family: "Roboto Light", sans-serif;
  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */
}

html::-webkit-scrollbar {
  display: none;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity .5s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
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
