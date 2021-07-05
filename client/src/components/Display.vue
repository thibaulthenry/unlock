<template>
  <v-card
      dark
      :width="$vuetify.breakpoint.mobile ? '90%' : '50%'"
      class="display-info"
  >
    <v-tooltip top>
      <template v-slot:activator="{ on, attrs }">
        <v-icon
            class="resize-button"
            :color="minimized ? '#febf04' : undefined"
            :disabled="lobby && lobby.state === lobbyStates.PENDING"
            dark
            @click.self="minimized = !minimized"
            v-bind="attrs"
            v-on="on"
        >
          mdi-{{ minimized ? 'arrow-expand-vertical' : 'arrow-collapse-vertical' }}
        </v-icon>
      </template>
      {{ $t(minimized ? 'display.buttons.expand' : 'display.buttons.collapse') }}
    </v-tooltip>

    <v-tooltip top>
      <template v-slot:activator="{ on, attrs }">
        <v-icon
            class="music-button"
            :color="playMusicLoop ? '#febf04' : undefined"
            :disabled="!(lobby && lobby.state >= lobbyStates.STARTED)"
            dark
            @click.self="toggleMusicLoop"
            v-bind="attrs"
            v-on="on"
        >
          mdi-{{ playMusicLoop ? 'music' : 'music-off' }}
        </v-icon>
      </template>
      {{ $t(playMusicLoop ? 'display.buttons.musicOff' : 'display.buttons.musicOn') }}
    </v-tooltip>

    <v-tooltip top>
      <template v-slot:activator="{ on, attrs }">
        <v-icon
            class="quit-button"
            dark
            @dblclick.self="quit"
            v-bind="attrs"
            v-on="on"
        >
          mdi-exit-to-app
        </v-icon>
      </template>
      {{ $t('display.buttons.quit') }}
    </v-tooltip>

    <v-card-title
        class="d-flex justify-center font-italic pt-2"
        :class="$vuetify.breakpoint.xsOnly ? 'mt-8': undefined"
        style="font-size: 18px"
    >
      <span v-if="lobby && lobby.state === lobbyStates.PENDING">
        {{ $t('lobby.states.pending') }}
      </span>

      <span
          v-if="lobby && lobby.state === lobbyStates.STARTING"
          class="green--text"
      >
        {{ $t('lobby.states.starting') }}
      </span>

      <span
          v-if="lobby && lobby.state === lobbyStates.STARTING_IMMINENT"
          class="amber--text darken-3"
      >
        {{ $t('lobby.states.startingImminent') }}
      </span>

      <span
          v-if="lobby && lobby.state === lobbyStates.STARTED && game && game.state !== gameStates.STARTED"
          class="green--text"
      >
        {{ $t('lobby.states.game.starting') }}
      </span>

      <span
          v-if="lobby && lobby.state === lobbyStates.STARTED && game && game.state === gameStates.STARTED"
          class="red--text darken-3"
      >
        {{ $t('lobby.states.game.started') }}
      </span>

      <span v-if="lobby && lobby.state === lobbyStates.ENDED">
        {{ $t('lobby.states.ended') }}
      </span>
    </v-card-title>

    <v-card-subtitle
        class="d-flex justify-center font-weight-bold text-button white--text pb-0"
        style="min-height: 45px"
    >
      <v-btn
          v-if="client && lobby && lobby.canStart(client.uuid)"
          :loading="loadingStart"
          color="light-green accent-2"
          class="ma-2"
          @click="throttleStart"
          light
          small
      >
        {{ $t('buttons.lobby.start') }}
      </v-btn>

      <span v-if="lobby && lobby.state === lobbyStates.STARTED && game && game.sceneKey">
        {{ $t('display.names.' + game.sceneKey) }}
      </span>

      <v-btn
          v-if="client && lobby && lobby.state === lobbyStates.ENDED"
          color="amber"
          class="ma-2"
          @click="quit"
          light
          small
      >
        {{ $t('buttons.lobby.leave') }}
      </v-btn>
    </v-card-subtitle>

    <v-card-text
        class="d-flex justify-center pb-0 text-center"
        style="min-height: 68px; white-space: pre-line"
    >
      <span v-if="game && game.sceneKey && lobby.state === lobbyStates.STARTED">
        {{ $t('display.tips.game.' + game.sceneKey) }}</span>

      <span v-if="lobby && lobby.state === lobbyStates.PENDING">
        {{ $t('display.tips.lobby.pending') }}
      </span>

      <span v-if="lobby && lobby.state === lobbyStates.STARTING && slots > 0">
        {{ $t('display.tips.lobby.starting', {slots}) }}
      </span>

      <span v-if="lobby && lobby.state === lobbyStates.STARTING && slots === 0">
        {{ $t('display.tips.lobby.startingFull') }}
      </span>

      <span v-if="lobby && lobby.state === lobbyStates.STARTING_IMMINENT">
        {{ $t('display.tips.lobby.startingImminent') }}
      </span>
    </v-card-text>
  </v-card>
</template>

<script>
import bus from '../services/event-bus'
import EventTypes from '../constants/event-types'
import GameStates from '../constants/game-states'
import LobbyStates from '../constants/lobby-states'
import PacketClientLobbyStart from '../models/packets/packet-client-lobby-start'

export default {
  data: () => {
    return {
      gameStates: GameStates,
      loadingStart: false,
      lobbyStates: LobbyStates,
      throttleStart: null
    }
  },

  computed: {
    client() {
      return this.$store.state.client
    },

    game() {
      return this.$store.state.game
    },

    lobby() {
      return this.$store.state.lobby
    },

    minimized: {
      get() {
        return this.$store.state.footerMinimized
      },

      set(value) {
        this.$store.commit('SET_FOOTER_MINIMIZED', {footerMinimized: value})
      }
    },

    playMusicLoop() {
      return this.$store.state.playMusicLoop
    },

    slots() {
      return this.lobby ? this.lobby.capacity - this.lobby.getPlayers().length : 0
    }
  },

  methods: {
    quit() {
      if (this.$route.path !== '/') {
        this.$router.push('/')
      }
    },

    start() {
      if (!this.lobby?.canStart(this.client?.uuid)) {
        return
      }

      this.$store.dispatch('sendPacket', new PacketClientLobbyStart())
    },

    toggleMusicLoop() {
      bus.$emit(EventTypes.TOGGLE_MUSIC_LOOP)
    }
  },

  created() {
    this.throttleStart = this.$_.throttle(() => {
      this.loadingStart = true
      this.start()
      setTimeout(() => this.loadingStart = false, 3000)
    }, 3000)
  }
}
</script>

<style scoped>
::v-deep .display-info {
  background-position: center !important;
  background-repeat: repeat-y !important;
  background-image: url("../assets/images/game_background.png") !important;
  opacity: 0.6;
}

.resize-button {
  position: absolute;
  left: 10px;
  top: 10px;
  z-index: 9;
}

.music-button {
  position: absolute;
  left: 40px;
  top: 10px;
  z-index: 9;
}

.quit-button {
  position: absolute;
  right: 10px;
  top: 10px;
  z-index: 9;
}

.quit-button:hover {
  cursor: pointer;
}
</style>
