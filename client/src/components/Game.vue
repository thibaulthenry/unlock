<template>
  <div id="global-container" class="d-flex flex-column align-center rounded-lg">
    <div
        id="countdown-container"
        class="d-flex justify-space-between align-center"
        :class="footerMinimized ? 'countdown-container-maximized' : undefined"
    >
      <v-progress-linear
          color="amber"
          :value="percentage"
          rounded
          striped
          height="20"
      >
        <template v-slot:default="{ value }">
          <span
              id="countdown"
              class="countdown"
              :class="{
                'green--text': percentage >= 50,
                'yellow--text': percentage < 50 && percentage >= 20,
                'red--text': percentage < 20,
              }"
          >
            {{ Math.ceil((value * delay) / 100) }}
          </span>
        </template>
      </v-progress-linear>
    </div>
    <div id="game-wrap">
      <div
          id="game-container"
          class="ma-0"
          :class="footerMinimized ? 'game-container-maximized' : undefined"
      />
    </div>
  </div>
</template>

<script>
import bus from '../services/event-bus'
import EndScene from '../models/scenes/end-scene'
import EventTypes from '../constants/event-types'
import GameFallingApplesScene from '../models/scenes/game-falling-apples-scene'
import GameFloatingIslandsScene from '../models/scenes/game-floating-islands-scene'
import GameSpaceVegetablesScene from '../models/scenes/game-space-vegetables-scene'
import GameStarWarsScene from '../models/scenes/game-star-wars-scene'
import LobbyScene from '../models/scenes/lobby-scene'
import LobbyStates from '../constants/lobby-states'
import PacketClientFocus from '../models/packets/packet-client-focus'
import Phaser from 'phaser'
import PreGameScene from '../models/scenes/pre-game-scene'
import PreGameFallScene from '../models/scenes/pre-game-fall-scene'
import SceneInputs from '../constants/scene-inputs'
import SceneKeys from '../constants/scene-keys'
import Vue from 'vue'

