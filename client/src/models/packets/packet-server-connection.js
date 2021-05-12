import PacketLabels from '../../constants/packet-labels'

export default class PacketServerConnection {

  constructor(payload) {
    this.label = PacketLabels.SERVER_CONNECTION
    this.client = payload.client || null
    this.lobbyCode = payload.lobbyCode || null
  }

  receive(store) {
    store.commit('SET_CLIENT', {client: this.client})
    store.commit('SET_LOBBY_CODE', {lobbyCode: this.lobbyCode})
  }

}
