import bus from '../../services/event-bus'
import EventTypes from '../../constants/event-types'
import PacketLabels from '../../constants/packet-labels'

export default class PacketServerGameStart {

  constructor() {
    this.label = PacketLabels.SERVER_GAME_START
  }

  receive(store) {
    const game = store.state.lobby.getNewestGame()

    if (game) {
      bus.$emit(EventTypes.GAME_CHANGE_SCENE, {
        key: game.sceneKey
      })
    }
  }

}

