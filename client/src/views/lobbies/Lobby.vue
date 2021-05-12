<template>
  <v-row style="width: 100%; height: 100%" class="d-flex justify-center">
    <v-col v-if="connected && lobby && lobby.code" class="d-flex justify-center align-center">
      <Game ref="game"/>
    </v-col>

    <v-col v-else class="d-flex align-center flex-column">
      <v-progress-linear
          color="deep-purple accent-4"
          indeterminate
          rounded
          height="6"
      />

      <span class="white--text text-overline">Connecting..</span>
    </v-col>
  </v-row>
</template>

<script>
import i18n from '../../services/i18n'
import Game from '../../components/Game'
import Lobby from '../../models/data/lobby'
import PacketClientConnection from '../../models/packets/packet-client-connection'
import store from '../../services/store'

export default {
  components: {Game},

  transition: 'fade',

  data: () => {
    return {
      connected: false,
      connectionTask: null,
      connectionTimeout: null,
    }
  },

  computed: {
    lobby() {
      return this.$store.state.lobby
    }
  },

  watch: {
    '$store.state.webSocket': function (value) {
      if (!value && this.$route.path !== '/') {
        store.dispatch('notifyError',  this.$t('snackbar.error.connectionLost'))
        this.$router.push('/')
      }
    },
  },

  methods: {
    interruptConnection(errorMessage) {
      if (this.connectionTask) {
        clearInterval(this.connectionTask)
      }

      if (this.connectionTimeout) {
        clearTimeout(this.connectionTimeout)
      }

      if (errorMessage) {
        this.$store.dispatch('notifyError', this.$t(errorMessage))

        if (this.$route.path !== '/') {
          this.$router.push('/')
        }
      }
    }
  },

  async beforeRouteEnter(to, from, next) {
    const lobbyCode = to.params.code

    if (!lobbyCode) {
      await store.dispatch('notifyInfo', i18n.t('snackbar.error.lobbyCodeMissing'))
      next('/')
      return
    }

    try {
      let startConnectionProcess = await store.dispatch('connect', lobbyCode)

      if (typeof startConnectionProcess === 'boolean' && startConnectionProcess) {
        await store.dispatch('sendPacket', new PacketClientConnection(store.state.client?.name, store.state.lobby?.capacity, lobbyCode, store.state.lobby?.pointsGoal))
      }

      store.commit('SET_DRAWER', {drawer: false})
      next()
    } catch (ignored) {
      await store.dispatch('notifyError', i18n.t('snackbar.error.connectionServerUnreachable'))
      next('/')
    }
  },

  created() {
    if (this.$vuetify.breakpoint.mobile) {
      return
    }

    this.unwatchConnectedState = this.$watch('connected', (value) => {
      if (value) {
        this.$store.commit('SET_DRAWER', {drawer: true})
        this.unwatchConnectedState()
      }
    })
  },

  mounted() {
    this.connectionTask = setInterval(() => {
      if (!this.$store.state.lobby?.code) {
        return
      }

      if (this.connected) {
        this.interruptConnection()
        return
      }

      this.$fire.doc(`/lobbies/${this.$store.state.lobby.code}`).get()
          .then(snapshot => {
            if (!snapshot.exists) {
              this.interruptConnection('snackbar.error.lobbyUnknown')
              return
            }

            const lobby = new Lobby(snapshot.data())

            this.connected = lobby.isClientPlaying(this.$store.state.client?.uuid)

            if (this.connected) {
              this.$store.dispatch('bindLobby')
              return
            }

            if (lobby.isFull()) {
              this.interruptConnection('snackbar.error.lobbyFull')
              return
            }

            if (lobby.state > 1) {
              this.interruptConnection('snackbar.error.lobbyAlreadyStarted')
            }
          })
    }, 500)

    this.connectionTimeout = setTimeout(() => {
      clearInterval(this.connectionTask)

      if (!this.connected) {
        this.interruptConnection('snackbar.error.connectionFailed')
      }
    }, 5000)
  },

  beforeDestroy() {
    this.$store.dispatch('unbindLobby')
    this.$store.commit('SET_DRAWER', {drawer: false})
    this.$store.commit('SET_GAME', {game: {}})
    if (this.unwatchConnectedState) this.unwatchConnectedState()

    if (this.$store.state.webSocket) {
      this.$store.state.webSocket.close()
    }
  },
}
</script>

<style scoped>
</style>
