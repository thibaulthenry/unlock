import PacketLabels from '../../constants/packet-labels'

export default class PacketClientConnection {

  constructor(clientName, lobbyCapacity, lobbyCode, lobbyPointsGoal) {
    this.label = PacketLabels.CLIENT_CONNECTION
    this.clientName = (clientName || 'Player').substr(0, 20)
    this.lobbyCapacity = lobbyCapacity || 5
    this.lobbyCode = lobbyCode || null
    this.lobbyPointsGoal = lobbyPointsGoal || 5
  }

}
