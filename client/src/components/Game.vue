<template>
  <div id="global-container" class="d-flex flex-column align-center rounded-lg">
    <div
        id="countdown-container"
        class="d-flex justify-space-between align-center"
        :class="footerMinimized ? 'countdown-container-maximized' : undefined"
    >
      <v-progress-linear
          color="amber"
          :model-value="percentage"
          rounded
          striped
          height="20"
      >
        <template #default="{ value }">
          <span
              id="countdown"
              class="countdown"
              :class="{
                'text-green': percentage >= 50,
                'text-yellow': percentage < 50 && percentage >= 20,
                'text-red': percentage < 20,
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
import bus from '@/services/event-bus'
import EndScene from '@/models/scenes/end-scene'
import EventTypes from '@/constants/event-types'
import GameBrawlScene from '@/models/scenes/game-brawl-scene'
import GameFallingApplesScene from '@/models/scenes/game-falling-apples-scene'
import GameFloatingIslandsScene from '@/models/scenes/game-floating-islands-scene'
import GameHotPotatoScene from '@/models/scenes/game-hot-potato-scene'
import GameSpaceVegetablesScene from '@/models/scenes/game-space-vegetables-scene'
import GameStarWarsScene from '@/models/scenes/game-star-wars-scene'
import PacketClientFocus from '@/models/packets/packet-client-focus'
import LobbyScene from '@/models/scenes/lobby-scene'
import LobbyStates from '@/constants/lobby-states'
import Phaser from 'phaser'
import PreGameScene from '@/models/scenes/pre-game-scene'
import PreGameFallScene from '@/models/scenes/pre-game-fall-scene'
import SceneInputs from '@/constants/scene-inputs'
import SceneKeys from '@/constants/scene-keys'
import tickSound from '@/assets/sounds/tick.mp3'
import loopSound from '@/assets/sounds/loop.mp3'