export default {
  data: () => {
    return {
      game: null,
      delay: 0,
      percentage: 100,
      sceneKey: SceneKeys.LOBBY,
      tick: -1,
      tickAudio: new Audio(require('../assets/sounds/tick.mp3')),
      loopAudio: new Audio(require('../assets/sounds/loop.mp3'))
    }
  },

  computed: {
    footerMinimized() {
      return this.$store.state.footerMinimized
    },

    lobby() {
      return this.$store.state.lobby
    },

    playMusicLoop: {
      get() {
        return this.$store.state.playMusicLoop
      },

      set(value) {
        this.$store.commit('SET_PLAY_MUSIC_LOOP', {play: value})
      }
    }
  },

  methods: {
    changeFocusState(state) {
      this.$store.dispatch('sendPacket', new PacketClientFocus(state))
    },

    changeScene(sceneKey, data) {
      if (sceneKey) {
        this.game.scene.stop(this.sceneKey)
        this.game.scene.remove(this.sceneKey)
        this.game.scene.add(sceneKey, this.getSceneByKey(sceneKey), true, data)
        this.$store.commit('SET_SCENE_INPUTS', {inputs: SceneInputs[sceneKey]})
        this.sceneKey = sceneKey
      }
    },

    getSceneByKey(sceneKey) {
      switch (sceneKey) {
        case SceneKeys.END:
          return EndScene
        case SceneKeys.GAME_FALLING_APPLES:
          return GameFallingApplesScene
        case SceneKeys.GAME_FLOATING_ISLANDS:
          return GameFloatingIslandsScene
        case SceneKeys.GAME_SPACE_VEGETABLES:
          return GameSpaceVegetablesScene
        case SceneKeys.GAME_STAR_WARS:
          return GameStarWarsScene
        case SceneKeys.LOBBY:
          return LobbyScene
        case SceneKeys.PRE_GAME:
          return PreGameScene
        case SceneKeys.PRE_GAME_FALL:
          return PreGameFallScene
      }
    },

    interrupt() {
      if (this.$store.state.lobby.state === LobbyStates.ENDED) {
        this.$store.dispatch('notifyInfo', this.$t('snackbar.info.lobbyEmpty'))
      } else {
        this.$store.dispatch('notifyError', this.$t('snackbar.error.lobbyInterrupted'))
      }

      if (this.$route.path !== '/') {
        this.$router.push('/')
      }
    },

    preventRightClick(event) {
      event.preventDefault()
    },

    resetMusicLoop() {
      this.playMusicLoop = false
      this.loopAudio.currentTime = 0
      this.loopAudio.volume = 0.32
      this.loopAudio.pause()
    },

    tickCountdown({delay, percentage}) {
      this.delay = delay

      this.percentage = percentage

      if (this.percentage === 0) {
        this.tick = -1
      }

      const tick = Math.ceil((percentage * delay) / 100)

      if (percentage < 20 && tick !== this.tick) {
        this.tick = tick
        this.tickAudio.play()
      }
    },

    toggleMusicLoop(reset = false) {
      if (reset) {
        this.resetMusicLoop()
        this.loopAudio.play()
      }

      if (this.playMusicLoop) {
        this.loopAudio.volume = 0
        this.playMusicLoop = false
      } else {
        this.loopAudio.volume = 0.32
        this.playMusicLoop = true
      }
    }
  },

  mounted() {
    this.$window.addEventListener('contextmenu', this.preventRightClick)
    bus.$emit(EventTypes.LISTEN_MOUSE_EVENTS)
    bus.$on(EventTypes.GAME_CHANGE_SCENE, (args) => this.changeScene(args.key, args.data))
    bus.$on(EventTypes.GAME_COUNTDOWN, this.tickCountdown)
    bus.$on(EventTypes.LOBBY_INTERRUPT, this.interrupt)
    bus.$on(EventTypes.TOGGLE_MUSIC_LOOP, this.toggleMusicLoop)

    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game-container',
      width: 600,
      height: 600,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      resizeInterval: 10,
      antialias: true
    })

    this.game.events.on('visible', () => this.changeFocusState(true))
    this.game.events.on('hidden', () => this.changeFocusState(false))

    this.game.sound.pauseOnBlur = false
    this.loopAudio.loop = true

    this.$store.commit('SET_SCENE_INPUTS', {inputs: SceneInputs[SceneKeys.LOBBY]})

    this.game.scene.add(SceneKeys.LOBBY, LobbyScene, true)
    Vue.prototype.$game = this.game
  },

  beforeDestroy() {
    this.resetMusicLoop()
    this.$window.removeEventListener('contextmenu', this.preventRightClick)
    this.game.events.off('visible')
    bus.$off(EventTypes.GAME_CHANGE_SCENE)
    bus.$off(EventTypes.GAME_COUNTDOWN)
    bus.$off(EventTypes.LOBBY_INTERRUPT)
    bus.$off(EventTypes.TOGGLE_MUSIC_LOOP)
    this.game.destroy(true, false)
  }
}
</script>

<style scoped>
::v-deep canvas {
  margin: 0 !important;
}

#global-container {
  background-size: contain;
  background-position: center;
  background-repeat: repeat-y;
  background-image: url("../assets/images/game_background.png");
  padding-bottom: 20px;
}

#countdown {
  text-align: center;
  font-weight: bold;
  width: 32px;
  border-radius: 100px;
  background-color: #041336;
  border: 3px #a37c08 solid;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

#countdown-container {
  transition: width 1s;
  box-sizing: content-box;
  width: 45vh;
  height: 50px;
  padding-left: 18px;
  padding-right: 18px;
}

.countdown-container-maximized {
  width: 60vh !important;
}

#game-wrap {
  border: 3px solid rgba(254, 191, 4, 0.5);
}

#game-container {
  transition: width 1s, height 1s;
  width: 45vh;
  height: 45vh;
}

.game-container-maximized {
  width: 60vh !important;
  height: 60vh !important;
}

::v-deep .v-progress-linear {
  overflow: inherit;
}

::v-deep .v-progress-linear__determinate {
  border-radius: 4px;
}
</style>
