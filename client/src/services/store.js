import {vuexfireMutations, firestoreAction} from 'vuexfire'
import Client from '../models/data/client'
import firestore from './firestore'
import Game from '../models/data/game'
import i18n from './i18n'
import Lobby from '../models/data/lobby'
import PacketLabels from '../constants/packet-labels'
import PacketServerConnection from '../models/packets/packet-server-connection'
import PacketServerCountdown from '../models/packets/packet-server-countdown'
import PacketServerGameStart from '../models/packets/packet-server-game-start'
import PacketServerGameWait from '../models/packets/packet-server-game-wait'
import PacketServerLobbyEnd from '../models/packets/packet-server-lobby-end'
import PacketServerLobbyInterrupt from '../models/packets/packet-server-lobby-interrupt'
import Vuex from 'vuex'
import Vue from 'vue'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    _client: {
      name: 'Player'
    },

    client: new Client({
      name: 'Player'
    }),

    drawer: true,

    footerMinimized: false,

    _game: null,
    game: null,

    _lobby: {
      capacity: 5,
      pointsGoal: 5
    },

    lobby: new Lobby({
      capacity: 5,
      pointsGoal: 5
    }),

    playMusicLoop: false,
    previousWinners: {},

    sceneInputs: {
      keyboard: {
        down: false,
        left: false,
        right: false,
        space: false,
        up: false
      },
      mouse: {
        leftClick: false,
        middleClick: false,
        rightClick: false,
        slide: false
      }
    },

    snackbar: {
      show: false,
      message: '',
      color: ''
    },

    webSocket: null
  },

  mutations: {
    ...vuexfireMutations,

    SET_CLIENT(state, {client}) {
      if (!state._client) {
        state._client = {}
      }

      state._client = client
      state.client = new Client(state._client)
    },

    SET_DRAWER(state, {drawer}) {
      state.drawer = drawer
    },

    SET_FOOTER_MINIMIZED(state, {footerMinimized}) {
      state.footerMinimized = footerMinimized
    },

    SET_GAME(state, {game}) {
      state._game = game
      state.game = new Game(state._game)
    },

    SET_LOBBY_CAPACITY(state, {lobbyCapacity}) {
      if (!state._lobby) {
        state._lobby = {}
      }

      state._lobby.capacity = lobbyCapacity
      state.lobby = new Lobby(state._lobby)
    },

    SET_LOBBY_CODE(state, {lobbyCode}) {
      if (!state._lobby) {
        state._lobby = {}
      }

      state._lobby.code = lobbyCode
      state.lobby = new Lobby(state._lobby)
    },

    SET_LOBBY_POINTS_GOAL(state, {lobbyPointsGoal}) {
      if (!state._lobby) {
        state._lobby = {}
      }

      state._lobby.pointsGoal = lobbyPointsGoal
      state.lobby = new Lobby(state._lobby)
    },

    SET_PLAY_MUSIC_LOOP(state, {play}) {
      state.playMusicLoop = play
    },

    SET_PREVIOUS_WINNERS(state, {winners}) {
      state.previousWinners = winners
    },

    SET_SCENE_INPUTS(state, {inputs}) {
      if (inputs) {
        state.sceneInputs = inputs
      } else {
        state.sceneInputs = {
          keyboard: {
            down: false,
            left: false,
            right: false,
            space: false,
            up: false
          },
          mouse: {
            leftClick: false,
            middleClick: false,
            rightClick: false,
            slide: false
          }
        }
      }
    },

    SET_SNACKBAR(state, {show, message, color}) {
      state.snackbar.show = show
      state.snackbar.message = message
      state.snackbar.color = color
    },

    SET_WEB_SOCKET(state, {webSocket}) {
      state.webSocket = webSocket
    }
  },

  actions: {
    bindLobby: firestoreAction(({state, bindFirestoreRef}) => {
      if (!state.lobby?.code) {
        return
      }

      return bindFirestoreRef(
          '_lobby',
          firestore
              .doc(`/lobbies/${state.lobby.code}`)
              .withConverter({
                fromFirestore(snapshot, options) {
                  const data = snapshot.data(options)
                  state.lobby = new Lobby(data)

                  const game = state.lobby.getNewestGame()
                  if (game) state.game = new Game(game)

                  const client = state.lobby.clients[state.client.uuid]
                  if (client) state.client = new Client(client)

                  return data
                },

                toFirestore(lobby) {
                  return lobby
                }
              })
      )
    }),

    connect(store, lobbyCode) {
      store.commit('SET_LOBBY_CODE', {lobbyCode})

      return new Promise((resolve, reject) => {
        let webSocket = new WebSocket('wss://unlock-server-dvibvdky5q-ew.a.run.app')

        webSocket.onopen = () => {
          store.commit('SET_WEB_SOCKET', {webSocket})
          resolve(true)
        }

        webSocket.onerror = (err) => reject(err)

        webSocket.onmessage = (payload) => {
          store.dispatch('handlePacket', JSON.parse(payload.data))
        }

        webSocket.onclose = () => {
          store.commit('SET_WEB_SOCKET', {webSocket: null})
          resolve(true)
        }
      })
    },

    hideNotification(store, value) {
      store.commit('SET_SNACKBAR', {
        show: false,
        color: value.color,
        message: value.message
      })
    },

    notifyInfo(store, message) {
      store.commit('SET_SNACKBAR', {
        show: true,
        color: '#00b8d5',
        message
      })
    },

    notifyError(store, message) {
      store.commit('SET_SNACKBAR', {
        show: true,
        color: '#630000',
        message
      })
    },

    handlePacket(store, packet) {
      switch (packet.label) {
        case PacketLabels.SERVER_CONNECTION:
          new PacketServerConnection(packet).receive(store)
          break
        case PacketLabels.SERVER_COUNTDOWN:
          new PacketServerCountdown(packet).receive()
          break
        case PacketLabels.SERVER_GAME_START:
          new PacketServerGameStart().receive(store)
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

    sendPacket(store, packet) {
      const webSocket = store.state.webSocket

      if (webSocket) {
        webSocket.send(JSON.stringify(packet))
      } else {
        store.dispatch('notifyError', i18n.t('snackbar.error.packetsLost'))
      }
    },

    unbindLobby: firestoreAction(({unbindFirestoreRef}) => {
      unbindFirestoreRef('_lobby')
    }),
  },

  modules: {}
})
