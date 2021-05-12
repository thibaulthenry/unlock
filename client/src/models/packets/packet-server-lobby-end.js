import bus from '../../services/event-bus'
import EventTypes from '../../constants/event-types'
import PacketLabels from '../../constants/packet-labels'
import SceneKeys from '../../constants/scene-keys'

export default class PacketServerLobbyEnd {

  constructor(packet) {
    this.label = PacketLabels.SERVER_LOBBY_END
    this.losers = packet.losers || {}
    this.winners = packet.winners || {}
  }

  receive() {
    bus.$emit(EventTypes.GAME_CHANGE_SCENE, {
      key: SceneKeys.END,
      data: {
        losers: this.losers,
        winners: this.winners
      }
    })
    bus.$emit(EventTypes.GAME_COUNTDOWN, {
      delay: 0,
      percentage: 0
    })
  }

}