export default {
  data: () => ({
    game: null,
    delay: 0,
    percentage: 100,
    sceneKey: SceneKeys.LOBBY,
    tick: -1,
    tickAudio: new Audio(tickSound),
    loopAudio: new Audio(loopSound),
  }),

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
        this.$store.commit('SET_PLAY_MUSIC_LOOP', { play: value })
      },
    },
  },

  methods: {
    changeScene(sceneKey, data) {
      if (sceneKey) {
        this.game.scene.stop(this.sceneKey)
        this.game.scene.remove(this.sceneKey)
        this.game.scene.add(sceneKey, this.getSceneByKey(sceneKey), true, data)
        this.$store.commit('SET_SCENE_INPUTS', { inputs: SceneInputs[sceneKey] })
        this.sceneKey = sceneKey
      }
    },

    getSceneByKey(sceneKey) {
      switch (sceneKey) {
        case SceneKeys.END: return EndScene
        case SceneKeys.GAME_BRAWL: return GameBrawlScene
        case SceneKeys.GAME_FALLING_APPLES: return GameFallingApplesScene
        case SceneKeys.GAME_FLOATING_ISLANDS: return GameFloatingIslandsScene
        case SceneKeys.GAME_HOT_POTATO: return GameHotPotatoScene
        case SceneKeys.GAME_SPACE_VEGETABLES: return GameSpaceVegetablesScene
        case SceneKeys.GAME_STAR_WARS: return GameStarWarsScene
        case SceneKeys.LOBBY: return LobbyScene
        case SceneKeys.PRE_GAME: return PreGameScene
        case SceneKeys.PRE_GAME_FALL: return PreGameFallScene
      }
    },

    interrupt() {
      if (this.$store.state.lobby.state === LobbyStates.ENDED) {
        this.$store.dispatch('notifyInfo', this.$t('snackbar.info.lobbyEmpty'))
      } else {
        this.$store.dispatch('notifyError', this.$t('snackbar.error.lobbyInterrupted'))
      }

      if (this.$route.path !== '/') this.$router.push('/')
    },

    preventRightClick(event) {
      event.preventDefault()
    },

    handleVisibilityChange() {
      this.$store.dispatch('sendPacket', new PacketClientFocus(!this.$document.hidden))
    },

    resetMusicLoop() {
      this.playMusicLoop = false
      this.loopAudio.currentTime = 0
      this.loopAudio.volume = 0.32
      this.loopAudio.pause()
    },

    tickCountdown({ delay, percentage }) {
      this.delay = delay
      this.percentage = percentage

      if (this.percentage === 0) this.tick = -1

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
    },
  },

  mounted() {
    this.$window.addEventListener('contextmenu', this.preventRightClick)
    this.$document.addEventListener('visibilitychange', this.handleVisibilityChange)
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
      antialias: true,
    })

    this.game.sound.pauseOnBlur = false
    this.loopAudio.loop = true

    this.$store.commit('SET_SCENE_INPUTS', { inputs: SceneInputs[SceneKeys.LOBBY] })

    this.game.scene.add(SceneKeys.LOBBY, LobbyScene, true)
    // L'instance Phaser est exposée globalement pour les composants
    // qui en ont besoin (clavier virtuel, souris). Voir main.js.
    window.$game = this.game
  },

  beforeUnmount() {
    this.resetMusicLoop()
    this.$window.removeEventListener('contextmenu', this.preventRightClick)
    this.$document.removeEventListener('visibilitychange', this.handleVisibilityChange)
    bus.$off(EventTypes.GAME_CHANGE_SCENE)
    bus.$off(EventTypes.GAME_COUNTDOWN)
    bus.$off(EventTypes.LOBBY_INTERRUPT)
    bus.$off(EventTypes.TOGGLE_MUSIC_LOOP)
    // Libère explicitement les captures clavier de Phaser AVANT destroy :
    // sinon les KeyA/KeyD/Space/Arrow etc. enregistrés dans les scènes
    // (Brawl, Star Wars, etc.) peuvent rester bound au document et
    // intercepter les frappes sur la home page (impossible de taper un
    // nouveau code de lobby).
    if (this.game?.input?.keyboard) {
      try { this.game.input.keyboard.clearCaptures() } catch (ignored) { /* noop */ }
      try { this.game.input.keyboard.removeAllKeys(true, true) } catch (ignored) { /* noop */ }
    }
    this.game.destroy(true, false)
    window.$game = null
    // Réinitialise les inputs autorisés (sinon Keyboard.vue/Mouse.vue,
    // s'ils se remontent avant que Phaser ait fini de set up la nouvelle
    // scène, restent verrouillés sur la dernière configuration jouée).
    this.$store.commit('SET_SCENE_INPUTS', { inputs: null })
  },
}
</script>

<style scoped>
:deep(canvas) {
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

/* Le canvas reste carré et fixe en ratio, mais on clampe sa taille au
 * minimum entre la viewport height et la viewport width : sur portrait
 * mobile (iPhone SE 375×667) un width de 60vh = 400 px débordait
 * horizontalement. min(60vh, 90vw) garantit qu'on tient toujours dans
 * l'écran tout en restant carré. */
#countdown-container {
  transition: width 1s;
  box-sizing: content-box;
  width: min(45vh, 90vw);
  height: 50px;
  padding-left: 18px;
  padding-right: 18px;
}

.countdown-container-maximized {
  width: min(60vh, 90vw) !important;
}

#game-wrap {
  border: 3px solid rgba(254, 191, 4, 0.5);
}

#game-container {
  transition: width 1s, height 1s;
  width: min(45vh, 90vw);
  height: min(45vh, 90vw);
}

.game-container-maximized {
  width: min(60vh, 90vw) !important;
  height: min(60vh, 90vw) !important;
}

:deep(.v-progress-linear) {
  overflow: inherit;
}

:deep(.v-progress-linear__determinate) {
  border-radius: 4px;
}
</style>
