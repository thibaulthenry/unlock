import bus from '../../services/event-bus'
import EventTypes from '../../constants/event-types'
import PacketLabels from '../../constants/packet-labels'

export default class PacketServerLobbyInterrupt {

  constructor() {
    this.label = PacketLabels.SERVER_LOBBY_INTERRUPT
  }

  receive() {
    bus.$emit(EventTypes.LOBBY_INTERRUPT)
  }

}

