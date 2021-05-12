import bus from '../../services/event-bus'
import EventTypes from '../../constants/event-types'
import PacketLabels from '../../constants/packet-labels'
import SceneKeys from '../../constants/scene-keys'
import store from '../../services/store'

export default class PacketServerGameWait {

  constructor(packet, internal = false) {
    this.label = PacketLabels.SERVER_GAME_WAIT
    this.internal = internal
    this.points = packet.points || {}
    this.previousWinners = packet.previousWinners || {}
  }

  receive() {
    bus.$emit(
        EventTypes.GAME_CHANGE_SCENE,
        {
          key: !this.internal && this.previousWinners[store.state.client?.uuid] ? SceneKeys.PRE_GAME_FALL : SceneKeys.PRE_GAME,
          data: {
            points: this.points,
            previousWinners: this.previousWinners
          }
        },
    )
  }

}

