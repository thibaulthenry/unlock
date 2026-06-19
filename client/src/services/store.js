// Façade Vuex-compatible exposée via app.config.globalProperties.$store et
// importable directement. Elle adapte les appels .commit/.dispatch/.state
// vers la store Pinia (`useMainStore`). Maintenue pour préserver le code
// historique des composants et des scènes Phaser ; le nouveau code devrait
// utiliser directement `useMainStore()`.

import { useMainStore } from '@/stores/main'

const mutationToAction = {
  SET_CLIENT: 'setClient',
  SET_DRAWER: 'setDrawer',
  SET_FOOTER_MINIMIZED: 'setFooterMinimized',
  SET_GAME: 'setGame',
  SET_LOBBY_CAPACITY: 'setLobbyCapacity',
  SET_LOBBY_CODE: 'setLobbyCode',
  SET_LOBBY_POINTS_GOAL: 'setLobbyPointsGoal',
  SET_PLAY_MUSIC_LOOP: 'setPlayMusicLoop',
  SET_PREVIOUS_WINNERS: 'setPreviousWinners',
  SET_SCENE_INPUTS: 'setSceneInputs',
  SET_SNACKBAR: 'setSnackbar',
  SET_WEB_SOCKET: 'setWebSocket',
}

const adapter = {
  get state() {
    return useMainStore()
  },

  commit(type, payload) {
    const fn = mutationToAction[type]
    if (!fn) throw new Error(`Unknown mutation: ${type}`)
    useMainStore()[fn](payload)
  },

  dispatch(type, payload) {
    const store = useMainStore()
    if (typeof store[type] !== 'function') {
      throw new Error(`Unknown action: ${type}`)
    }
    return store[type](payload)
  },
}

export default adapter
