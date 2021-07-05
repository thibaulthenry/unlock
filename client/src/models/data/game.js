import GameStates from '../../constants/game-states'
import GameTypes from '../../constants/game-types'
import GameWinConditions from '../../constants/game-win-conditions'

export default class Game {

  constructor(payload) {
    this.data = payload.data || null
    this.duration = payload.duration || null
    this.sceneKey = payload.sceneKey || null
    this.startTime = payload.startTime || null
    this.state = payload.state || GameStates.STARTING
    this.type = payload.type || GameTypes.SOLO
    this.uuid = payload.uuid || null
    this.winCondition = payload.winCondition || GameWinConditions.FIRST
    this.winnersNumber = payload.winnersNumber || 1
    this.winners = payload.winners || {}
    this.winReward = payload.winReward || 1
  }

}
