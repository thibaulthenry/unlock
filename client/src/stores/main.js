import { defineStore } from 'pinia'
import Client from '@/models/data/client'
import Game from '@/models/data/game'
import Lobby from '@/models/data/lobby'
import PacketLabels from '@/constants/packet-labels'
import PacketServerConnection from '@/models/packets/packet-server-connection'
import PacketServerCountdown from '@/models/packets/packet-server-countdown'
import PacketServerGameStart from '@/models/packets/packet-server-game-start'
import PacketServerGameWait from '@/models/packets/packet-server-game-wait'
import PacketServerLobbyEnd from '@/models/packets/packet-server-lobby-end'
import PacketServerLobbyInterrupt from '@/models/packets/packet-server-lobby-interrupt'
import i18n from '@/services/i18n'

const defaultSceneInputs = () => ({
  keyboard: { down: false, left: false, right: false, space: false, up: false },
  mouse: { leftClick: false, middleClick: false, rightClick: false, slide: false },
})

export const useMainStore = defineStore('main', {
  state: () => ({
    client: new Client({ name: 'Player' }),
    drawer: true,
    footerMinimized: false,
    game: null,
    lobby: new Lobby({ capacity: 5, pointsGoal: 5 }),
    playMusicLoop: false,
    previousWinners: {},
    sceneInputs: defaultSceneInputs(),
    snackbar: { show: false, message: '', color: '' },
    webSocket: null,
  }),

  actions: {
    setClient({ client }) {
      this.client = new Client(client)
    },

    setDrawer({ drawer }) {
      this.drawer = drawer
    },

    setFooterMinimized({ footerMinimized }) {
      this.footerMinimized = footerMinimized
    },

    setGame({ game }) {
      this.game = game ? new Game(game) : null
    },

    setLobbyCapacity({ lobbyCapacity }) {
      this.lobby = new Lobby({ ...this.lobby, capacity: lobbyCapacity })
    },

    setLobbyCode({ lobbyCode }) {
      this.lobby = new Lobby({ ...this.lobby, code: lobbyCode })
    },

    setLobbyPointsGoal({ lobbyPointsGoal }) {
      this.lobby = new Lobby({ ...this.lobby, pointsGoal: lobbyPointsGoal })
    },

    setPlayMusicLoop({ play }) {
      this.playMusicLoop = play
    },

    setPreviousWinners({ winners }) {
      this.previousWinners = winners
    },

    setSceneInputs({ inputs }) {
      this.sceneInputs = inputs || defaultSceneInputs()
    },

    setSnackbar({ show, message, color }) {
      this.snackbar.show = show
      this.snackbar.message = message
      this.snackbar.color = color
    },

    setWebSocket({ webSocket }) {
      this.webSocket = webSocket
    },

    applyLobbySnapshot(data) {
      if (!data) return
      const lobby = new Lobby(data)
      this.lobby = lobby

      const newest = lobby.getNewestGame()
      if (newest) this.game = new Game(newest)

      const client = lobby.clients?.[this.client.uuid]
      if (client) this.client = new Client(client)
    },

    notifyInfo(message) {
      this.setSnackbar({ show: true, color: '#00b8d5', message })
    },

    notifyError(message) {
      this.setSnackbar({ show: true, color: '#630000', message })
    },

    hideNotification(value) {
      this.setSnackbar({ show: false, color: value.color, message: value.message })
    },

    connect(lobbyCode) {
      this.setLobbyCode({ lobbyCode })
      const url = import.meta.env.VITE_WEBSOCKET_URL || 'wss://unlock-server-dvibvdky5q-ew.a.run.app'

      return new Promise((resolve, reject) => {
        const webSocket = new WebSocket(url)

        webSocket.onopen = () => {
          this.setWebSocket({ webSocket })
          resolve(true)
        }

        webSocket.onerror = (err) => reject(err)

        webSocket.onmessage = (payload) => this.handlePacket(JSON.parse(payload.data))

        webSocket.onclose = () => {
          this.setWebSocket({ webSocket: null })
          resolve(true)
        }
      })
    },

    handlePacket(packet) {
      switch (packet.label) {
        case PacketLabels.SERVER_CONNECTION:
          new PacketServerConnection(packet).receive(this)
          break
        case PacketLabels.SERVER_COUNTDOWN:
          new PacketServerCountdown(packet).receive()
          break
        case PacketLabels.SERVER_GAME_START:
          new PacketServerGameStart().receive(this)
          break
        case PacketLabels.SERVER_GAME_WAIT:
          new PacketServerGameWait(packet).receive()
          break
        case PacketLabels.SERVER_LOBBY_END:
          new PacketServerLobbyEnd(packet).receive()
          break
        case PacketLabels.SERVER_LOBBY_INTERRUPT:
          new PacketServerLobbyInterrupt().receive()
          break
      }
    },

    sendPacket(packet) {
      if (this.webSocket) {
        this.webSocket.send(JSON.stringify(packet))
      } else {
        this.notifyError(i18n.global.t('snackbar.error.packetsLost'))
      }
    },
  },
})

export default useMainStore
