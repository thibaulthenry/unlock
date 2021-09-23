import SpriteColors from '../../constants/sprite-colors'
import store from '../../services/store'

export default class Client {

  constructor(payload) {
    this.focus = payload.focus || false
    this.name = payload.name || null
    this.points = payload.points || 0
    this.spectating = payload.spectating || false
    this.spriteColor = payload.spriteColor || SpriteColors.BLUE
    this.uuid = payload.uuid || null
  }

  getFloor() {
    return store.state.lobby.pointsGoal - this.points
  }

}
