import bus from '@/services/event-bus'
import EventTypes from '@/constants/event-types'
import PacketLabels from '@/constants/packet-labels'
import SceneKeys from '@/constants/scene-keys'
import { useMainStore } from '@/stores/main'

export default class PacketServerGameWait {

  constructor(packet, internal = false) {
    this.label = PacketLabels.SERVER_GAME_WAIT
    this.initialisation = packet.initialisation || false
    this.internal = internal
    this.points = packet.points || {}
    this.previousWinners = packet.previousWinners || {}
  }

  receive() {
    const store = useMainStore()

    bus.$emit(
      EventTypes.GAME_CHANGE_SCENE,
      {
        key: !this.internal && this.previousWinners[store.client?.uuid] ? SceneKeys.PRE_GAME_FALL : SceneKeys.PRE_GAME,
        data: {
          points: this.points,
          previousWinners: this.previousWinners
        }
      },
    )

    if (this.initialisation) {
      bus.$emit(EventTypes.TOGGLE_MUSIC_LOOP, true)
    }

    store.setPreviousWinners({ winners: this.previousWinners })
  }

}
