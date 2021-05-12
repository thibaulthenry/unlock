import bus from '../../services/event-bus'
import EventTypes from '../../constants/event-types'
import PacketLabels from '../../constants/packet-labels'

export default class PacketServerCountdown {

  constructor(payload) {
    this.label = PacketLabels.SERVER_GAME_WAIT
    this.delay = payload.delay || 0
    this.percentage = payload.percentage || 100
  }

  receive() {
    bus.$emit(EventTypes.GAME_COUNTDOWN, {
      delay: this.delay,
      percentage: this.percentage
    })
  }

}
