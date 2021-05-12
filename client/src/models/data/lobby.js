import LobbyStates from '../../constants/lobby-states'
import lodash from 'lodash'

export default class Lobby {

  constructor(payload) {
    this.capacity = payload.capacity || 5
    this.clients = payload.clients || {}
    this.code = payload.code || null
    this.currentGameUuid = payload.currentGameUuid || null
    this.games = payload.games || {}
    this.owner = payload.owner || null
    this.pointsGoal = payload.pointsGoal || 5
    this.previousGameUuid = payload.previousGameUuid || null
    this.startTime = payload.startTime || null
    this.state = payload.state || LobbyStates.PENDING
  }

  canStart(uuid) {
    return this.owner === uuid && this.state === LobbyStates.PENDING && this.getPlayers().length > 1
  }

  getNewestGame() {
    let game

    if (this.games && this.currentGameUuid) {
      game = this.games[this.currentGameUuid]
    }

    return game
  }

  getPlayers() {
    return this.clients && typeof this.clients === 'object'
        ? lodash.orderBy(Object.values(this.clients).filter(client => !client.spectating), ['points', 'name'], ['desc', 'asc'])
        : []
  }

  getPlayersMap(points, clientPoints) {
    const map = new Map()

    this.getPlayers().forEach(player => {
      if (points && (clientPoints !== null && clientPoints !== undefined)) {
        if (points[player.uuid] === clientPoints) {
          map.set(player.uuid, player)
        }
      } else {
        map.set(player.uuid, player)
      }
    })
    return map
  }

  isFull() {
    return Object.values(this.clients).filter(client => !client.spectating).length >= this.capacity
  }

  isClientPlaying(uuid) {
    return this.clients && this.clients[uuid] && !this.clients[uuid].spectating
  }

}
